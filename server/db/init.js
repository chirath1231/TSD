const db = require("../config/database");
const bcrypt = require("bcryptjs");

async function initDB() {
  try {
    // Create tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS properties (
        id SERIAL PRIMARY KEY,
        category TEXT NOT NULL CHECK(category IN ('short_term_rent', 'long_term_rent', 'sale')),
        property_type TEXT NOT NULL CHECK(property_type IN ('apartment', 'house', 'commercial', 'land')),
        building_name TEXT,
        location TEXT,
        bedrooms INTEGER,
        bathrooms INTEGER,
        floor_area NUMERIC,
        land_area NUMERIC,
        num_floors INTEGER,
        story_type TEXT,
        furnished TEXT,
        max_occupancy INTEGER,
        min_stay INTEGER,
        per_night_rate NUMERIC,
        per_week_rate NUMERIC,
        per_month_rate NUMERIC,
        rent_per_month NUMERIC,
        security_deposit NUMERIC,
        upfront_rental NUMERIC,
        rental_period TEXT,
        sale_price NUMERIC,
        access_road_width TEXT,
        parking TEXT,
        description TEXT,
        status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS property_images (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        image_path TEXT NOT NULL,
        is_primary INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS virtual_tours (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        room_name TEXT NOT NULL,
        tour_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        property_id INTEGER,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT,
        message TEXT,
        status TEXT DEFAULT 'new' CHECK(status IN ('new', 'read', 'responded')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
      );
    `);

    // Check if default admin exists
    const admin = await db
      .prepare("SELECT id FROM admins WHERE username = $1")
      .get("admin");

    if (!admin) {
      const hash = bcrypt.hashSync("admin123", 10);
      await db
        .prepare("INSERT INTO admins (username, password_hash) VALUES ($1, $2)")
        .run("admin", hash);
      console.log(
        "✓ Default admin created — username: admin, password: admin123",
      );
    } else {
      console.log("✓ Default admin already exists");
    }

    console.log("✓ Database initialized successfully with PostgreSQL");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
  }
}

module.exports = { initDB };
