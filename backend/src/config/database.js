const { Pool } = require('pg');
require('dotenv').config();

// Si hay DATABASE_URL (modo nube: Neon, Render, etc.), la usamos directo.
// Si no, usamos las variables individuales (modo local).
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Necesario para Neon/Render
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS,
      database: process.env.DB_NAME || 'pizzas_laurita',
      ssl: false // Sin SSL para conexión local
    };

const pool = new Pool(poolConfig);

pool.on('error', (err) => {
  console.error('Error inesperado de PostgreSQL', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
