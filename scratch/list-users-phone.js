const { Client } = require('pg');

async function listUsers() {
  const client = new Client('postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres');
  await client.connect();
  const res = await client.query(`SELECT id, name, phone FROM "User"`);
  console.table(res.rows);
  await client.end();
}
listUsers();
