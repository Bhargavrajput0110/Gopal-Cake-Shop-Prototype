const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    await client.query('ALTER TABLE "User" ADD COLUMN "deliveryScope" TEXT;');
    console.log("Successfully added deliveryScope column to User table.");
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log("Column deliveryScope already exists.");
    } else {
      console.error("Error adding column:", e);
    }
  }
  await client.end();
}

run();
