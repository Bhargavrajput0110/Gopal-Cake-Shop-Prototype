const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function check() {
  const connectionString = "postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  
  const res = await client.query('SELECT id, "passwordHash", status FROM "User" WHERE id = $1', ['usr_admin']);
  console.log('User from DB:', res.rows[0]);
  
  if (res.rows[0]) {
    const isValid = await bcrypt.compare('0000', res.rows[0].passwordHash);
    console.log('Password valid:', isValid);
  }
  
  await client.end();
}

check().catch(console.error);
