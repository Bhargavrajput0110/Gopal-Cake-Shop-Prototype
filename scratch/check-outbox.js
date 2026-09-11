const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true' });

async function run() {
  console.log('=== OUTBOX (Recent TIMELINE_CREATED) ===');
  const outbox = await pool.query(`
    SELECT id, "eventId", status, "occurredAt", "processedAt", "error"
    FROM "Outbox"
    WHERE "eventType" = 'TIMELINE_CREATED'
    ORDER BY "occurredAt" DESC
    LIMIT 10
  `);
  console.log(JSON.stringify(outbox.rows, null, 2));

  console.log('\n=== NOTIFICATION LOG (Recent) ===');
  const notif = await pool.query(`
    SELECT id, "orderId", "templateName", status, "errorMessage", "createdAt", "recipient"
    FROM "NotificationLog"
    ORDER BY "createdAt" DESC
    LIMIT 5
  `);
  console.log(JSON.stringify(notif.rows, null, 2));

  pool.end();
}
run().catch(e => { console.error(e); pool.end(); });
