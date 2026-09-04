const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false, // Required for Railway.app
  },
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

// Wrapper for easier migration from SQLite
const db = {
  // For exec() - run multiple SQL statements
  exec: async (sql) => {
    try {
      await pool.query(sql);
    } catch (err) {
      console.error("Database exec error:", err);
      throw err;
    }
  },

  // For prepare().run() - INSERT, UPDATE, DELETE
  prepare: (sql) => ({
    run: async (...params) => {
      try {
        const result = await pool.query(sql, params);
        return result;
      } catch (err) {
        console.error("Database run error:", err);
        throw err;
      }
    },
    get: async (...params) => {
      try {
        const result = await pool.query(sql, params);
        return result.rows[0] || null;
      } catch (err) {
        console.error("Database get error:", err);
        throw err;
      }
    },
    all: async (...params) => {
      try {
        const result = await pool.query(sql, params);
        return result.rows;
      } catch (err) {
        console.error("Database all error:", err);
        throw err;
      }
    },
  }),
};

// Direct query access
db.query = async (sql, params = []) => {
  try {
    const result = await pool.query(sql, params);
    return result;
  } catch (err) {
    console.error("Database query error:", err);
    throw err;
  }
};

module.exports = db;
module.exports.pool = pool;
