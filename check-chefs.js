const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    
    // Query chefs in Uma
    const res = await client.query(`
      SELECT id, name, "branchId" 
      FROM "User" 
      WHERE role = 'CHEF' AND "branchId" ILIKE '%uma%'
    `);
    
    console.log("Chefs in Uma:", res.rows.length);
    console.log(res.rows);
    
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
