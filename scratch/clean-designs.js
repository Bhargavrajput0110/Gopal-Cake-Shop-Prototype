require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanDuplicates() {
  const { rows: designs } = await pool.query('SELECT * FROM "Design" ORDER BY "createdAt" ASC');
  
  const seenNames = new Set();
  const toDelete = [];
  
  for (const d of designs) {
    if (seenNames.has(d.name)) {
      toDelete.push(`'${d.id}'`);
    } else {
      seenNames.add(d.name);
    }
  }
  
  console.log(`Found ${designs.length} total designs.`);
  console.log(`Deleting ${toDelete.length} duplicates.`);
  
  if (toDelete.length > 0) {
    const ids = toDelete.join(', ');
    const res = await pool.query(`DELETE FROM "Design" WHERE id IN (${ids})`);
    console.log(`Deleted ${res.rowCount} items.`);
  }
}

cleanDuplicates().catch(console.error).finally(() => pool.end());
