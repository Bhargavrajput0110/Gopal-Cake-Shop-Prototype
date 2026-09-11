const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  const r1 = await p.query("SELECT column_name FROM information_schema.columns WHERE table_name='OrderItem' ORDER BY column_name");
  console.log('OrderItem columns:', r1.rows.map(x => x.column_name).join(', '));
  const r2 = await p.query("SELECT column_name FROM information_schema.columns WHERE table_name='Payment' ORDER BY column_name");
  console.log('Payment columns:', r2.rows.map(x => x.column_name).join(', '));
  await p.end();
}
run().catch(e => { console.error(e.message); p.end(); });
