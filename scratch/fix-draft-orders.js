const { Pool } = require('pg');

const DATABASE_URL = "postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const pool = new Pool({ connectionString: DATABASE_URL });

async function fixDraftOrders() {
  // Find all DRAFT orders with their payments
  const result = await pool.query(`
    SELECT o.id, o."orderNumber", o.status, o."createdAt", 
           p.status as payment_status, p.amount
    FROM "Order" o
    LEFT JOIN "Payment" p ON p."orderId" = o.id
    WHERE o.status = 'DRAFT'
    ORDER BY o."createdAt" DESC
  `);

  console.log('DRAFT orders found:', result.rows.length);
  if (result.rows.length > 0) {
    console.log(JSON.stringify(result.rows, null, 2));
  }

  // Promote orders that have a SUCCESS payment
  const toPromote = result.rows.filter(r => r.payment_status === 'SUCCESS');
  console.log('\nOrders with successful payment stuck in DRAFT:', toPromote.length);

  for (const order of toPromote) {
    await pool.query(`UPDATE "Order" SET status = 'NEW' WHERE id = $1`, [order.id]);
    console.log(`✅ Promoted ${order.orderNumber} to NEW`);
  }

  if (toPromote.length === 0) {
    console.log('No paid orders stuck in DRAFT.');
  }

  pool.end();
}

fixDraftOrders().catch(e => { console.error('Error:', e.message); pool.end(); });
