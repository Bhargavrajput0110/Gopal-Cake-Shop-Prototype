const { Client } = require('pg');

async function testFetchOrder() {
  const client = new Client('postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres');
  await client.connect();
  const res = await client.query('SELECT * FROM "Order" WHERE "orderNumber" = $1', ['ORD-1788460860633-C867']);
  console.log(res.rows);
  await client.end();
}
testFetchOrder();
