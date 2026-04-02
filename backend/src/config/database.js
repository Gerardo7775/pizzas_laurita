const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // <--- CRÍTICO para conectarse a Neon / Render
  }
});

pool.on('error', (err) => {
  console.error('Error inesperado de PostgreSQL', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
