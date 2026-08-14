require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function listDesigns() {
  const { rows } = await pool.query('SELECT id, name, code, "imageUrl", "createdAt" FROM "Design" ORDER BY name ASC');
  console.log(`Total designs in DB: ${rows.length}\n`);
  rows.forEach(r => {
    console.log(`[${r.code}] ${r.name}`);
    console.log(`   img: ${r.imageUrl || '(none)'}`);
    console.log(`   id: ${r.id}`);
    console.log('');
  });
}

listDesigns().catch(console.error).finally(() => pool.end());
