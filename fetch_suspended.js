const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:5432/postgres' });
async function run() {
  await client.connect();
  const { rows: suspended } = await client.query('SELECT * FROM "User" WHERE status = $1', ['SUSPENDED']);
  for (let u of suspended) {
    const ordersCreated = (await client.query('SELECT count(*) FROM "Order" WHERE "createdById" = $1', [u.id])).rows[0].count;
    const ordersDriven = (await client.query('SELECT count(*) FROM "Order" WHERE "driverId" = $1', [u.id])).rows[0].count;
    const itemsAssigned = (await client.query('SELECT count(*) FROM "OrderItem" WHERE "assignedVendorId" = $1', [u.id])).rows[0].count;
    u.hasRelations = (parseInt(ordersCreated) + parseInt(ordersDriven) + parseInt(itemsAssigned)) > 0;
    
    let branchName = 'GLOBAL';
    if (u.branchId) {
      if (u.branchId === 'uma') branchName = 'UMA';
      else if (u.branchId === 'cmswuiiu000021su3kv1mr41f') branchName = 'WARASHIYA';
      else if (u.branchId === 'cmswuiita00011su3977ajl1z') branchName = 'MARKET';
      else if (u.branchId === 'cmswuiiun00031su3vfrn9eq5') branchName = 'ELLORAPARK';
      else if (u.branchId === 'khanderao') branchName = 'KHANDERAO (KHD)';
      else branchName = u.branchId;
    }
    u.branchName = branchName;
  }
  
  let markdown = "| ID | Name | Role | Branch | Phone | Has Historical Relations? | Status |\n";
  markdown += "|---|---|---|---|---|---|---|\n";
  for (let u of suspended) {
    markdown += `| ${u.id} | ${u.name} | ${u.role} | ${u.branchName} | ${u.phone || 'N/A'} | ${u.hasRelations ? 'Yes' : 'No'} | SUSPENDED |\n`;
  }
  console.log(markdown);
  
  // Confirmations
  const { rows: activeStaff } = await client.query('SELECT * FROM "User" WHERE status = $1', ['ACTIVE']);
  console.log('\\n--- CONFIRMATIONS ---');
  console.log(`Active authoritative staff count: ${activeStaff.length}`);
  
  let duplicateCount = 0;
  const phoneSet = new Set();
  for (const u of activeStaff) {
    if (u.phone) {
      const p = u.phone.replace(/[^0-9]/g, '');
      if (phoneSet.has(p)) duplicateCount++;
      phoneSet.add(p);
    }
  }
  console.log(`Duplicate phone numbers among active users: ${duplicateCount}`);
  
  await client.end();
}
run().catch(console.error);
