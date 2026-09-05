const express = require("express");
const multer = require("multer");
const dns = require("dns").promises;
const net = require("net");
const db = require("../config/database");
const uploadToOracle = require("../utils/oracleUpload");
const authMiddleware = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
let tourSchemaReady = false;
let tourHotspotColumnsCache = null;

const MAX_IMPORT_BYTES = 25 * 1024 * 1024;

function isPrivateOrReservedIp(ip) {
  if (net.isIP(ip) === 4) {
    const [a, b] = ip.split(".").map(Number);
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  if (net.isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    if (lower === "::1") return true;
    if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) return true;
    return false;
  }
  return true; // couldn't classify — refuse rather than risk it
}

async function ensureTourSchema() {
  if (tourSchemaReady) return;

  await db.query(`
    CREATE TABLE IF NOT EXISTS tours (
      id SERIAL PRIMARY KEY,
      property_id INTEGER,
      name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tour_scenes (
      id SERIAL PRIMARY KEY,
      tour_id INTEGER NOT NULL,
      scene_id TEXT NOT NULL,
      name TEXT NOT NULL,
      image_url TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tour_hotspots (
      id SERIAL PRIMARY KEY,
      tour_id INTEGER NOT NULL,
      scene_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.query(`
    ALTER TABLE tour_scenes ADD COLUMN IF NOT EXISTS scene_id TEXT;
    ALTER TABLE tour_scenes ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE tour_scenes ADD COLUMN IF NOT EXISTS image_url TEXT;
    ALTER TABLE tour_scenes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

    ALTER TABLE tour_hotspots ADD COLUMN IF NOT EXISTS hotspot_id TEXT;
    ALTER TABLE tour_hotspots ADD COLUMN IF NOT EXISTS label TEXT;
    ALTER TABLE tour_hotspots ADD COLUMN IF NOT EXISTS icon TEXT;
    ALTER TABLE tour_hotspots ADD COLUMN IF NOT EXISTS link_type TEXT;
    ALTER TABLE tour_hotspots ADD COLUMN IF NOT EXISTS target_scene_id TEXT;
    ALTER TABLE tour_hotspots ADD COLUMN IF NOT EXISTS url TEXT;
    ALTER TABLE tour_hotspots ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION;
    ALTER TABLE tour_hotspots ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;
    ALTER TABLE tour_hotspots ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  `);

  // Backward-compat: legacy schema stored lon/lat as pitch/yaw.
  await db.query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='tour_hotspots' AND column_name='pitch'
      ) THEN
        UPDATE tour_hotspots
        SET lon = COALESCE(lon, pitch)
        WHERE lon IS NULL;
      END IF;

      IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='tour_hotspots' AND column_name='yaw'
      ) THEN
        UPDATE tour_hotspots
        SET lat = COALESCE(lat, yaw)
        WHERE lat IS NULL;
      END IF;
    END $$;
  `);

  tourSchemaReady = true;
}

async function getTourHotspotColumns(client) {
  if (tourHotspotColumnsCache) return tourHotspotColumnsCache;
  const result = await client.query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'tour_hotspots'
    `
  );
  tourHotspotColumnsCache = new Set(result.rows.map((r) => r.column_name));
  return tourHotspotColumnsCache;
}

/* CREATE TOUR */
router.post("/", authMiddleware, async (req, res) => {
  try {
    await ensureTourSchema();
    const { property_id, name } = req.body;
    const safeName = String(name || "360 Virtual Tour").trim();

    const result = await db.query(
      "INSERT INTO tours (property_id, name) VALUES ($1,$2) RETURNING id",
      [property_id || null, safeName]
    );

    res.json({ tour_id: result.rows[0].id });
  } catch (error) {
    console.error("CREATE tour error:", error);
    res.status(500).json({ error: "Failed to create tour" });
  }
});

/* UPLOAD IMAGE */
router.post("/upload-scene", authMiddleware, upload.single("image"), async (req, res) => {
  try {
    await ensureTourSchema();
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided" });
    }
    const url = await uploadToOracle(req.file);
    res.json({ url });
  } catch (error) {
    console.error("UPLOAD scene error:", error);
    res.status(500).json({ error: "Failed to upload scene image" });
  }
});

/* Shared: fetch an image from an external URL and upload it to Oracle Cloud.
 * Throws an Error with a `.status` (HTTP status to report) on any failure. */
async function importImageFromUrl(url) {
  if (!url || typeof url !== "string") {
    throw Object.assign(new Error("url is required"), { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw Object.assign(new Error("That's not a valid URL"), { status: 400 });
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw Object.assign(new Error("Only http/https URLs are supported"), { status: 400 });
  }

  let addresses;
  try {
    addresses = await dns.lookup(parsed.hostname, { all: true });
  } catch {
    throw Object.assign(new Error("Could not resolve that host"), { status: 400 });
  }
  if (!addresses.length || addresses.some((a) => isPrivateOrReservedIp(a.address))) {
    throw Object.assign(new Error("That URL cannot be fetched"), { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response;
  try {
    response = await fetch(parsed.toString(), {
      signal: controller.signal,
      redirect: "follow",
    });
  } catch {
    throw Object.assign(new Error("Failed to fetch that URL"), { status: 400 });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    throw Object.assign(
      new Error(`The server at that URL responded with ${response.status}`),
      { status: 400 }
    );
  }

  const contentType = (response.headers.get("content-type") || "").split(";")[0].trim();
  if (!contentType.startsWith("image/")) {
    throw Object.assign(
      new Error(
        "That link doesn't point directly to an image file, so it can't be imported. " +
          "Share/viewer pages (like an Insta360 cloud share link) aren't direct images — " +
          "download the panorama photo and paste a direct link to that file, or upload it instead."
      ),
      { status: 400 }
    );
  }

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength && contentLength > MAX_IMPORT_BYTES) {
    throw Object.assign(new Error("Image is too large (max 25MB)"), { status: 400 });
  }

  const arrayBuffer = await response.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_IMPORT_BYTES) {
    throw Object.assign(new Error("Image is too large (max 25MB)"), { status: 400 });
  }

  const buffer = Buffer.from(arrayBuffer);
  const ext = contentType.split("/")[1] || "jpg";
  const originalname = `imported-${Date.now()}.${ext}`;

  return uploadToOracle({
    originalname,
    buffer,
    mimetype: contentType,
  });
}

/* IMPORT SCENE IMAGE FROM A DIRECT URL */
router.post("/import-from-url", authMiddleware, async (req, res) => {
  try {
    const ociUrl = await importImageFromUrl(req.body.url);
    res.json({ url: ociUrl });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error("IMPORT scene from URL error:", error);
    res.status(500).json({ error: "Failed to import image from URL" });
  }
});

/* QUICK PANORAMA: fetch a 360 image link, store it in the cloud, and create a
 * single-scene tour for it — skips the manual Tour Builder scene/hotspot flow. */
router.post("/quick-panorama", authMiddleware, async (req, res) => {
  try {
    await ensureTourSchema();
    const { property_id, room_name, image_url } = req.body;

    const ociUrl = await importImageFromUrl(image_url);
    const safeName = String(room_name || "360 Panorama").trim() || "360 Panorama";

    const tourResult = await db.query(
      "INSERT INTO tours (property_id, name) VALUES ($1,$2) RETURNING id",
      [property_id || null, safeName]
    );
    const tourId = tourResult.rows[0].id;

    await db.query(
      "INSERT INTO tour_scenes (tour_id, scene_id, name, image_url) VALUES ($1,$2,$3,$4)",
      [tourId, "scene-1", safeName, ociUrl]
    );

    res.json({ tour_id: tourId, room_name: safeName, image_url: ociUrl });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ error: error.message });
    console.error("QUICK panorama error:", error);
    res.status(500).json({ error: "Failed to import panorama" });
  }
});

/* SAVE TOUR */
router.post("/save", authMiddleware, async (req, res) => {
  const client = await db.pool.connect();
  try {
    await ensureTourSchema();
    const { tour_id, scenes = [], hotspots = {} } = req.body;
    if (!tour_id) {
      return res.status(400).json({ error: "tour_id is required" });
    }

    await client.query("BEGIN");
    await client.query("DELETE FROM tour_hotspots WHERE tour_id = $1", [tour_id]);
    await client.query("DELETE FROM tour_scenes WHERE tour_id = $1", [tour_id]);

    for (const s of scenes) {
      await client.query(
        "INSERT INTO tour_scenes (tour_id, scene_id, name, image_url) VALUES ($1,$2,$3,$4)",
        [tour_id, s.id, s.name, s.image]
      );
    }

    for (const sceneId in hotspots) {
      for (const h of hotspots[sceneId]) {
        const cols = await getTourHotspotColumns(client);
        const insertCols = ["tour_id", "scene_id"];
        const values = [tour_id, sceneId];

        if (cols.has("hotspot_id")) { insertCols.push("hotspot_id"); values.push(h.id || null); }
        if (cols.has("label")) { insertCols.push("label"); values.push(h.label || null); }
        if (cols.has("icon")) { insertCols.push("icon"); values.push(h.icon || null); }
        if (cols.has("link_type")) { insertCols.push("link_type"); values.push(h.linkType || null); }
        if (cols.has("target_scene_id")) { insertCols.push("target_scene_id"); values.push(h.targetSceneId || null); }
        if (cols.has("url")) { insertCols.push("url"); values.push(h.url || null); }

        if (cols.has("lon")) {
          insertCols.push("lon");
          values.push(Number(h.lon) || 0);
        } else if (cols.has("pitch")) {
          insertCols.push("pitch");
          values.push(Number(h.lon) || 0);
        }

        if (cols.has("lat")) {
          insertCols.push("lat");
          values.push(Number(h.lat) || 0);
        } else if (cols.has("yaw")) {
          insertCols.push("yaw");
          values.push(Number(h.lat) || 0);
        }

        const placeholders = values.map((_, i) => `$${i + 1}`).join(",");
        await client.query(
          `INSERT INTO tour_hotspots (${insertCols.join(",")}) VALUES (${placeholders})`,
          values
        );
      }
    }

    await client.query("COMMIT");
    res.json({ message: "Saved" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("SAVE tour error:", error);
    res.status(500).json({ error: "Failed to save tour" });
  } finally {
    client.release();
  }
});

/* VIEW TOUR IN IFRAME */
router.get("/view/:id", async (req, res) => {
  try {
    await ensureTourSchema();
    const id = req.params.id;
    const tourResult = await db.query(
      "SELECT property_id FROM tours WHERE id = $1",
      [id]
    );
    const propertyId = tourResult.rows?.[0]?.property_id || null;
    const propertyUrl = propertyId
      ? `${process.env.FRONTEND_URL}/property/${propertyId}`
      : null;
    const scenesResult = await db.query(
      "SELECT scene_id, name, image_url FROM tour_scenes WHERE tour_id=$1 ORDER BY id ASC",
      [id]
    );
    const hotspotsResult = await db.query(
      "SELECT * FROM tour_hotspots WHERE tour_id=$1 ORDER BY id ASC",
      [id]
    );

    const scenes = scenesResult.rows.map((s) => ({
      id: s.scene_id,
      name: s.name,
      image: s.image_url,
      hotspots: [],
    }));

    const sceneMap = new Map(scenes.map((s) => [s.id, s]));
    for (const h of hotspotsResult.rows) {
      const scene = sceneMap.get(h.scene_id);
      if (!scene) continue;
      scene.hotspots.push({
        id: h.hotspot_id || `hs-${h.id}`,
        label: h.label || "Hotspot",
        icon: h.icon || "📍",
        lon: Number(h.lon) || 0,
        lat: Number(h.lat) || 0,
        linkType: h.link_type || "scene",
        targetSceneId: h.target_scene_id || null,
        url: h.url || null,
      });
    }

    const scenesJson = JSON.stringify(scenes);
    const propertyUrlJson = JSON.stringify(propertyUrl);
    const html = `<!doctype html>
<html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>360 Virtual Tour</title><script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
<style>html,body{margin:0;height:100%;background:#0a0a0f;color:#fff;font-family:Arial,sans-serif}#wrap{position:relative;width:100%;height:100%;cursor:grab}#wrap:active{cursor:grabbing}#canvas{display:block;width:100%;height:100%}.bar{position:absolute;left:50%;top:12px;transform:translateX(-50%);display:flex;gap:8px;z-index:4;flex-wrap:wrap;justify-content:center}.tab{padding:7px 12px;border-radius:18px;border:1px solid rgba(255,255,255,.2);background:rgba(10,10,15,.75);color:#ccc;cursor:pointer;font-size:12px}.tab.active{border-color:#e8ff47;color:#e8ff47}.hl{position:absolute;inset:0;pointer-events:none}.hs{position:absolute;transform:translate(-50%,-50%);pointer-events:auto}.hs button{border:1px solid #e8ff47;background:rgba(10,10,15,.85);color:#e8ff47;padding:6px 10px;border-radius:16px;cursor:pointer}.property-link{position:absolute;right:16px;top:16px;z-index:5;padding:8px 12px;border-radius:10px;border:1px solid #e8ff47;background:rgba(10,10,15,.82);color:#e8ff47;text-decoration:none;font-size:12px}</style>
</head><body><div id="wrap"><canvas id="canvas"></canvas><div id="bar" class="bar"></div><div id="hl" class="hl"></div></div>
<script>
const SCENES=${scenesJson};const PROPERTY_URL=${propertyUrlJson};let cur=SCENES[0]?.id||null,ren,sc,camera,sphere,lon=0,lat=0,fov=75,drag=false,sx=0,sy=0,slon=0,slat=0;
function init(){const c=document.getElementById('canvas');ren=new THREE.WebGLRenderer({canvas:c,antialias:true});ren.setPixelRatio(window.devicePixelRatio||1);sc=new THREE.Scene();camera=new THREE.PerspectiveCamera(fov,innerWidth/innerHeight,.1,1000);const g=new THREE.SphereGeometry(500,60,40);g.scale(-1,1,1);sphere=new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:0x111118}));sc.add(sphere);bind();resize();window.addEventListener('resize',resize);animate();renderTabs();if(cur)loadScene(cur);}
function resize(){ren.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderHotspots();}
function animate(){requestAnimationFrame(animate);const cl=Math.max(-85,Math.min(85,lat));const phi=THREE.MathUtils.degToRad(90-cl),theta=THREE.MathUtils.degToRad(lon);camera.lookAt(new THREE.Vector3(500*Math.sin(phi)*Math.cos(theta),500*Math.cos(phi),500*Math.sin(phi)*Math.sin(theta)));ren.render(sc,camera);renderHotspots();}
function loadScene(id){cur=id;const s=SCENES.find(x=>x.id===id);if(!s)return;new THREE.TextureLoader().load(s.image,t=>{sphere.material=new THREE.MeshBasicMaterial({map:t})});renderTabs();renderHotspots(true);}
function renderTabs(){const bar=document.getElementById('bar');bar.innerHTML='';SCENES.forEach(s=>{const b=document.createElement('button');b.className='tab'+(s.id===cur?' active':'');b.textContent=s.name;b.onclick=()=>loadScene(s.id);bar.appendChild(b);});}
function toScreen(h){const phi=THREE.MathUtils.degToRad(90-h.lat),theta=THREE.MathUtils.degToRad(h.lon);const v=new THREE.Vector3(500*Math.sin(phi)*Math.cos(theta),500*Math.cos(phi),500*Math.sin(phi)*Math.sin(theta));v.project(camera);return{x:(v.x+1)/2*innerWidth,y:(-v.y+1)/2*innerHeight,hide:v.z>1};}
function renderHotspots(force){const hl=document.getElementById('hl');if(force)hl.innerHTML='';const s=SCENES.find(x=>x.id===cur);if(!s)return;if(force){s.hotspots.forEach(h=>{const d=document.createElement('div');d.className='hs';d.id='h-'+h.id;const b=document.createElement('button');b.textContent=(h.icon||'📍')+' '+(h.label||'Hotspot');b.onclick=(e)=>{e.stopPropagation();if(h.linkType==='url'&&h.url)window.open(h.url,'_blank');else if(h.targetSceneId)loadScene(h.targetSceneId)};d.appendChild(b);hl.appendChild(d);});}s.hotspots.forEach(h=>{const el=document.getElementById('h-'+h.id);if(!el)return;const p=toScreen(h);el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.display=p.hide?'none':'block';});}
function bind(){const w=document.getElementById('wrap');w.addEventListener('mousedown',e=>{drag=true;sx=e.clientX;sy=e.clientY;slon=lon;slat=lat});window.addEventListener('mousemove',e=>{if(!drag)return;lon=slon-(e.clientX-sx)*.2;lat=slat+(e.clientY-sy)*.2});window.addEventListener('mouseup',()=>{drag=false});w.addEventListener('wheel',e=>{fov=Math.max(30,Math.min(100,fov+e.deltaY*.05));camera.fov=fov;camera.updateProjectionMatrix()},{passive:true});if(PROPERTY_URL){const link=document.createElement('a');link.className='property-link';link.href=PROPERTY_URL;link.textContent='View Property';link.target='_blank';link.rel='noopener noreferrer';document.body.appendChild(link);}}
init();
</script></body></html>`;

    res.set("Content-Type", "text/html; charset=utf-8").send(html);
  } catch (error) {
    console.error("VIEW tour error:", error);
    res.status(500).send("Failed to render tour");
  }
});

/* LOAD TOUR */
router.get("/:id", async (req, res) => {
  try {
    await ensureTourSchema();
    const id = req.params.id;

    const scenes = await db.query(
      "SELECT scene_id, name, image_url FROM tour_scenes WHERE tour_id=$1 ORDER BY id ASC",
      [id]
    );

    const hotspots = await db.query(
      "SELECT * FROM tour_hotspots WHERE tour_id=$1 ORDER BY id ASC",
      [id]
    );

    const grouped = {};
    hotspots.rows.forEach((h) => {
      if (!grouped[h.scene_id]) grouped[h.scene_id] = [];
      grouped[h.scene_id].push({
        id: h.hotspot_id,
        label: h.label,
        icon: h.icon,
        lon: Number(h.lon),
        lat: Number(h.lat),
        linkType: h.link_type,
        targetSceneId: h.target_scene_id,
        url: h.url,
      });
    });

    res.json({
      scenes: scenes.rows.map((s) => ({
        id: s.scene_id,
        name: s.name,
        image: s.image_url,
      })),
      hotspots: grouped,
    });
  } catch (error) {
    console.error("LOAD tour error:", error);
    res.status(500).json({ error: "Failed to load tour" });
  }
});

module.exports = router;