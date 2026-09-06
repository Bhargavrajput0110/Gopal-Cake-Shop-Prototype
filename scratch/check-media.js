const { Client } = require('pg');
const connectionString = "postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

async function checkMedia() {
  const client = new Client({ connectionString });
  await client.connect();
  
  const orderRes = await client.query('SELECT id FROM "Order" WHERE "orderNumber" = \'ORD-1788460860633-C867\'');
  if (orderRes.rows.length === 0) {
    console.log("Order not found");
    return;
  }
  const orderId = orderRes.rows[0].id;
  
  const itemRes = await client.query('SELECT id, flavor, "productName" FROM "OrderItem" WHERE "orderId" = $1', [orderId]);
  console.log('Items:', itemRes.rows);
  
  for (const item of itemRes.rows) {
    const mediaRes = await client.query('SELECT * FROM "OrderItemMedia" WHERE "orderItemId" = $1', [item.id]);
    console.log('Media for', item.id, mediaRes.rows);
  }
  
  await client.end();
}

checkMedia().catch(console.error);
