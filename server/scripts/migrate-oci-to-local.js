// One-time migration: download every image still stored in Oracle Object Storage
// into local storage (UPLOAD_DIR) and point the database rows at the local copy.
//
// Run INSIDE the deployed container (Dokploy → your app → Terminal / Open terminal):
//     node server/scripts/migrate-oci-to-local.js
//
// Safe to run again: already-downloaded files are skipped, rows already pointing at /uploads are untouched.
// The OCI bucket is never modified. Delete it yourself once everything checks out.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env"), override: true });

const fs = require("fs");
const db = require("../config/database");
const { saveFile, SUBDIR, UPLOAD_ROOT } = require("../utils/storage");

const COLUMNS = [
  ["property_images", "image_path"],
  ["tour_scenes", "image_url"],
  ["tour_hotspots", "url"],
  ["virtual_tours", "tour_url"],
];
const IS_OCI = "%objectstorage.%oraclecloud.com/%";

function localNameFor(ociUrl) {
  // Object name is everything after "/o/" and already starts with a Date.now() timestamp
  const objectName = decodeURIComponent(ociUrl.split("/o/")[1] || "file");
  const ext = path.extname(objectName).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const base = path.basename(objectName, path.extname(objectName)).replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 80);
  return `${base || "file"}${ext}`;
}

async function migrateOne(ociUrl) {
  const name = localNameFor(ociUrl);
  const target = path.join(UPLOAD_ROOT, SUBDIR, name);
  let localUrl = `/uploads/${SUBDIR}/${name}`;

  if (!(fs.existsSync(target) && fs.statSync(target).size > 0)) {
    const res = await fetch(ociUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    localUrl = await saveFile({ buffer: Buffer.from(await res.arrayBuffer()) }, name);
  }

  let rows = 0;
  for (const [table, col] of COLUMNS) {
    rows += (await db.query(`UPDATE ${table} SET ${col} = $1 WHERE ${col} = $2`, [localUrl, ociUrl])).rowCount;
  }
  return rows;
}

(async () => {
  console.log("Saving files to:", path.join(UPLOAD_ROOT, SUBDIR));

  const urls = new Set();
  for (const [table, col] of COLUMNS) {
    const { rows } = await db.query(`SELECT DISTINCT ${col} AS u FROM ${table} WHERE ${col} LIKE $1`, [IS_OCI]);
    rows.forEach((r) => urls.add(r.u));
  }
  const list = [...urls];
  console.log(`Found ${list.length} OCI file(s) to migrate`);

  let done = 0, failed = 0, rowsUpdated = 0;
  const queue = [...list];
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const url = queue.shift();
        try {
          const n = await migrateOne(url);
          rowsUpdated += n;
          done++;
          if (done % 10 === 0 || done === list.length) console.log(`  ${done}/${list.length} done`);
        } catch (err) {
          failed++;
          console.error(`  FAILED ${url}: ${err.message}`);
        }
      }
    }),
  );

  console.log(`\nMigrated ${done} file(s), updated ${rowsUpdated} row(s), ${failed} failed.`);
  if (failed) console.log("Failed rows still point at OCI. Run the script again to retry.");
  await db.pool.end();
  process.exit(failed ? 1 : 0);
})().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
