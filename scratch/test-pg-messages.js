const { Client } = require('pg');

async function testFetchMessages() {
  const client = new Client('postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres');
  await client.connect();
  const res = await client.query('SELECT * FROM "Message" ORDER BY "createdAt" DESC LIMIT 10');
  console.log("Recent Messages:", res.rows);
  await client.end();
}
testFetchMessages();
