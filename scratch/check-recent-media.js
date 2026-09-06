const { Client } = require('pg');

async function checkRecentMedia() {
  const client = new Client('postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres');
  await client.connect();
  const res = await client.query('SELECT * FROM "OrderItemMedia" ORDER BY "createdAt" DESC LIMIT 10');
  console.log("Recent Media:", res.rows);
  await client.end();
}
checkRecentMedia();
