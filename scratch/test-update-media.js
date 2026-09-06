const { Client } = require('pg');

async function testFetchOrder() {
  const client = new Client('postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres');
  await client.connect();
  await client.query(`UPDATE "OrderItemMedia" SET url='https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500' WHERE id='test-media-1'`);
  console.log("Updated!");
  await client.end();
}
testFetchOrder();
