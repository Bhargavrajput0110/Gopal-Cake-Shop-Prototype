const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
});

async function run() {
  try {
    await client.connect();
    
    // Total DB size
    const dbSize = await client.query("SELECT pg_size_pretty(pg_database_size(current_database())) AS size, pg_database_size(current_database()) AS bytes;");
    console.log("Database Size:", dbSize.rows[0]);
    
    // Order table size
    const orderSize = await client.query(`SELECT pg_size_pretty(pg_total_relation_size('"Order"')) AS size, pg_total_relation_size('"Order"') AS bytes, (SELECT count(*) FROM "Order") as count;`);
    console.log("Order Table Stats:", orderSize.rows[0]);
    
  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
