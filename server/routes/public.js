const express = require("express");
const db = require("../config/database");

const router = express.Router();

function extractPanoramaImageUrl(html) {
  if (!html || typeof html !== "string") return "";
  const plainMatches =
    html.match(
      /https?:\/\/[^"'\\\s>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s>]*)?/gi,
    ) || [];

  // Insta360 often stores media URLs as escaped strings inside inline JSON.
  const unescapedHtml = html
    .replace(/\\u002F/gi, "/")
    .replace(/\\u0026/gi, "&")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&");
  const escapedMatches =
    unescapedHtml.match(
      /https?:\/\/[^"'\\\s>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s>]*)?/gi,
    ) || [];

  const urlMatches = Array.from(new Set([...plainMatches, ...escapedMatches]));
  if (!urlMatches.length) return "";

  const scoreUrl = (rawUrl) => {
    const url = rawUrl.toLowerCase();
    let score = 0;
    if (/insta360|cloud-media|panorama|pano|equirectangular/.test(url))
      score += 20;
    if (/2x1|8192|6144|4096|original|origin|full|raw/.test(url)) score += 20;
    if (/share_cover|1x1|thumb|thumbnail|avatar|logo|icon/.test(url))
      score -= 100;
    if (/\/cloud-media-.*\.insta360\.com\//.test(url)) score += 5;
    return score;
  };

  const unique = urlMatches;
  unique.sort((a, b) => scoreUrl(b) - scoreUrl(a) || b.length - a.length);
  return unique[0] || "";
}

function isAllowedInsta360Url(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return /(^|\.)insta360\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

function isAllowedInsta360MediaUrl(value) {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return /(^|\.)insta360\.com$/i.test(parsed.hostname);
  } catch {
    return false;
  }
}

async function attachRelations(property) {
  property.images = await db
    .prepare(
      "SELECT * FROM property_images WHERE property_id = $1 ORDER BY is_primary DESC, id ASC",
    )
    .all(property.id);
  property.virtual_tours = await db
    .prepare(
      "SELECT * FROM virtual_tours WHERE property_id = $1 ORDER BY id ASC",
    )
    .all(property.id);
  return property;
}

// GET all active properties with filters
router.get("/properties", async (req, res) => {
  try {
    const {
      category,
      property_type,
      location,
      min_price,
      max_price,
      page = 1,
      limit = 12,
    } = req.query;

    let query = "SELECT * FROM properties WHERE status = $1 ";
    const params = ["active"];
    let paramCount = 2;

    if (category) {
      query += `AND category = $${paramCount} `;
      params.push(category);
      paramCount++;
    }

    if (property_type) {
      query += `AND property_type = $${paramCount} `;
      params.push(property_type);
      paramCount++;
    }

    if (location) {
      query += `AND location ILIKE $${paramCount} `;
      params.push(`%${location}%`);
      paramCount++;
    }

    // Price filtering based on category
    if (min_price && category === "short_term_rent") {
      query += `AND per_night_rate >= $${paramCount} `;
      params.push(Number(min_price));
      paramCount++;
    }
    if (max_price && category === "short_term_rent") {
      query += `AND per_night_rate <= $${paramCount} `;
      params.push(Number(max_price));
      paramCount++;
    }

    if (min_price && category === "long_term_rent") {
      query += `AND rent_per_month >= $${paramCount} `;
      params.push(Number(min_price));
      paramCount++;
    }
    if (max_price && category === "long_term_rent") {
      query += `AND rent_per_month <= $${paramCount} `;
      params.push(Number(max_price));
      paramCount++;
    }

    if (min_price && category === "sale") {
      query += `AND sale_price >= $${paramCount} `;
      params.push(Number(min_price));
      paramCount++;
    }
    if (max_price && category === "sale") {
      query += `AND sale_price <= $${paramCount} `;
      params.push(Number(max_price));
      paramCount++;
    }

    const countResult = await db
      .prepare(query)
      .all(...params.slice(0, paramCount - 1));
    const total = countResult.length;

    query +=
      "ORDER BY created_at DESC LIMIT $" +
      paramCount +
      " OFFSET $" +
      (paramCount + 1);
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.max(1, Number(limit));
    const offset = (pageNum - 1) * limitNum;

    params.push(limitNum, offset);

    const properties = await db.prepare(query).all(...params);
    const propertiesMapped = await Promise.all(properties.map(attachRelations));

    res.json({
      properties: propertiesMapped,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    console.error("GET properties error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET single property details
router.get("/properties/:id", async (req, res) => {
  try {
    const property = await db
      .prepare("SELECT * FROM properties WHERE id = $1 AND status = $2")
      .get(req.params.id, "active");
    if (!property)
      return res.status(404).json({ error: "Property not found." });

    res.json(await attachRelations(property));
  } catch (err) {
    console.error("GET property error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET featured/random properties
router.get("/featured", async (req, res) => {
  try {
    const properties = await db
      .prepare(
        "SELECT * FROM properties WHERE status = $1 ORDER BY RANDOM() LIMIT 6",
      )
      .all("active");
    const propertiesMapped = await Promise.all(properties.map(attachRelations));
    res.json(propertiesMapped);
  } catch (err) {
    console.error("GET featured error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST extract Insta360 panorama image URL for inline viewer
router.post("/panorama/extract", async (req, res) => {
  try {
    const inputUrl = String(req.body?.url || "").trim();
    if (!inputUrl) {
      return res.status(400).json({ error: "URL is required." });
    }

    const targetUrl = /^https?:\/\//i.test(inputUrl)
      ? inputUrl
      : `https://${inputUrl}`;

    let parsedUrl;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: "Invalid URL." });
    }

    if (!isAllowedInsta360Url(parsedUrl.toString())) {
      return res
        .status(400)
        .json({ error: "Only Insta360 links are supported here." });
    }

    const response = await fetch(parsedUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      return res
        .status(400)
        .json({ error: "Could not open Insta360 share link." });
    }

    const html = await response.text();
    const imageUrl = extractPanoramaImageUrl(html);

    if (!imageUrl) {
      return res
        .status(422)
        .json({ error: "Could not extract panorama image from this link." });
    }

    const proxyUrl = `/api/public/panorama/image?url=${encodeURIComponent(
      imageUrl,
    )}&source=${encodeURIComponent(parsedUrl.toString())}`;
    res.json({ imageUrl, proxyUrl });
  } catch (err) {
    console.error("POST panorama extract error:", err);
    res.status(500).json({ error: "Failed to extract panorama image." });
  }
});

// GET stream panorama image via backend to avoid browser CORS issues
router.get("/panorama/image", async (req, res) => {
  try {
    const imageUrl = String(req.query?.url || "").trim();
    const sourceUrl = String(req.query?.source || "").trim();
    if (!imageUrl) {
      return res.status(400).json({ error: "Image URL is required." });
    }

    if (!isAllowedInsta360MediaUrl(imageUrl)) {
      return res.status(400).json({ error: "Invalid panorama image source." });
    }

    const safeSourceUrl =
      sourceUrl && isAllowedInsta360Url(sourceUrl) ? sourceUrl : "";

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: safeSourceUrl || "https://cloud-sg.insta360.com/",
        Origin: "https://cloud-sg.insta360.com",
      },
    });

    if (!response.ok) {
      return res.status(400).json({
        error: `Could not fetch panorama image (upstream ${response.status}).`,
      });
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=300");
    return res.send(imageBuffer);
  } catch (err) {
    console.error("GET panorama image error:", err);
    return res.status(500).json({ error: "Failed to stream panorama image." });
  }
});

// POST inquiry
router.post("/inquiries", async (req, res) => {
  try {
    const { property_id, full_name, email, phone, subject, message } = req.body;

    if (!full_name || !email || !message) {
      return res
        .status(400)
        .json({ error: "Name, email, and message are required." });
    }

    const result = await db
      .prepare(
        `
      INSERT INTO inquiries (property_id, full_name, email, phone, subject, message)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `,
      )
      .run(
        property_id || null,
        full_name,
        email,
        phone || null,
        subject || null,
        message,
      );

    res.status(201).json({
      id: result?.id,
      message: "Inquiry submitted successfully. We will contact you soon.",
    });
  } catch (err) {
    console.error("POST inquiry error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
