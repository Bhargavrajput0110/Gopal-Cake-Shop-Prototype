const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const r = await p.query(`
    SELECT o."orderNumber", o."deliveryType", o."deliveryAddress", o."totalAmount",
           oi."productName", oi."messageOnCake", oi.notes, c.phone, c.name
    FROM "Order" o
    JOIN "OrderItem" oi ON oi."orderId" = o.id
    JOIN "Customer" c ON c.id = o."customerId"
    WHERE o."orderNumber" = 'ORD-1788518821176-BD36'
  `);
  console.log(JSON.stringify(r.rows, null, 2));
  await p.end();
}
run().catch(e => { console.error(e.message); p.end(); });
