const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../config/database");
const authMiddleware = require("../middleware/auth");
const uploadToOracle = require("../utils/oracleUpload");
const router = express.Router();
const deleteFromOracle = require("../utils/oracleDelete");



const uploadsDir = path.join(__dirname, "..", "uploads", "properties");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (
      allowed.test(path.extname(file.originalname).toLowerCase()) &&
      allowed.test(file.mimetype)
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpg, jpeg, png, webp) are allowed."));
    }
  },
});

async function attachRelations(property) {
  const images = await db
    .prepare(
      "SELECT * FROM property_images WHERE property_id = $1 ORDER BY is_primary DESC, id ASC",
    )
    .all(property.id);
  property.images = images.filter(
    (img) =>
      img?.image_path &&
      img.image_path !== "/uploads/properties/undefined" &&
      img.image_path !== "undefined"
  );
  property.virtual_tours = await db
    .prepare(
      "SELECT * FROM virtual_tours WHERE property_id = $1 ORDER BY id ASC",
    )
    .all(property.id);
  return property;
}

// GET all properties
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { category, property_type, status, search } = req.query;
    let query = "SELECT * FROM properties WHERE 1=1";
    const params = [];
    let paramCount = 1;

    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    if (property_type) {
      query += ` AND property_type = $${paramCount}`;
      params.push(property_type);
      paramCount++;
    }
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    if (search) {
      query += ` AND (building_name ILIKE $${paramCount} OR location ILIKE $${paramCount + 1})`;
      params.push(`%${search}%`, `%${search}%`);
      paramCount += 2;
    }

    query += " ORDER BY created_at DESC";
    const properties = await db.prepare(query).all(...params);
    const result = await Promise.all(properties.map(attachRelations));
    res.json(result);
  } catch (err) {
    console.error("GET properties error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET stats
router.get("/stats/summary", authMiddleware, async (req, res) => {
  try {
    const totalRes = await db
      .prepare("SELECT COUNT(*) as count FROM properties")
      .get();
    const total = totalRes?.count || 0;

    const shortTermRes = await db
      .prepare("SELECT COUNT(*) as count FROM properties WHERE category = $1")
      .get("short_term_rent");
    const shortTerm = shortTermRes?.count || 0;

    const longTermRes = await db
      .prepare("SELECT COUNT(*) as count FROM properties WHERE category = $1")
      .get("long_term_rent");
    const longTerm = longTermRes?.count || 0;

    const saleRes = await db
      .prepare("SELECT COUNT(*) as count FROM properties WHERE category = $1")
      .get("sale");
    const sale = saleRes?.count || 0;

    const activeRes = await db
      .prepare("SELECT COUNT(*) as count FROM properties WHERE status = $1")
      .get("active");
    const active = activeRes?.count || 0;

    const recent = await db
      .prepare("SELECT * FROM properties ORDER BY created_at DESC LIMIT 5")
      .all();
    const recentMapped = await Promise.all(recent.map(attachRelations));

    res.json({
      total,
      shortTerm,
      longTerm,
      sale,
      active,
      inactive: total - active,
      recent: recentMapped,
    });
  } catch (err) {
    console.error("GET stats error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET single property
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const property = await db
      .prepare("SELECT * FROM properties WHERE id = $1")
      .get(req.params.id);
    if (!property)
      return res.status(404).json({ error: "Property not found." });
    res.json(await attachRelations(property));
  } catch (err) {
    console.error("GET property error:", err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE property
router.post(
  "/",
  authMiddleware,
  upload.array("images", 20),
  async (req, res) => {
    try {
      const d = req.body;
      const virtualTours = d.virtual_tours ? JSON.parse(d.virtual_tours) : [];

      const result = await db
        .prepare(
          `
      INSERT INTO properties (
        category, property_type, building_name, location, bedrooms, bathrooms,
        floor_area, land_area, num_floors, story_type, furnished, max_occupancy,
        min_stay, per_night_rate, per_week_rate, per_month_rate, rent_per_month,
        security_deposit, upfront_rental, rental_period, sale_price,
        access_road_width, parking, description, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING id
    `,
        )
        .run(
          d.category,
          d.property_type,
          d.building_name || null,
          d.location || null,
          d.bedrooms || null,
          d.bathrooms || null,
          d.floor_area || null,
          d.land_area || null,
          d.num_floors || null,
          d.story_type || null,
          d.furnished || null,
          d.max_occupancy || null,
          d.min_stay || null,
          d.per_night_rate || null,
          d.per_week_rate || null,
          d.per_month_rate || null,
          d.rent_per_month || null,
          d.security_deposit || null,
          d.upfront_rental || null,
          d.rental_period || null,
          d.sale_price || null,
          d.access_road_width || null,
          d.parking || null,
          d.description || null,
          d.status || "active",
        );

      const propertyId = result?.rows?.[0]?.id;

      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];

          const imageUrl = await uploadToOracle(file);

          await db.prepare(
            "INSERT INTO property_images (property_id, image_path, is_primary) VALUES ($1, $2, $3)"
          ).run(
            propertyId,  // 🔥 NOW NOT NULL
            imageUrl,
            i === 0 ? 1 : 0
          );
        }
      }

      if (virtualTours.length > 0) {
        for (const t of virtualTours) {
          await db
            .prepare(
              "INSERT INTO virtual_tours (property_id, room_name, tour_url) VALUES ($1, $2, $3)",
            )
            .run(propertyId, t.room_name, t.tour_url);
        }
      }

      const property = await db
        .prepare("SELECT * FROM properties WHERE id = $1")
        .get(propertyId);
      res.status(201).json(await attachRelations(property));
    } catch (err) {
      console.error("CREATE property error:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

// UPDATE property
router.put(
  "/:id",
  authMiddleware,
  upload.array("images", 20),
  async (req, res) => {
    try {
      const { id } = req.params;
      const d = req.body;
      const virtualTours = d.virtual_tours ? JSON.parse(d.virtual_tours) : [];

      const existing = await db
        .prepare("SELECT * FROM properties WHERE id = $1")
        .get(id);
      if (!existing)
        return res.status(404).json({ error: "Property not found." });

      await db
        .prepare(
          `
      UPDATE properties SET
        category=$1, property_type=$2, building_name=$3, location=$4,
        bedrooms=$5, bathrooms=$6, floor_area=$7, land_area=$8,
        num_floors=$9, story_type=$10, furnished=$11, max_occupancy=$12,
        min_stay=$13, per_night_rate=$14, per_week_rate=$15, per_month_rate=$16,
        rent_per_month=$17, security_deposit=$18, upfront_rental=$19,
        rental_period=$20, sale_price=$21, access_road_width=$22, parking=$23,
        description=$24, status=$25, updated_at=CURRENT_TIMESTAMP
      WHERE id=$26
    `,
        )
        .run(
          d.category,
          d.property_type,
          d.building_name || null,
          d.location || null,
          d.bedrooms || null,
          d.bathrooms || null,
          d.floor_area || null,
          d.land_area || null,
          d.num_floors || null,
          d.story_type || null,
          d.furnished || null,
          d.max_occupancy || null,
          d.min_stay || null,
          d.per_night_rate || null,
          d.per_week_rate || null,
          d.per_month_rate || null,
          d.rent_per_month || null,
          d.security_deposit || null,
          d.upfront_rental || null,
          d.rental_period || null,
          d.sale_price || null,
          d.access_road_width || null,
          d.parking || null,
          d.description || null,
          d.status || "active",
          id,
        );

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const imageUrl = await uploadToOracle(file);
          await db
            .prepare(
              "INSERT INTO property_images (property_id, image_path, is_primary) VALUES ($1, $2, $3)",
            )
            .run(id, imageUrl, 0);
        }
      }

      if (d.removed_images) {
        const removedIds = JSON.parse(d.removed_images);
        for (const imgId of removedIds) {
          const img = await db
            .prepare(
              "SELECT * FROM property_images WHERE id = $1 AND property_id = $2",
            )
            .get(imgId, id);
          if (img) {
            if (img.image_path?.includes("/n/") && img.image_path?.includes("/b/")) {
              await deleteFromOracle(img.image_path);
            } else {
              const filePath = path.join(__dirname, "..", img.image_path || "");
              if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            await db
              .prepare("DELETE FROM property_images WHERE id = $1")
              .run(imgId);
          }
        }
      }

      await db
        .prepare("DELETE FROM virtual_tours WHERE property_id = $1")
        .run(id);
      if (virtualTours.length > 0) {
        for (const t of virtualTours) {
          await db
            .prepare(
              "INSERT INTO virtual_tours (property_id, room_name, tour_url) VALUES ($1, $2, $3)",
            )
            .run(id, t.room_name, t.tour_url);
        }
      }

      const property = await db
        .prepare("SELECT * FROM properties WHERE id = $1")
        .get(id);
      res.json(await attachRelations(property));
    } catch (err) {
      console.error("UPDATE property error:", err);
      res.status(500).json({ error: err.message });
    }
  },
);

// DELETE property
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await db
      .prepare("SELECT * FROM properties WHERE id = $1")
      .get(id);

    if (!existing)
      return res.status(404).json({ error: "Property not found." });

    const images = await db
      .prepare("SELECT * FROM property_images WHERE property_id = $1")
      .all(id);

    for (const img of images) {
      await deleteFromOracle(img.image_path); // 🔥 important
    }

    await db.prepare("DELETE FROM properties WHERE id = $1").run(id);

    res.json({ message: "Property and images deleted successfully." });
  } catch (err) {
    console.error("DELETE property error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
