const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function checkKapil() {
  const client = new Client('postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres');
  await client.connect();
  const res = await client.query(`SELECT id, name, "passwordHash", status FROM "User" WHERE name = 'Kapil'`);
  console.log("User:", res.rows[0]);
  if (res.rows.length > 0) {
    const user = res.rows[0];
    const isValid = await bcrypt.compare("8045", user.passwordHash);
    console.log("PIN 8045 matches:", isValid);
  }
  await client.end();
}
checkKapil();
