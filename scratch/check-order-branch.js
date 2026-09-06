const { Client } = require('pg');

async function checkOrder() {
  const client = new Client('postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres');
  await client.connect();
  const res = await client.query(`SELECT id, "orderNumber", "branchId", status FROM "Order" WHERE "orderNumber" = 'ORD-1788500753114-4F39'`);
  console.table(res.rows);
  await client.end();
}
checkOrder();
