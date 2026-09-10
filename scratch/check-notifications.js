const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function run() {
  // Check the Outbox table for failed notifications with their payload
  const outbox = await pool.query(`
    SELECT id, payload, status, "createdAt", "processedAt"
    FROM "Outbox"
    ORDER BY "createdAt" DESC
    LIMIT 10
  `).catch(e => { console.error("Outbox query error:", e.message); return {rows:[]}; });
  
  if (outbox.rows.length) {
    console.log('=== OUTBOX (last 10) ===');
    console.log(JSON.stringify(outbox.rows, null, 2));
  }

  // Also check NotificationLog for the full error context on the most recent failure
  const log = await pool.query(`
    SELECT id, "orderId", "templateName", status, "errorMessage", "createdAt", "recipient"
    FROM "NotificationLog"
    WHERE status = 'FAILED_FINAL'
    ORDER BY "createdAt" DESC
    LIMIT 5
  `).catch(e => { console.error("NotificationLog query error:", e.message); return {rows:[]}; });
  
  console.log('\n=== FAILED WHATSAPP NOTIFICATIONS ===');
  console.log(JSON.stringify(log.rows, null, 2));

  // Check what order data looks like for one of the failed orders
  if (log.rows.length > 0) {
    const orderId = log.rows[0].orderId;
    const order = await pool.query(`
      SELECT o.id, o."orderNumber", o."deliveryType", o."deliveryAddress",
             c.name as customer_name, c.phone as customer_phone,
             oi.name as item_name, oi.quantity, oi."messageOnCake", oi.notes
      FROM "Order" o
      LEFT JOIN "Customer" c ON c.id = o."customerId"
      LEFT JOIN "OrderItem" oi ON oi."orderId" = o.id
      WHERE o.id = $1
    `, [orderId]);
    console.log('\n=== ORDER DATA FOR FAILED NOTIFICATION ===');
    console.log(JSON.stringify(order.rows, null, 2));
  }

  pool.end();
}

run().catch(e => { console.error(e.message); pool.end(); });
