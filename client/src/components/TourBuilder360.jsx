import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../utils/api";

// ─── CSS injected once ───────────────────────────────────────────────────────
const STYLES = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --tb-primary: #1b4332;
  --tb-primary-light: #2d6a4f;
  --tb-accent: #d4a843;
  --tb-bg: #f3f4f8;
  --tb-surface: #ffffff;
  --tb-panel: #f8fafc;
  --tb-border: #e5e7eb;
  --tb-text: #1a1a2e;
  --tb-muted: #6b7280;
  --tb-danger: #ef4444;
  --tb-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --tb-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  --tb-shadow-md: 0 4px 10px rgba(0, 0, 0, 0.08);
}

.tb-root {
  background: var(--tb-bg);
  color: var(--tb-text);
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 12px;
}

/* TOP BAR */
.tb-topbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  background: var(--tb-surface);
  border-bottom: 1px solid var(--tb-border);
  flex-shrink: 0;
  flex-wrap: wrap;
  box-shadow: var(--tb-shadow-sm);
}
.tb-brand {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.2px;
  color: var(--tb-primary);
  margin-right: 8px;
  white-space: nowrap;
}
.tb-brand span { color: var(--tb-text); }
.tb-sep { width: 1px; height: 28px; background: var(--tb-border); }

.tb-upload-wrap {
  position: relative;
  overflow: hidden;
  cursor: pointer;
}
.tb-upload-wrap input[type=file] {
  position: absolute; inset: 0; opacity: 0; cursor: pointer;
}
.tb-upload-label {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  background: var(--tb-panel);
  border: 1px solid var(--tb-border);
  border-radius: 8px;
  font-size: 12px;
  color: var(--tb-muted);
  cursor: pointer;
  transition: all .2s;
  white-space: nowrap;
  pointer-events: none;
}
.tb-upload-wrap:hover .tb-upload-label { border-color: var(--tb-primary); color: var(--tb-primary); background: #eef7f1; }
.tb-upload-wrap.has-file .tb-upload-label { border-color: var(--tb-primary); color: var(--tb-primary); background: #e8f5ed; }

.tb-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 14px;
  border: none; border-radius: 8px;
  font-size: 12px;
  cursor: pointer; transition: all .2s; white-space: nowrap;
  box-shadow: var(--tb-shadow-sm);
}
.tb-btn.primary { background: var(--tb-primary); color: #fff; font-weight: 600; }
.tb-btn.primary:hover { background: var(--tb-primary-light); }
.tb-btn.primary.active { background: var(--tb-danger); color: #fff; }
.tb-btn.ghost { background: var(--tb-panel); border: 1px solid var(--tb-border); color: var(--tb-muted); }
.tb-btn.ghost:hover { border-color: var(--tb-primary); color: var(--tb-primary); background: #eef7f1; }
.tb-btn.danger { background: transparent; border: 1px solid var(--tb-danger); color: var(--tb-danger); }
.tb-btn.danger:hover { background: var(--tb-danger); color: #fff; }

.tb-status-pill {
  margin-left: auto;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 11px;
  background: var(--tb-panel);
  border: 1px solid var(--tb-border);
  color: var(--tb-muted);
  transition: all .3s;
  white-space: nowrap;
}
.tb-status-pill.ok { border-color: var(--tb-primary); color: var(--tb-primary); }
.tb-status-pill.warn { border-color: #ffa724; color: #ffa724; }
.tb-status-pill.active-mode { border-color: var(--tb-danger); color: var(--tb-danger); animation: tb-pulse 1.2s infinite; }

@keyframes tb-pulse { 0%,100%{opacity:1}50%{opacity:.5} }

/* SCENE TABS */
.tb-scene-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  background: var(--tb-surface);
  border-bottom: 1px solid var(--tb-border);
  overflow-x: auto; flex-shrink: 0;
  scrollbar-width: none;
}
.tb-scene-bar::-webkit-scrollbar { display: none; }
.tb-scene-tab {
  display: flex; align-items: center; gap: 7px;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--tb-border);
  font-size: 11px;
  color: var(--tb-muted); cursor: pointer; transition: all .2s;
  background: var(--tb-panel); white-space: nowrap; flex-shrink: 0;
}
.tb-scene-tab:hover { border-color: var(--tb-primary); color: var(--tb-primary); background: #eef7f1; }
.tb-scene-tab.active { border-color: var(--tb-primary); color: var(--tb-primary); background: #e8f5ed; }
.tb-scene-tab-close { font-size: 12px; color: var(--tb-muted); margin-left: 2px; padding: 0 2px; transition: color .2s; }
.tb-scene-tab-close:hover { color: var(--tb-danger); }
.tb-add-scene-btn {
  padding: 6px 12px;
  border-radius: 20px;
  border: 1.5px dashed var(--tb-border);
  background: none;
  font-size: 11px;
  color: var(--tb-muted); cursor: pointer; transition: all .2s; flex-shrink: 0;
}
.tb-add-scene-btn:hover { border-color: var(--tb-primary); color: var(--tb-primary); background: #eef7f1; }

/* MAIN */
.tb-main {
  flex: 1;
  display: flex;
  overflow: hidden;
  position: relative;
}

/* VIEWER */
.tb-viewer-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;
}
.tb-viewer-wrap.placing { cursor: crosshair; }
.tb-viewer-wrap:active { cursor: grabbing; }
.tb-viewer-wrap.placing:active { cursor: crosshair; }
.tb-canvas { display: block; width: 100%; height: 100%; }

/* EMPTY STATE */
.tb-empty {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 16px;
  pointer-events: none;
}
.tb-empty-icon { font-size: 64px; opacity: .15; }
.tb-empty h2 { font-size: 22px; font-weight: 800; color: var(--muted); text-align: center; }
.tb-empty p { font-family: var(--font-mono); font-size: 12px; color: var(--muted); opacity: .7; text-align: center; max-width: 280px; }

/* HOTSPOT LAYER */
.tb-hotspot-layer { position: absolute; inset: 0; pointer-events: none; }
.tb-hotspot {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: all;
  cursor: pointer;
}
.tb-hotspot-btn {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 14px;
  background: rgba(27, 67, 50, 0.92);
  border: 2px solid var(--tb-accent);
  border-radius: 30px;
  font-size: 12px;
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all .25s;
  box-shadow: 0 10px 24px rgba(27, 67, 50, 0.25);
  white-space: nowrap;
  user-select: none;
  animation: tb-pop-in .25s cubic-bezier(.34,1.56,.64,1);
}
.tb-hotspot-btn:hover {
  background: var(--tb-primary-light);
  color: #fff;
  box-shadow: 0 12px 28px rgba(27, 67, 50, 0.35);
  transform: scale(1.06);
}
.tb-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--tb-accent);
  transition: background .25s;
}
.tb-hotspot-btn:hover .tb-dot { background: #fff; }
.tb-delete-x {
  position: absolute; top: -8px; right: -8px;
  width: 20px; height: 20px;
  background: var(--tb-danger); border-radius: 50%;
  font-size: 11px; color: #fff;
  display: flex; align-items: center; justify-content: center;
  opacity: 0; pointer-events: none;
  transition: opacity .2s;
  border: 2px solid #fff;
  cursor: pointer;
}
.tb-hotspot:hover .tb-delete-x { opacity: 1; pointer-events: all; }
@keyframes tb-pop-in {
  from { transform: scale(.5) translate(-50%,-50%); opacity:0; }
  to   { transform: scale(1)  translate(-50%,-50%); opacity:1; }
}

/* SIDE PANEL */
.tb-side-panel {
  width: 280px;
  background: var(--tb-surface);
  border-left: 1px solid var(--tb-border);
  display: flex; flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  transition: width .3s;
}
.tb-side-panel.collapsed { width: 0; }
.tb-panel-head {
  padding: 14px 16px 10px;
  font-size: 11px;
  color: var(--tb-muted);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  border-bottom: 1px solid var(--tb-border);
  display: flex; align-items: center; justify-content: space-between;
}
.tb-hs-count { color: var(--tb-primary); font-size: 13px; }
.tb-hotspot-list { flex: 1; overflow-y: auto; padding: 10px; }
.tb-hotspot-list::-webkit-scrollbar { width: 4px; }
.tb-hotspot-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
.tb-hs-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--tb-border);
  margin-bottom: 8px;
  cursor: pointer;
  transition: all .2s;
  background: var(--tb-panel);
}
.tb-hs-item:hover { border-color: var(--tb-primary); background: #eef7f1; }
.tb-hs-icon { font-size: 20px; flex-shrink: 0; }
.tb-hs-info { flex: 1; min-width: 0; }
.tb-hs-name { font-size: 13px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.tb-hs-sub { font-size: 10px; color: var(--tb-muted); margin-top: 2px; }
.tb-hs-del { background: none; border: none; color: var(--tb-muted); cursor: pointer; font-size: 16px; padding: 2px 4px; transition: color .2s; flex-shrink: 0; }
.tb-hs-del:hover { color: var(--tb-danger); }
.tb-panel-empty { text-align: center; padding: 30px 20px; color: var(--tb-muted); font-size: 12px; line-height: 1.7; }
.tb-panel-footer { padding: 12px 10px; border-top: 1px solid var(--tb-border); display: flex; flex-direction: column; gap: 8px; }

/* MODAL */
.tb-modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,.75);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
  opacity: 0; pointer-events: none;
  transition: opacity .25s;
}
.tb-modal-overlay.show { opacity: 1; pointer-events: all; }
.tb-modal {
  background: var(--tb-surface);
  border: 1px solid var(--tb-border);
  border-radius: 16px;
  padding: 28px;
  width: 420px;
  max-width: 95vw;
  transform: translateY(20px) scale(.97);
  transition: all .25s cubic-bezier(.34,1.56,.64,1);
}
.tb-modal-overlay.show .tb-modal { transform: none; }
.tb-modal h3 { font-size: 18px; font-weight: 800; margin-bottom: 6px; }
.tb-modal .sub { font-size: 11px; color: var(--tb-muted); margin-bottom: 22px; }
.tb-form-group { margin-bottom: 16px; }
.tb-form-group label { display: block; font-size: 11px; color: var(--tb-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
.tb-form-group input[type=text],
.tb-form-group select {
  width: 100%; padding: 10px 14px;
  background: #fff;
  border: 1.5px solid var(--tb-border);
  border-radius: 8px;
  color: var(--tb-text); font-size: 13px;
  outline: none;
  transition: border-color .2s;
}
.tb-form-group input[type=text]:focus,
.tb-form-group select:focus { border-color: var(--tb-primary); box-shadow: 0 0 0 3px rgba(27, 67, 50, 0.1); }
.tb-form-group select option { background: #fff; }
.tb-link-type-row { display: flex; gap: 8px; margin-bottom: 16px; }
.tb-type-btn {
  flex: 1; padding: 9px 8px;
  background: var(--tb-panel); border: 1px solid var(--tb-border);
  border-radius: 8px;
  font-size: 11px;
  color: var(--tb-muted); cursor: pointer; transition: all .2s;
  text-align: center;
}
.tb-type-btn.active { border-color: var(--tb-primary); color: var(--tb-primary); background: #e8f5ed; }
.tb-icon-picker { display: flex; gap: 8px; flex-wrap: wrap; }
.tb-icon-choice {
  width: 38px; height: 38px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--tb-border); border-radius: 8px;
  font-size: 20px; cursor: pointer; transition: all .2s;
  background: var(--tb-panel);
}
.tb-icon-choice:hover { border-color: var(--tb-primary); }
.tb-icon-choice.selected { border-color: var(--tb-primary); background: #e8f5ed; }
.tb-modal-actions { display: flex; gap: 10px; margin-top: 22px; }
.tb-modal-actions button { flex: 1; justify-content: center; }

/* TOAST */
.tb-toast {
  position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%) translateY(10px);
  padding: 10px 20px;
  background: var(--tb-surface); border: 1px solid var(--tb-border);
  border-radius: 30px;
  font-size: 12px; color: var(--tb-text);
  box-shadow: var(--tb-shadow-md);
  opacity: 0; transition: all .3s; pointer-events: none; z-index: 999;
  white-space: nowrap;
}
.tb-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }

@media (max-width: 600px) {
  .tb-side-panel { width: 0; }
  .tb-topbar { gap: 6px; }
}
`;

const ICONS = ['🚪','➡️','🏠','🛏','🛁','🍳','🌿','🔍','⬆️','ℹ️'];

function esc(str) {
  return String(str || '');
}

// ─── Inject styles once ───────────────────────────────────────────────────────
let stylesInjected = false;
function injectStyles() {
  if (stylesInjected) return;
  const style = document.createElement('style');
  style.textContent = STYLES;
  document.head.appendChild(style);
  stylesInjected = true;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TourBuilder360({
  embedded = false,
  onTourLinked,
  onClose,
  linkedPropertyId: linkedPropertyIdProp,
}) {
  injectStyles();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/admin/properties/new";
  const returnToMatch = returnTo.match(/\/admin\/properties\/(\d+)\/edit/);
  const linkedPropertyId =
    linkedPropertyIdProp ?? (returnToMatch ? Number(returnToMatch[1]) : null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [scenes, setScenes] = useState([]);
  const [currentSceneId, setCurrentSceneId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [linkType, setLinkType] = useState('scene');
  const [selectedIcon, setSelectedIcon] = useState('🚪');
  const [hsLabel, setHsLabel] = useState('');
  const [hsUrl, setHsUrl] = useState('');
  const [targetSceneId, setTargetSceneId] = useState('');
  const [status, setStatus] = useState({ msg: 'No scene loaded', cls: '' });
  const [toast, setToast] = useState({ msg: '', show: false });
  const [uploadLabel, setUploadLabel] = useState('📁 Load Scene Image');
  const [hasFile, setHasFile] = useState(false);
  const [hotspotPositions, setHotspotPositions] = useState({});
  const [showEmpty, setShowEmpty] = useState(true);
  const [saving, setSaving] = useState(false);
  const [threeReady, setThreeReady] = useState(Boolean(window.THREE));
  const [threeLoadError, setThreeLoadError] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [sceneUrlInput, setSceneUrlInput] = useState('');
  const [importingUrl, setImportingUrl] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const scene3dRef = useRef(null);
  const cameraRef = useRef(null);
  const sphereRef = useRef(null);
  const cameraLonRef = useRef(0);
  const cameraLatRef = useRef(0);
  const fovRef = useRef(75);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const pendingPosRef = useRef(null);
  const toastTimerRef = useRef(null);
  const rafRef = useRef(null);
  const viewerRef = useRef(null);
  const uploadRef = useRef(null);
  const labelRef = useRef(null);

  const scenesRef = useRef(scenes);
  const currentSceneIdRef = useRef(currentSceneId);
  const addingRef = useRef(adding);

  useEffect(() => { scenesRef.current = scenes; }, [scenes]);
  useEffect(() => { currentSceneIdRef.current = currentSceneId; }, [currentSceneId]);
  useEffect(() => { addingRef.current = adding; }, [adding]);

  // ── Ensure Three.js is loaded before viewer init ──────────────────────────
  useEffect(() => {
    if (window.THREE) {
      setThreeReady(true);
      return;
    }

    const existing = document.querySelector('script[data-threejs-loader="true"]');
    if (existing) {
      const onReady = () => setThreeReady(true);
      const onError = () => setThreeLoadError(true);
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", onError);
      return () => {
        existing.removeEventListener("load", onReady);
        existing.removeEventListener("error", onError);
      };
    }

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.async = true;
    script.dataset.threejsLoader = "true";
    script.onload = () => setThreeReady(true);
    script.onerror = () => setThreeLoadError(true);
    document.body.appendChild(script);
  }, []);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback((msg) => {
    clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  // ── Status ─────────────────────────────────────────────────────────────────
  const updateStatus = useCallback((scenesArr, scId) => {
    const arr = scenesArr ?? scenesRef.current;
    const id = scId ?? currentSceneIdRef.current;
    const sc = arr.find(s => s.id === id);
    if (!sc) { setStatus({ msg: 'No scene loaded', cls: '' }); return; }
    const n = sc.hotspots.length;
    setStatus({ msg: `${sc.name} · ${n} hotspot${n !== 1 ? 's' : ''}`, cls: 'ok' });
  }, []);

  // ── lonLat → screen ────────────────────────────────────────────────────────
  const lonLatToScreen = useCallback((lon, lat) => {
    if (!cameraRef.current || !viewerRef.current) return { x: 0, y: 0, behind: true };
    const THREE = window.THREE;
    const phi = THREE.MathUtils.degToRad(90 - lat);
    const theta = THREE.MathUtils.degToRad(lon);
    const vec = new THREE.Vector3(
      500 * Math.sin(phi) * Math.cos(theta),
      500 * Math.cos(phi),
      500 * Math.sin(phi) * Math.sin(theta)
    );
    vec.project(cameraRef.current);
    const w = viewerRef.current.clientWidth;
    const h = viewerRef.current.clientHeight;
    return {
      x: (vec.x + 1) / 2 * w,
      y: (-vec.y + 1) / 2 * h,
      behind: vec.z > 1
    };
  }, []);

  // ── Update hotspot overlay positions ──────────────────────────────────────
  const updateHotspotPositions = useCallback(() => {
    const id = currentSceneIdRef.current;
    const sc = scenesRef.current.find(s => s.id === id);
    if (!sc) return;
    const positions = {};
    sc.hotspots.forEach(hs => {
      positions[hs.id] = lonLatToScreen(hs.lon, hs.lat);
    });
    setHotspotPositions(positions);
  }, [lonLatToScreen]);

  // ── Three.js init ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || !threeReady) return;

    const THREE = window.THREE;
    if (!THREE) { console.error('Three.js not loaded'); return; }

    const canvas = canvasRef.current;
    const wrap = viewerRef.current;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(wrap.clientWidth, wrap.clientHeight);
    rendererRef.current = renderer;

    const scene3d = new THREE.Scene();
    scene3dRef.current = scene3d;

    const camera = new THREE.PerspectiveCamera(fovRef.current, wrap.clientWidth / wrap.clientHeight, 0.1, 1000);
    cameraRef.current = camera;

    const geo = new THREE.SphereGeometry(500, 60, 40);
    geo.scale(-1, 1, 1);
    const mat = new THREE.MeshBasicMaterial({ color: 0xf3f4f8 });
    const sphere = new THREE.Mesh(geo, mat);
    scene3d.add(sphere);
    sphereRef.current = sphere;

    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      const lat = Math.max(-85, Math.min(85, cameraLatRef.current));
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(cameraLonRef.current);
      camera.lookAt(new THREE.Vector3(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
      ));
      renderer.render(scene3d, camera);
      updateHotspotPositions();
    }
    animate();

    function onResize() {
      renderer.setSize(wrap.clientWidth, wrap.clientHeight);
      camera.aspect = wrap.clientWidth / wrap.clientHeight;
      camera.updateProjectionMatrix();
      updateHotspotPositions();
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
    };
  }, [updateHotspotPositions, threeReady]);

  // ── Drag / scroll / click ──────────────────────────────────────────────────
  useEffect(() => {
    const wrap = viewerRef.current;
    if (!wrap) return;
    let startX, startY, startLon, startLat;

    function onMouseDown(e) {
      if (e.target.closest('.tb-hotspot')) return;
      draggingRef.current = true; movedRef.current = false;
      startX = e.clientX; startY = e.clientY;
      startLon = cameraLonRef.current; startLat = cameraLatRef.current;
    }
    function onMouseMove(e) {
      if (!draggingRef.current) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) movedRef.current = true;
      cameraLonRef.current = startLon - dx * 0.2;
      cameraLatRef.current = startLat + dy * 0.2;
    }
    function onMouseUp() { draggingRef.current = false; }

    let tStartX, tStartY, tStartLon, tStartLat;
    function onTouchStart(e) {
      if (e.touches.length === 1) {
        tStartX = e.touches[0].clientX; tStartY = e.touches[0].clientY;
        tStartLon = cameraLonRef.current; tStartLat = cameraLatRef.current;
      }
    }
    function onTouchMove(e) {
      if (e.touches.length === 1) {
        cameraLonRef.current = tStartLon - (e.touches[0].clientX - tStartX) * 0.2;
        cameraLatRef.current = tStartLat + (e.touches[0].clientY - tStartY) * 0.2;
      }
    }
    function onWheel(e) {
      fovRef.current = Math.max(30, Math.min(100, fovRef.current + e.deltaY * 0.05));
      if (cameraRef.current) { cameraRef.current.fov = fovRef.current; cameraRef.current.updateProjectionMatrix(); }
    }
    function onClick(e) {
      if (movedRef.current) { movedRef.current = false; return; }
      if (!addingRef.current) return;
      if (e.target.closest('.tb-hotspot')) return;
      const THREE = window.THREE;
      const rect = wrap.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width * 2 - 1;
      const ny = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const lat = Math.max(-85, Math.min(85, cameraLatRef.current));
      const phi = THREE.MathUtils.degToRad(90 - lat);
      const theta = THREE.MathUtils.degToRad(cameraLonRef.current);
      const lookDir = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(lookDir, up).normalize();
      const trueUp = new THREE.Vector3().crossVectors(right, lookDir).normalize();
      const cam = cameraRef.current;
      const hFov = THREE.MathUtils.degToRad(cam.fov * cam.aspect / 2);
      const vFov = THREE.MathUtils.degToRad(cam.fov / 2);
      const dir = new THREE.Vector3()
        .addScaledVector(lookDir, 1)
        .addScaledVector(right, nx * Math.tan(hFov))
        .addScaledVector(trueUp, ny * Math.tan(vFov))
        .normalize();
      const lon = THREE.MathUtils.radToDeg(Math.atan2(dir.z, dir.x));
      const latVal = THREE.MathUtils.radToDeg(Math.asin(dir.y));
      pendingPosRef.current = { lon, lat: latVal };
      setAdding(false);
      setModalOpen(true);
      setHsLabel('');
      setHsUrl('');
      setSelectedIcon('🚪');
      setLinkType('scene');
      setTargetSceneId('');
      setTimeout(() => labelRef.current?.focus(), 150);
    }

    wrap.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    wrap.addEventListener('touchstart', onTouchStart, { passive: true });
    wrap.addEventListener('touchmove', onTouchMove, { passive: true });
    wrap.addEventListener('wheel', onWheel, { passive: true });
    wrap.addEventListener('click', onClick);

    return () => {
      wrap.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      wrap.removeEventListener('touchstart', onTouchStart);
      wrap.removeEventListener('touchmove', onTouchMove);
      wrap.removeEventListener('wheel', onWheel);
      wrap.removeEventListener('click', onClick);
    };
  }, []);

  // ── Keyboard ───────────────────────────────────────────────────────────────
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        if (modalOpen) setModalOpen(false);
        else if (adding) setAdding(false);
      }
      if (e.key === 'h' || e.key === 'H') setPanelOpen(p => !p);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen, adding]);

  // ── Load texture ───────────────────────────────────────────────────────────
  const loadTexture = useCallback((url) => {
    if (!window.THREE || !sphereRef.current) return;
    const loader = new window.THREE.TextureLoader();
    loader.load(url, tex => {
      sphereRef.current.material = new window.THREE.MeshBasicMaterial({ map: tex });
      setShowEmpty(false);
    });
  }, []);

  // ── Current scene helper (sync) ────────────────────────────────────────────
  const getCurrentScene = useCallback((arr, id) => {
    return (arr ?? scenesRef.current).find(s => s.id === (id ?? currentSceneIdRef.current)) || null;
  }, []);

  // ── Add scene ──────────────────────────────────────────────────────────────
  const addScene = useCallback((name) => {
    const id = 'scene-' + Date.now();
    const newSc = { id, name: name || `Scene ${scenesRef.current.length + 1}`, imageURL: null, imageData: null, hotspots: [] };
    setScenes(prev => {
      const next = [...prev, newSc];
      scenesRef.current = next;
      return next;
    });
    setCurrentSceneId(id);
    currentSceneIdRef.current = id;
    setShowEmpty(true);
    if (sphereRef.current) sphereRef.current.material = new window.THREE.MeshBasicMaterial({ color: 0xf3f4f8 });
    setStatus({ msg: 'No scene loaded', cls: '' });
    setTimeout(() => uploadRef.current?.click(), 50);
  }, []);

  // ── Switch scene ───────────────────────────────────────────────────────────
  const switchScene = useCallback((id) => {
    setCurrentSceneId(id);
    currentSceneIdRef.current = id;
    const sc = scenesRef.current.find(s => s.id === id);
    if (sc?.imageURL) {
      loadTexture(sc.imageURL);
      setShowEmpty(false);
    } else {
      if (sphereRef.current) sphereRef.current.material = new window.THREE.MeshBasicMaterial({ color: 0xf3f4f8 });
      setShowEmpty(true);
    }
    updateStatus(scenesRef.current, id);
    setHotspotPositions({});
    setTimeout(() => updateHotspotPositions(), 50);
  }, [loadTexture, updateStatus, updateHotspotPositions]);

  // ── Remove scene ───────────────────────────────────────────────────────────
  const removeScene = useCallback((id) => {
    setScenes(prev => {
      const next = prev.filter(s => s.id !== id);
      scenesRef.current = next;
      const nextId = currentSceneIdRef.current === id ? (next[0]?.id || null) : currentSceneIdRef.current;
      currentSceneIdRef.current = nextId;
      setCurrentSceneId(nextId);
      if (nextId) switchScene(nextId);
      else { setShowEmpty(true); if (sphereRef.current) sphereRef.current.material = new window.THREE.MeshBasicMaterial({ color: 0xf3f4f8 }); }
      return next;
    });
    showToast('Scene removed');
  }, [switchScene, showToast]);

  // ── File upload ────────────────────────────────────────────────────────────
  const onFileChange = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const body = new FormData();
      body.append("image", file);
      const { data } = await api.post("/tours/upload-scene", body, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const localPreviewUrl = URL.createObjectURL(file);
      setScenes(prev => {
        const next = prev.map(s => {
          if (s.id !== currentSceneIdRef.current) return s;
          const name = file.name.replace(/\.[^.]+$/, '').slice(0, 24) || s.name;
          return { ...s, imageURL: data.url, imageData: localPreviewUrl, name };
        });
        scenesRef.current = next;
        const sc = next.find(s => s.id === currentSceneIdRef.current);
        loadTexture(localPreviewUrl);
        updateStatus(next, currentSceneIdRef.current);
        if (sc) {
          setUploadLabel('✓ ' + sc.name);
          setHasFile(true);
          showToast(`Scene "${sc.name}" uploaded`);
        }
        return next;
      });
    } catch (error) {
      showToast(error.response?.data?.error || "Scene upload failed");
    } finally {
      e.target.value = '';
    }
  }, [loadTexture, updateStatus, showToast]);

  // ── Import scene image from a direct URL ───────────────────────────────────
  const importSceneFromUrl = useCallback(async () => {
    const url = sceneUrlInput.trim();
    if (!url) return;
    if (!getCurrentScene()) { showToast('Add a scene first'); return; }

    setImportingUrl(true);
    try {
      const { data } = await api.post("/tours/import-from-url", { url });

      setScenes(prev => {
        const next = prev.map(s => {
          if (s.id !== currentSceneIdRef.current) return s;
          const name = url.split('/').pop()?.split('?')[0]?.slice(0, 24) || s.name;
          return { ...s, imageURL: data.url, imageData: data.url, name };
        });
        scenesRef.current = next;
        const sc = next.find(s => s.id === currentSceneIdRef.current);
        loadTexture(data.url);
        updateStatus(next, currentSceneIdRef.current);
        if (sc) {
          setUploadLabel('✓ ' + sc.name);
          setHasFile(true);
          showToast(`Scene "${sc.name}" imported`);
        }
        return next;
      });
      setSceneUrlInput('');
      setShowUrlInput(false);
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to import image from URL");
    } finally {
      setImportingUrl(false);
    }
  }, [sceneUrlInput, getCurrentScene, loadTexture, updateStatus, showToast]);

  // ── Toggle add mode ────────────────────────────────────────────────────────
  const toggleAddMode = useCallback(() => {
    const sc = getCurrentScene();
    if (!sc || !sc.imageURL) { showToast('Load a scene image first'); return; }
    setAdding(prev => {
      const next = !prev;
      addingRef.current = next;
      if (next) setStatus({ msg: 'Click anywhere on the panorama to place a hotspot', cls: 'active-mode' });
      else updateStatus();
      return next;
    });
  }, [getCurrentScene, showToast, updateStatus]);

  // ── Confirm hotspot ────────────────────────────────────────────────────────
  const confirmHotspot = useCallback(() => {
    if (!pendingPosRef.current) return;
    const label = hsLabel.trim() || 'Hotspot';
    const hs = {
      id: 'hs-' + Date.now(),
      label,
      icon: selectedIcon,
      lon: pendingPosRef.current.lon,
      lat: pendingPosRef.current.lat,
      linkType,
      targetSceneId: linkType === 'scene' ? targetSceneId : null,
      url: linkType === 'url' ? hsUrl.trim() : null,
    };
    setScenes(prev => {
      const next = prev.map(s => s.id === currentSceneIdRef.current ? { ...s, hotspots: [...s.hotspots, hs] } : s);
      scenesRef.current = next;
      updateStatus(next, currentSceneIdRef.current);
      return next;
    });
    pendingPosRef.current = null;
    setModalOpen(false);
    showToast(`Hotspot "${label}" added ✓`);
  }, [hsLabel, selectedIcon, linkType, targetSceneId, hsUrl, updateStatus, showToast]);

  // ── Delete hotspot ─────────────────────────────────────────────────────────
  const deleteHotspot = useCallback((hsId) => {
    setScenes(prev => {
      const next = prev.map(s => s.id === currentSceneIdRef.current ? { ...s, hotspots: s.hotspots.filter(h => h.id !== hsId) } : s);
      scenesRef.current = next;
      updateStatus(next, currentSceneIdRef.current);
      return next;
    });
    showToast('Hotspot deleted');
  }, [updateStatus, showToast]);

  // ── Clear all hotspots ─────────────────────────────────────────────────────
  const clearAllHotspots = useCallback(() => {
    setScenes(prev => {
      const next = prev.map(s => s.id === currentSceneIdRef.current ? { ...s, hotspots: [] } : s);
      scenesRef.current = next;
      updateStatus(next, currentSceneIdRef.current);
      return next;
    });
    showToast('All hotspots cleared');
  }, [updateStatus, showToast]);

  // ── Activate hotspot ───────────────────────────────────────────────────────
  const activateHotspot = useCallback((hs) => {
    if (hs.linkType === 'url' && hs.url) window.open(hs.url, '_blank');
    else if (hs.linkType === 'scene' && hs.targetSceneId) {
      const target = scenesRef.current.find(s => s.id === hs.targetSceneId);
      if (target) { switchScene(hs.targetSceneId); showToast('Navigated to ' + target.name); }
      else showToast('Target scene not found');
    } else showToast('No destination configured');
  }, [switchScene, showToast]);

  // ── Export HTML ────────────────────────────────────────────────────────────
  const exportTour = useCallback(() => {
    if (!scenes.length) { showToast('No scenes to export'); return; }
    const scenesJson = JSON.stringify(scenes.map(sc => ({ id: sc.id, name: sc.name, imageData: sc.imageData, hotspots: sc.hotspots })));
    const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>360° Virtual Tour</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#f3f4f8;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;height:100vh;overflow:hidden;color:#1a1a2e}#wrap{position:relative;width:100%;height:100%;cursor:grab}#wrap:active{cursor:grabbing}#canvas{display:block;width:100%;height:100%}#hl{position:absolute;inset:0;pointer-events:none}.hs{position:absolute;transform:translate(-50%,-50%);pointer-events:all;cursor:pointer}.hs-btn{display:flex;align-items:center;gap:7px;padding:8px 14px;background:rgba(27,67,50,.92);border:2px solid #d4a843;border-radius:30px;font-size:13px;color:#fff;cursor:pointer;backdrop-filter:blur(8px);box-shadow:0 10px 24px rgba(27,67,50,.25);white-space:nowrap;transition:all .2s}.hs-btn:hover{background:#2d6a4f;color:#fff}.dot{width:8px;height:8px;border-radius:50%;background:#d4a843;flex-shrink:0;transition:background .2s}.hs-btn:hover .dot{background:#fff}#scene-bar{position:absolute;top:14px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:10}.stab{padding:7px 16px;border-radius:20px;border:1px solid #e5e7eb;background:#fff;font-size:12px;color:#6b7280;cursor:pointer;transition:all .2s}.stab.active{border-color:#1b4332;color:#1b4332;background:#e8f5ed}</style>
</head><body>
<div id="scene-bar"></div>
<div id="wrap"><canvas id="canvas"></canvas><div id="hl"></div></div>
<script>
const SCENES=${scenesJson};
let renderer,scene3d,camera,sphere,curId=SCENES[0]?.id;
let cameraLon=0,cameraLat=0,fov=75,dragging=false,moved=false;
let startX,startY,startLon,startLat;
function init(){const canvas=document.getElementById('canvas');renderer=new THREE.WebGLRenderer({canvas,antialias:true});renderer.setPixelRatio(devicePixelRatio);scene3d=new THREE.Scene();camera=new THREE.PerspectiveCamera(fov,innerWidth/innerHeight,.1,1000);const geo=new THREE.SphereGeometry(500,60,40);geo.scale(-1,1,1);sphere=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:0xf3f4f8}));scene3d.add(sphere);resize();window.addEventListener('resize',resize);bindInput();animate();renderTabs();if(SCENES.length)switchScene(SCENES[0].id);}
function resize(){renderer.setSize(innerWidth,innerHeight);if(camera){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();}updateHSPos();}
function animate(){requestAnimationFrame(animate);const lat=Math.max(-85,Math.min(85,cameraLat)),phi=THREE.MathUtils.degToRad(90-lat),theta=THREE.MathUtils.degToRad(cameraLon);camera.lookAt(new THREE.Vector3(500*Math.sin(phi)*Math.cos(theta),500*Math.cos(phi),500*Math.sin(phi)*Math.sin(theta)));renderer.render(scene3d,camera);updateHSPos();}
function switchScene(id){curId=id;const sc=SCENES.find(s=>s.id===id);if(sc&&sc.imageData){new THREE.TextureLoader().load(sc.imageData,t=>{sphere.material=new THREE.MeshBasicMaterial({map:t});});}renderTabs();renderHS();}
function renderTabs(){const bar=document.getElementById('scene-bar');bar.innerHTML='';SCENES.forEach(sc=>{const d=document.createElement('div');d.className='stab'+(sc.id===curId?' active':'');d.textContent=sc.name;d.onclick=()=>switchScene(sc.id);bar.appendChild(d);});}
function renderHS(){const hl=document.getElementById('hl');hl.innerHTML='';const sc=SCENES.find(s=>s.id===curId);if(!sc)return;sc.hotspots.forEach(hs=>{const el=document.createElement('div');el.className='hs';el.id='h'+hs.id;el.innerHTML='<div class="hs-btn"><span class="dot"></span>'+hs.icon+' '+hs.label+'</div>';el.onclick=()=>{if(hs.linkType==='url'&&hs.url)window.open(hs.url,'_blank');else if(hs.targetSceneId){const t=SCENES.find(s=>s.id===hs.targetSceneId);if(t)switchScene(t.id);}};hl.appendChild(el);});updateHSPos();}
function lonLatToScreen(lon,lat){const phi=THREE.MathUtils.degToRad(90-lat),theta=THREE.MathUtils.degToRad(lon);const v=new THREE.Vector3(500*Math.sin(phi)*Math.cos(theta),500*Math.cos(phi),500*Math.sin(phi)*Math.sin(theta));v.project(camera);return{x:(v.x+1)/2*innerWidth,y:(-v.y+1)/2*innerHeight,behind:v.z>1};}
function updateHSPos(){const sc=SCENES.find(s=>s.id===curId);if(!sc)return;sc.hotspots.forEach(hs=>{const el=document.getElementById('h'+hs.id);if(!el)return;const p=lonLatToScreen(hs.lon,hs.lat);el.style.left=p.x+'px';el.style.top=p.y+'px';el.style.display=p.behind?'none':'';});}
function bindInput(){const w=document.getElementById('wrap');w.addEventListener('mousedown',e=>{if(e.target.closest('.hs'))return;dragging=true;moved=false;startX=e.clientX;startY=e.clientY;startLon=cameraLon;startLat=cameraLat;});window.addEventListener('mousemove',e=>{if(!dragging)return;const dx=e.clientX-startX,dy=e.clientY-startY;if(Math.abs(dx)>3||Math.abs(dy)>3)moved=true;cameraLon=startLon-dx*.2;cameraLat=startLat+dy*.2;});window.addEventListener('mouseup',()=>{dragging=false;});w.addEventListener('wheel',e=>{fov=Math.max(30,Math.min(100,fov+e.deltaY*.05));camera.fov=fov;camera.updateProjectionMatrix();},{passive:true});let tx,ty,tlon,tlat;w.addEventListener('touchstart',e=>{if(e.touches.length===1){tx=e.touches[0].clientX;ty=e.touches[0].clientY;tlon=cameraLon;tlat=cameraLat;}},{passive:true});w.addEventListener('touchmove',e=>{if(e.touches.length===1){cameraLon=tlon-(e.touches[0].clientX-tx)*.2;cameraLat=tlat+(e.touches[0].clientY-ty)*.2;}},{passive:true});}
init();
<\/script></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '360-tour.html';
    a.click();
    showToast('Tour exported as 360-tour.html ✓');
  }, [scenes, showToast]);

  // ── Save tour to backend (OCI + Postgres) ─────────────────────────────────
  const saveTourToCloud = useCallback(async () => {
    const validScenes = scenes.filter((s) => s.imageURL);
    if (!validScenes.length) {
      showToast("Add at least one uploaded scene");
      return;
    }

    setSaving(true);
    try {
      const { data: createData } = await api.post("/tours", {
        property_id: linkedPropertyId,
        name: `Tour ${new Date().toISOString()}`,
      });

      const mappedScenes = validScenes.map((s) => ({
        id: s.id,
        name: s.name,
        image: s.imageURL,
      }));

      const hotspots = {};
      validScenes.forEach((s) => {
        hotspots[s.id] = (s.hotspots || []).map((h) => ({
          id: h.id,
          label: h.label,
          icon: h.icon,
          lon: h.lon,
          lat: h.lat,
          linkType: h.linkType,
          targetSceneId: h.targetSceneId,
          url: h.url,
        }));
      });

      await api.post("/tours/save", {
        tour_id: createData.tour_id,
        scenes: mappedScenes,
        hotspots,
      });

      const tourUrl = `${window.location.origin}/api/tours/view/${createData.tour_id}`;
      const roomName = validScenes[0]?.name || "360 Panorama";
      sessionStorage.setItem(
        "tsd_created_tour",
        JSON.stringify({ room_name: roomName, tour_url: tourUrl })
      );
      const linkedTour = { room_name: roomName, tour_url: tourUrl };
      showToast("Tour saved and linked to Property Form");
      if (onTourLinked) {
        onTourLinked(linkedTour);
        if (onClose) setTimeout(() => onClose(), 500);
      } else {
        setTimeout(() => navigate(returnTo), 700);
      }
    } catch (error) {
      showToast(error.response?.data?.error || "Failed to save tour");
    } finally {
      setSaving(false);
    }
  }, [scenes, showToast, navigate, returnTo, linkedPropertyId, onTourLinked, onClose]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentScene = scenes.find(s => s.id === currentSceneId) || null;
  const currentHotspots = currentScene?.hotspots || [];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="tb-root"
        style={
          embedded
            ? {
                height: "70vh",
                minHeight: "560px",
                borderRadius: "12px",
                border: "1px solid #2a2a3d",
                overflow: "hidden",
              }
            : undefined
        }
      >
        {/* TOP BAR */}
        <div className="tb-topbar">
          <div className="tb-brand">360° <span>Tour Builder</span></div>
          <div className="tb-sep" />

          <div className={`tb-upload-wrap${hasFile ? ' has-file' : ''}`}>
            <input type="file" accept="image/*" ref={uploadRef} onChange={onFileChange} />
            <div className="tb-upload-label">{uploadLabel}</div>
          </div>

          {!showUrlInput ? (
            <button type="button" className="tb-btn ghost" onClick={() => setShowUrlInput(true)}>
              🔗 Load from URL
            </button>
          ) : (
            <>
              <input
                type="url"
                value={sceneUrlInput}
                onChange={(e) => setSceneUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') importSceneFromUrl(); }}
                placeholder="Direct image URL (.jpg/.png)"
                style={{
                  padding: '7px 12px',
                  border: '1.5px solid var(--tb-border)',
                  borderRadius: 8,
                  fontSize: 12,
                  minWidth: 220,
                  outline: 'none',
                }}
                autoFocus
              />
              <button type="button" className="tb-btn primary" onClick={importSceneFromUrl} disabled={importingUrl}>
                {importingUrl ? '...' : 'Import'}
              </button>
              <button
                type="button"
                className="tb-btn ghost"
                onClick={() => { setShowUrlInput(false); setSceneUrlInput(''); }}
              >✕</button>
            </>
          )}

          <div className="tb-sep" />

          <button type="button" className={`tb-btn primary${adding ? ' active' : ''}`} onClick={toggleAddMode}>
            {adding ? '✕ Cancel' : '＋ Add Hotspot'}
          </button>
          <button type="button" className="tb-btn ghost" onClick={() => setPanelOpen(p => !p)}>☰ Scenes</button>
          <button type="button" className="tb-btn ghost" onClick={exportTour}>⬇ Export HTML</button>
          <button type="button" className="tb-btn primary" onClick={saveTourToCloud} disabled={saving}>
            {saving ? "Saving..." : "Save to Cloud"}
          </button>

          <div className={`tb-status-pill${status.cls ? ' ' + status.cls : ''}`}>{status.msg}</div>
        </div>

        {/* SCENE TABS */}
        <div className="tb-scene-bar">
          {scenes.map(sc => (
            <div
              key={sc.id}
              className={`tb-scene-tab${sc.id === currentSceneId ? ' active' : ''}`}
              onClick={() => switchScene(sc.id)}
            >
              <span>🌐</span>
              <span>{esc(sc.name)}</span>
              <span
                className="tb-scene-tab-close"
                onClick={e => { e.stopPropagation(); removeScene(sc.id); }}
              >✕</span>
            </div>
          ))}
          <button type="button" className="tb-add-scene-btn" onClick={() => addScene()}>＋ Add Scene</button>
        </div>

        {/* MAIN */}
        <div className="tb-main">
          {/* VIEWER */}
          <div
            ref={viewerRef}
            className={`tb-viewer-wrap${adding ? ' placing' : ''}`}
          >
            <canvas ref={canvasRef} className="tb-canvas" />

            {showEmpty && (
              <div className="tb-empty">
                <div className="tb-empty-icon">🌐</div>
                <h2>{threeLoadError ? "Unable to load Three.js" : "Load a 360° Image"}</h2>
                <p>Upload an equirectangular panorama to begin building your virtual tour.</p>
              </div>
            )}

            {/* HOTSPOT LAYER */}
            <div className="tb-hotspot-layer">
              {currentHotspots.map(hs => {
                const pos = hotspotPositions[hs.id];
                if (!pos || pos.behind) return null;
                return (
                  <div
                    key={hs.id}
                    className="tb-hotspot"
                    style={{ left: pos.x, top: pos.y }}
                  >
                    <div className="tb-hotspot-btn" onClick={() => activateHotspot(hs)}>
                      <span className="tb-dot" />
                      {hs.icon} {esc(hs.label)}
                    </div>
                    <div
                      className="tb-delete-x"
                      title="Delete"
                      onClick={e => { e.stopPropagation(); deleteHotspot(hs.id); }}
                    >✕</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SIDE PANEL */}
          <div className={`tb-side-panel${panelOpen ? '' : ' collapsed'}`}>
            <div className="tb-panel-head">
              <span>Hotspots</span>
              <span className="tb-hs-count">{currentHotspots.length}</span>
            </div>
            <div className="tb-hotspot-list">
              {currentHotspots.length === 0 && (
                <div className="tb-panel-empty">No hotspots yet.<br />Click "+ Add Hotspot"<br />then click on the image.</div>
              )}
              {currentHotspots.map(hs => {
                const dest = hs.linkType === 'url'
                  ? (hs.url || 'No URL')
                  : (scenes.find(s => s.id === hs.targetSceneId)?.name || 'No target');
                return (
                  <div key={hs.id} className="tb-hs-item">
                    <div className="tb-hs-icon">{hs.icon}</div>
                    <div className="tb-hs-info">
                      <div className="tb-hs-name">{esc(hs.label)}</div>
                      <div className="tb-hs-sub">{hs.linkType === 'url' ? '🔗' : '🌐'} {esc(dest)}</div>
                    </div>
                    <button type="button" className="tb-hs-del" onClick={() => deleteHotspot(hs.id)}>✕</button>
                  </div>
                );
              })}
            </div>
            <div className="tb-panel-footer">
              <button type="button" className="tb-btn ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={clearAllHotspots}>
                🗑 Clear All Hotspots
              </button>
            </div>
          </div>
        </div>

        {/* MODAL */}
        <div className={`tb-modal-overlay${modalOpen ? ' show' : ''}`} onClick={e => { if (e.target === e.currentTarget) { setModalOpen(false); pendingPosRef.current = null; } }}>
          <div className="tb-modal">
            <h3>Configure Hotspot</h3>
            <p className="sub">Set label and destination for this hotspot.</p>

            <div className="tb-form-group">
              <label>Button Label</label>
              <input type="text" ref={labelRef} value={hsLabel} onChange={e => setHsLabel(e.target.value)} placeholder="e.g. Enter Bedroom" maxLength={40} />
            </div>

            <div className="tb-form-group">
              <label>Button Icon</label>
              <div className="tb-icon-picker">
                {ICONS.map(ic => (
                  <div
                    key={ic}
                    className={`tb-icon-choice${selectedIcon === ic ? ' selected' : ''}`}
                    onClick={() => setSelectedIcon(ic)}
                  >{ic}</div>
                ))}
              </div>
            </div>

            <div className="tb-form-group">
              <label>Destination Type</label>
              <div className="tb-link-type-row">
                <div className={`tb-type-btn${linkType === 'scene' ? ' active' : ''}`} onClick={() => setLinkType('scene')}>🌐 Another Scene</div>
                <div className={`tb-type-btn${linkType === 'url' ? ' active' : ''}`} onClick={() => setLinkType('url')}>🔗 External URL</div>
              </div>
            </div>

            {linkType === 'scene' && (
              <div className="tb-form-group">
                <label>Target Scene</label>
                <select value={targetSceneId} onChange={e => setTargetSceneId(e.target.value)}>
                  <option value="">— select scene —</option>
                  {scenes.filter(s => s.id !== currentSceneId).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {linkType === 'url' && (
              <div className="tb-form-group">
                <label>URL</label>
                <input type="text" value={hsUrl} onChange={e => setHsUrl(e.target.value)} placeholder="https://example.com" />
              </div>
            )}

            <div className="tb-modal-actions">
              <button type="button" className="tb-btn ghost" onClick={() => { setModalOpen(false); pendingPosRef.current = null; }}>Cancel</button>
              <button type="button" className="tb-btn primary" onClick={confirmHotspot}>Save Hotspot</button>
            </div>
          </div>
        </div>

        {/* TOAST */}
        <div className={`tb-toast${toast.show ? ' show' : ''}`}>{toast.msg}</div>
      </div>
    </>
  );
}