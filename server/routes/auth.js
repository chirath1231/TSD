const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required." });
    }

    const admin = await db
      .prepare("SELECT * FROM admins WHERE username = $1")
      .get(username);

    if (!admin || !bcrypt.compareSync(password, admin.password_hash)) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.json({ token, username: admin.username });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/verify", authMiddleware, (req, res) => {
  res.json({ valid: true, username: req.admin.username });
});

router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current and new password are required." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters." });
    }

    const admin = await db
      .prepare("SELECT * FROM admins WHERE id = $1")
      .get(req.admin.id);

    if (!bcrypt.compareSync(currentPassword, admin.password_hash)) {
      return res.status(401).json({ error: "Current password is incorrect." });
    }

    const hash = bcrypt.hashSync(newPassword, 10);
    await db
      .prepare("UPDATE admins SET password_hash = $1 WHERE id = $2")
      .run(hash, req.admin.id);

    res.json({ message: "Password updated successfully." });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: "Failed to change password" });
  }
});

module.exports = router;
