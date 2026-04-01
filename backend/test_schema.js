/**
 * DIAGNÓSTICO: Ver estructura real de la tabla pedidos
 */
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.DB_URL });

async function main() {
  const result = await pool.query(`
    SELECT column_name, data_type, character_maximum_length, column_default
    FROM information_schema.columns
    WHERE table_name = 'pedidos'
    ORDER BY ordinal_position;
  `);
  console.log('\n📋 Columnas de la tabla PEDIDOS:\n');
  result.rows.forEach(r => {
    console.log(`  ${r.column_name.padEnd(30)} ${r.data_type.padEnd(20)} default: ${r.column_default || 'NULL'}`);
  });
  await pool.end();
}

main().catch(console.error);
