// Local disk storage for uploaded images (replaces Oracle Object Storage).
// Files live in UPLOAD_DIR (default: server/uploads) and are served by Express at /uploads.
// In Docker/Dokploy, mount a persistent volume at UPLOAD_DIR or files are lost on redeploy.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads"));
const SUBDIR = "properties";
fs.mkdirSync(path.join(UPLOAD_ROOT, SUBDIR), { recursive: true });

function safeFileName(originalName = "file") {
  const ext = path.extname(originalName).toLowerCase().replace(/[^.a-z0-9]/g, "");
  const base = path
    .basename(originalName, path.extname(originalName))
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .slice(0, 60);
  return `${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${base || "file"}${ext}`;
}

// Resolve a public "/uploads/..." URL to a path inside UPLOAD_ROOT (null if it points elsewhere)
function urlToPath(url) {
  if (typeof url !== "string" || !url.startsWith("/uploads/")) return null;
  const full = path.resolve(UPLOAD_ROOT, decodeURIComponent(url.slice("/uploads/".length)));
  return full.startsWith(UPLOAD_ROOT + path.sep) ? full : null;
}

// Save a multer-style file ({ originalname, buffer }) and return its public URL
async function saveFile(file, fileName = safeFileName(file.originalname)) {
  await fs.promises.writeFile(path.join(UPLOAD_ROOT, SUBDIR, fileName), file.buffer);
  return `/uploads/${SUBDIR}/${fileName}`;
}

// Delete a previously saved file. Ignores external URLs (e.g. old OCI links) and missing files.
async function deleteFile(url) {
  const full = urlToPath(url);
  if (!full) return;
  try {
    await fs.promises.unlink(full);
  } catch (err) {
    if (err.code !== "ENOENT") console.error("File delete error:", err.message);
  }
}

module.exports = { UPLOAD_ROOT, SUBDIR, safeFileName, saveFile, deleteFile, urlToPath };
