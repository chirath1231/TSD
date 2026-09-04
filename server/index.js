const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { initDB } = require("./db/init");

const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/properties");
const publicRoutes = require("./routes/public");
const tourRoutes = require("./routes/tours");

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   MIDDLEWARE (MUST BE FIRST)
========================= */
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/tours", tourRoutes); // ✅ FIXED POSITION

/* =========================
   HEALTH CHECK (IMPORTANT DEBUG TOOL)
========================= */
app.get("/api/test", (req, res) => {
  res.json({ status: "OK", message: "Server working" });
});

/* =========================
   START SERVER
========================= */
async function startServer() {
  try {
    await initDB();
    console.log("✓ Database initialized");

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();