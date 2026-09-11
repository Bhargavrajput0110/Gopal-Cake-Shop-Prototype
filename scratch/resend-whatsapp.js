const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function run() {
  const failedOrders = [
    'cmtvm8glw000004lcs2en61jt', // ORD-1789050095595-83E0
    'cmtr8epy2000104l4y9rq84ax', // ORD-1789044921727-94
    'cmtrexff7000004la1r1p0z2b', // ORD-1789044129545-538
    'cmtvim3n7000004l823y4k45x'  // ORD-1789044094441-600
  ];

  for (const orderId of failedOrders) {
    const orderRes = await pool.query(`SELECT "orderNumber", "branchId" FROM "Order" WHERE id = $1`, [orderId]);
    if (orderRes.rows.length === 0) continue;
    
    const order = orderRes.rows[0];
    
    const payload = {
      action: "ORDER_APPROVED",
      orderId: orderId,
      orderNumber: order.orderNumber,
      branchId: order.branchId,
      actorId: "system",
      nextState: "WAITING_FOR_CHEF"
    };

    const eventId = "resend_" + Date.now() + "_" + orderId.slice(-6);

    await pool.query(`
      INSERT INTO "Outbox" ("id", "eventId", "eventType", "payload", "status")
      VALUES (gen_random_uuid(), $1, 'TIMELINE_CREATED', $2, 'PENDING')
    `, [eventId, JSON.stringify(payload)]);
    
    console.log(`Re-queued WhatsApp for order ${order.orderNumber}`);
  }
  pool.end();
}

run().catch(e => { console.error(e); pool.end(); });
