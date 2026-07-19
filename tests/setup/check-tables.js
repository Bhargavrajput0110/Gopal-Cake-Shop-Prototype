require('dotenv').config({path: '.env.test'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT schemaname, tablename FROM pg_tables WHERE tablename NOT LIKE 'pg_%' AND tablename NOT LIKE 'sql_%'")
  .then(r => console.log(r.rows))
  .catch(console.error)
  .finally(() => pool.end());
