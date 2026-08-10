require('dotenv').config({ path: '/home/ubuntu/civilestimator/backend/.env' });
const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const content = fs.readFileSync('/home/ubuntu/civilestimator/rab-calculator.jsx', 'utf8');
const match = content.match(/const WORK_ITEMS = (\[[\s\S]*?\]);/);
if (!match) {
  console.error('WORK_ITEMS not found');
  process.exit(1);
}

const items = eval(match[1]);

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const item of items) {
      await client.query(
        `INSERT INTO work_item_library (id, nama, kategori, satuan, dims_config)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO NOTHING`,
        [item.id, item.name, item.category, item.unit, JSON.stringify(item.dims || [])]
      );
      for (const comp of item.components) {
        await client.query(
          `INSERT INTO work_item_components (work_item_id, nama_komponen, satuan, koefisien, harga_default)
           VALUES ($1, $2, $3, $4, $5)`,
          [item.id, comp.name, comp.satuan, comp.koef, comp.harga]
        );
      }
    }
    await client.query('COMMIT');
    console.log('Seeded', items.length, 'work items');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', err.message);
    console.error(err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
