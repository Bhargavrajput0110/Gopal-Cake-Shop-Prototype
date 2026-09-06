const { Client } = require('pg');

async function testFetchOrder() {
  const client = new Client('postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres');
  await client.connect();
  const res = await client.query('SELECT * FROM "OrderItemMedia" WHERE "orderItemId" = $1', ['cmtlvf41e00254gu3hteuh3f4']);
  console.log("Media:", res.rows);
  const res2 = await client.query('SELECT * FROM "OrderItem" WHERE id = $1', ['cmtlvf41e00254gu3hteuh3f4']);
  console.log("Item:", res2.rows);
  await client.end();
}
testFetchOrder();
