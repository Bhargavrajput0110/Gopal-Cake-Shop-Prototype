const { Client } = require('pg');
const connectionString = "postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

async function addMedia() {
  const client = new Client({ connectionString });
  await client.connect();
  
  await client.query(`
    INSERT INTO "OrderItemMedia" (id, "orderItemId", type, url, "createdAt")
    VALUES ('test-media-1', 'cmtlvf41e00254gu3hteuh3f4', 'REFERENCE', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500', NOW())
    ON CONFLICT DO NOTHING;
  `);
  console.log('Inserted dummy media');
  
  await client.end();
}

addMedia().catch(console.error);
