const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seed() {
  const connectionString = "postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  
  const users = [
    { id: 'usr_admin', pin: '0000' },
    { id: 'usr_manager_khm', pin: '1111' },
    { id: 'usr_sales_khm', pin: '2222' },
    { id: 'usr_chef_khm', pin: '3333' },
    { id: 'usr_driver_khm', pin: '4444' },
    { id: 'usr_sales_uma', pin: '5555' },
    { id: 'usr_chef_uma', pin: '6666' },
    { id: 'usr_vendor_photo', pin: '7777' },
    { id: 'usr_vendor_florist', pin: '8888' },
    { id: 'usr_vendor_acrylic', pin: '9999' },
  ];
  
  for (const u of users) {
    const hash = await bcrypt.hash(u.pin, 10);
    await client.query('UPDATE "User" SET "passwordHash" = $1, "status" = $2 WHERE "id" = $3', [hash, 'ACTIVE', u.id]);
    console.log(`Updated ${u.id} to ACTIVE`);
  }
  
  await client.end();
}

seed().catch(console.error);
