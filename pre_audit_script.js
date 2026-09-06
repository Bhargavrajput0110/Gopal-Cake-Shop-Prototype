const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  await client.connect();
  
  console.log("--- BRANCH TABLE ---");
  const branches = await client.query('SELECT id, name, code, "isActive" FROM "Branch"');
  console.table(branches.rows);

  console.log("\\n--- USER TABLE COLUMNS ---");
  const columns = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'User'
  `);
  console.table(columns.rows);

  await client.end();
}

run();
