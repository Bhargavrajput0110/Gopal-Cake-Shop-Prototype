const { Pool } = require('pg');
const p = new Pool({
  connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});
p.query('SELECT unnest(enum_range(NULL::"OrderStatus")) as s')
  .then(r => { console.log(r.rows.map(x => x.s).join(', ')); p.end(); })
  .catch(e => { console.error(e.message); p.end(); });
