const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
});

const authoritativeStaff = [
  { id: 1, name: 'Lavkush', role: 'CHEF', branch: 'uma', phone: '917433846002', scope: null },
  { id: 2, name: 'Prince', role: 'CHEF', branch: 'uma', phone: '917600403838', scope: null },
  { id: 3, name: 'Sunil', role: 'CHEF', branch: 'uma', phone: '917275183843', scope: null },
  { id: 4, name: 'Pardeep', role: 'CHEF', branch: 'uma', phone: '917233988180', scope: null },
  { id: 5, name: 'Akshay', role: 'CHEF', branch: 'uma', phone: '919106673904', scope: null },
  { id: 6, name: 'Rajpal', role: 'CHEF', branch: 'uma', phone: '919918094482', scope: null },
  { id: 7, name: 'Sanket', role: 'SALESPERSON', branch: 'uma', phone: '919898616894', scope: null },
  { id: 8, name: 'Tushar', role: 'SALESPERSON', branch: 'uma', phone: '918758600680', scope: null },
  { id: 9, name: 'Vansha', role: 'SALESPERSON', branch: 'uma', phone: '919316901486', scope: null },
  { id: 10, name: 'Deepak', role: 'SALESPERSON', branch: 'uma', phone: '917572925443', scope: null },
  { id: 11, name: 'Twinkle', role: 'SALESPERSON', branch: 'uma', phone: '919712414524', scope: null },
  { id: 12, name: 'Golu', role: 'SALESPERSON', branch: 'uma', phone: '919925971653', scope: null },
  { id: 13, name: 'Dipu (bodybuilder)', role: 'CHEF', branch: 'cmswuiiu000021su3kv1mr41f', phone: '916353759436', scope: null },
  { id: 14, name: 'Shravan (ustaad)', role: 'CHEF', branch: 'cmswuiiu000021su3kv1mr41f', phone: '919369471741', scope: null },
  { id: 15, name: 'Sachin', role: 'CHEF', branch: 'cmswuiiu000021su3kv1mr41f', phone: '916352060350', scope: null },
  { id: 16, name: 'Naresh', role: 'SALESPERSON', branch: 'cmswuiiu000021su3kv1mr41f', phone: '917990269315', scope: null },
  { id: 17, name: 'Haru bhai', role: 'DELIVERY', branch: 'cmswuiiu000021su3kv1mr41f', phone: '918780860890', scope: 'WARASHIYA_PLUS_ASSIGNED' },
  { id: 18, name: 'Manoj', role: 'DELIVERY', branch: 'cmswuiiu000021su3kv1mr41f', phone: '918238158707', scope: 'WARASHIYA_PLUS_ASSIGNED' },
  { id: 19, name: 'Pari bhai', role: 'DELIVERY', branch: 'cmswuiiu000021su3kv1mr41f', phone: '919316678788', scope: 'WARASHIYA_PLUS_ASSIGNED' },
  { id: 20, name: 'Hitu bhai', role: 'DELIVERY', branch: 'cmswuiiu000021su3kv1mr41f', phone: '919023890336', scope: 'WARASHIYA' },
  { id: 21, name: 'Rubel', role: 'CHEF', branch: 'cmswuiita00011su3977ajl1z', phone: '919558091559', scope: null },
  { id: 22, name: 'Royal', role: 'CHEF', branch: 'cmswuiita00011su3977ajl1z', phone: '918469095150', scope: null },
  { id: 23, name: 'Raaz', role: 'CHEF', branch: 'cmswuiita00011su3977ajl1z', phone: '919382362696', scope: null },
  { id: 24, name: 'Amit', role: 'SALESPERSON', branch: 'cmswuiita00011su3977ajl1z', phone: '919558013321', scope: null },
  { id: 25, name: 'Amla kaka', role: 'SALESPERSON', branch: 'cmswuiita00011su3977ajl1z', phone: '919726480092', scope: null },
  { id: 26, name: 'Arun', role: 'CHEF', branch: 'cmswuiiun00031su3vfrn9eq5', phone: '919316925206', scope: null },
  { id: 27, name: 'Om', role: 'SALESPERSON', branch: 'cmswuiiun00031su3vfrn9eq5', phone: '919409157804', scope: null },
  { id: 28, name: 'Kapil', role: 'SALESPERSON', branch: 'cmswuiiun00031su3vfrn9eq5', phone: '917621868045', scope: null },
  { id: 29, name: 'Pavan bhai (photographer)', role: 'SALESPERSON', branch: 'cmswuiiu000021su3kv1mr41f', phone: '917285861400', scope: 'UMA_WARASHIYA_PLUS_ASSIGNED' },
  { id: 30, name: 'Baggi', role: 'DELIVERY', branch: null, phone: '919978853563', scope: 'ALL_BRANCHES' },
  { id: 31, name: 'Pritesh', role: 'DELIVERY', branch: null, phone: '918160261899', scope: 'ALL_BRANCHES' },
  { id: 32, name: 'Rishi Bhai', role: 'ADMIN', branch: null, phone: '919712632132', scope: 'GLOBAL' },
];

function normalizePhone(p) {
  if (!p) return null;
  return p.replace(/[^0-9]/g, '');
}

async function run() {
  await client.connect();
  const { rows: allUsers } = await client.query('SELECT * FROM "User"');
  let updatedCount = 0;
  let suspendedCount = 0;
  
  for (const user of allUsers) {
    const normPhone = normalizePhone(user.phone);
    
    // Find matching authoritative staff
    const authStaff = authoritativeStaff.find(s => s.phone === normPhone);
    
    if (authStaff) {
      // Sync authoritative staff
      await client.query(`
        UPDATE "User"
        SET "role" = $1, "branchId" = $2, "deliveryScope" = $3, "status" = 'ACTIVE', "deactivatedAt" = null, "suspendedAt" = null
        WHERE id = $4
      `, [authStaff.role, authStaff.branch, authStaff.scope, user.id]);
      updatedCount++;
    } else {
      // Suspend all unknown/legacy users
      if (user.status !== 'SUSPENDED') {
        await client.query(`
          UPDATE "User"
          SET "status" = 'SUSPENDED', "deactivatedAt" = NOW(), "suspendedAt" = NOW()
          WHERE id = $1
        `, [user.id]);
        suspendedCount++;
      }
    }
  }

  console.log('Updated ' + updatedCount + ' authoritative staff members.');
  console.log('Suspended ' + suspendedCount + ' legacy/unknown accounts.');
  await client.end();
}

run().catch(console.error);
