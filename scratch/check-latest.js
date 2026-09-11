const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  // Check Outbox column names
  const cols = await p.query("SELECT column_name FROM information_schema.columns WHERE table_name='Outbox' ORDER BY column_name");
  console.log('Outbox columns:', cols.rows.map(x => x.column_name).join(', '));

  const outbox = await p.query('SELECT * FROM "Outbox" ORDER BY id DESC LIMIT 10');
  console.log('\nRecent Outbox events:');
  console.log(JSON.stringify(outbox.rows, null, 2));
  await p.end();
}
run().catch(e => { console.error(e.message); p.end(); });
