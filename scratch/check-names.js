require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const res = await pool.query('SELECT username, name, role FROM "User"');
  console.table(res.rows);
  await pool.end();
}

main().catch(console.error);
