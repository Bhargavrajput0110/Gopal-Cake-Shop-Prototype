const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const { rows } = await pool.query(`SELECT id, status, type, source, "totalAmount", "orderNumber" FROM "Order" WHERE "orderNumber" = 'ORD-1789044013498-5A1B'`);
  console.log('ORDER:', rows);
  
  if (rows.length > 0) {
    const tl = await pool.query(`SELECT status, "nextState", action, note, "createdAt" FROM "Timeline" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`, [rows[0].id]);
    console.log('TIMELINE:', tl.rows);
  }
}
main().catch(console.error).finally(() => pool.end());
