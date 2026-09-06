const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
});

async function verify() {
  await client.connect();

  const { rows: activeStaff } = await client.query('SELECT * FROM "User" WHERE status = $1', ['ACTIVE']);
  const { rows: suspendedStaff } = await client.query('SELECT * FROM "User" WHERE status = $1', ['SUSPENDED']);
  const { rows: activeBranches } = await client.query('SELECT * FROM "Branch" WHERE "isActive" = $1 AND id != $2', [true, 'khanderao']);
  
  let duplicateCount = 0;
  const phoneSet = new Set();
  for (const u of activeStaff) {
    if (u.phone) {
      const p = u.phone.replace(/[^0-9]/g, '');
      if (phoneSet.has(p)) duplicateCount++;
      phoneSet.add(p);
    }
  }

  const roleMismatches = activeStaff.filter(u => u.role === 'HELPER_CHEF' || u.role === 'ALL_ROUNDER').length;
  const khdStaff = activeStaff.filter(u => u.branchId === 'khanderao').length;

  console.log('--- FINAL REPORT ---');
  console.log('Active authoritative staff: ' + activeStaff.length + ' (Expected 32)');
  console.log('Suspended legacy staff: ' + suspendedStaff.length);
  console.log('Duplicate phone numbers: ' + duplicateCount + ' (Expected 0)');
  console.log('Active KHD staff: ' + khdStaff + ' (Expected 0)');
  console.log('Role mismatches (Helper Chef/All Rounder): ' + roleMismatches + ' (Expected 0)');
  console.log('Active operational branches: ' + activeBranches.length + ' (Expected 4)');
  
  // Delivery Verification Check
  const pavan = activeStaff.find(u => u.phone && u.phone.includes('7285861400'));
  console.log('Pavan Delivery Scope: ' + (pavan ? pavan.deliveryScope : 'Not Found'));
  
  const baggi = activeStaff.find(u => u.phone && u.phone.includes('9978853563'));
  console.log('Baggi Delivery Scope: ' + (baggi ? baggi.deliveryScope : 'Not Found'));

  await client.end();
}

verify().catch(console.error);
