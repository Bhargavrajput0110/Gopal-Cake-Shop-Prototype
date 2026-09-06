const { Client } = require('pg');
const connectionString = "postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

async function checkOrders() {
  const client = new Client({ connectionString });
  await client.connect();
  
  const res = await client.query('SELECT id, "orderNumber", "branchId", status FROM "Order"');
  console.log(JSON.stringify(res.rows, null, 2));
  
  await client.end();
}

checkOrders().catch(console.error);
