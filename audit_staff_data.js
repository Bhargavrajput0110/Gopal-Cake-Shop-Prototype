const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.llxzjblybaojugfunnxv:Rishi%409712632132@aws-1-ap-south-1.pooler.supabase.com:5432/postgres'
});

const authoritativeStaff = [
  { id: 1, name: 'Lavkush', role: 'CHEF', branch: 'UMA', phone: '917433846002', scope: 'UMA' },
  { id: 2, name: 'Prince', role: 'CHEF', branch: 'UMA', phone: '917600403838', scope: 'UMA' },
  { id: 3, name: 'Sunil', role: 'CHEF', branch: 'UMA', phone: '917275183843', scope: 'UMA' },
  { id: 4, name: 'Pardeep', role: 'CHEF', branch: 'UMA', phone: '917233988180', scope: 'UMA' },
  { id: 5, name: 'Akshay', role: 'HELPER_CHEF', branch: 'UMA', phone: '919106673904', scope: 'UMA' },
  { id: 6, name: 'Rajpal', role: 'HELPER_CHEF', branch: 'UMA', phone: '919918094482', scope: 'UMA' },
  { id: 7, name: 'Sanket', role: 'SALESPERSON', branch: 'UMA', phone: '919898616894', scope: 'UMA' },
  { id: 8, name: 'Tushar', role: 'SALESPERSON', branch: 'UMA', phone: '918758600680', scope: 'UMA' },
  { id: 9, name: 'Vansha', role: 'SALESPERSON', branch: 'UMA', phone: '919316901486', scope: 'UMA' },
  { id: 10, name: 'Deepak', role: 'SALESPERSON', branch: 'UMA', phone: '917572925443', scope: 'UMA' },
  { id: 11, name: 'Twinkle', role: 'SALESPERSON', branch: 'UMA', phone: '919712414524', scope: 'UMA' },
  { id: 12, name: 'Golu', role: 'SALESPERSON', branch: 'UMA', phone: '919925971653', scope: 'UMA' },
  { id: 13, name: 'Dipu (bodybuilder)', role: 'CHEF', branch: 'WARASHIYA', phone: '916353759436', scope: 'WARASHIYA' },
  { id: 14, name: 'Shravan (ustaad)', role: 'CHEF', branch: 'WARASHIYA', phone: '919369471741', scope: 'WARASHIYA' },
  { id: 15, name: 'Sachin', role: 'CHEF', branch: 'WARASHIYA', phone: '916352060350', scope: 'WARASHIYA' },
  { id: 16, name: 'Naresh', role: 'SALESPERSON', branch: 'WARASHIYA', phone: '917990269315', scope: 'WARASHIYA' },
  { id: 17, name: 'Haru bhai', role: 'DELIVERY', branch: 'WARASHIYA', phone: '918780860890', scope: 'WARASHIYA + EXPLICITLY_ASSIGNED' },
  { id: 18, name: 'Manoj', role: 'DELIVERY', branch: 'WARASHIYA', phone: '918238158707', scope: 'WARASHIYA + EXPLICITLY_ASSIGNED' },
  { id: 19, name: 'Pari bhai', role: 'DELIVERY', branch: 'WARASHIYA', phone: '919316678788', scope: 'WARASHIYA + EXPLICITLY_ASSIGNED' },
  { id: 20, name: 'Hitu bhai', role: 'DELIVERY', branch: 'WARASHIYA', phone: '919023890336', scope: 'WARASHIYA' },
  { id: 21, name: 'Rubel', role: 'CHEF', branch: 'MARKET', phone: '919558091559', scope: 'MARKET' },
  { id: 22, name: 'Royal', role: 'CHEF', branch: 'MARKET', phone: '918469095150', scope: 'MARKET' },
  { id: 23, name: 'Raaz', role: 'CHEF', branch: 'MARKET', phone: '919382362696', scope: 'MARKET' },
  { id: 24, name: 'Amit', role: 'SALESPERSON', branch: 'MARKET', phone: '919558013321', scope: 'MARKET' },
  { id: 25, name: 'Amla kaka', role: 'SALESPERSON', branch: 'MARKET', phone: '919726480092', scope: 'MARKET' },
  { id: 26, name: 'Arun', role: 'CHEF', branch: 'ELLORAPARK', phone: '919316925206', scope: 'ELLORAPARK' },
  { id: 27, name: 'Om', role: 'SALESPERSON', branch: 'ELLORAPARK', phone: '919409157804', scope: 'ELLORAPARK' },
  { id: 28, name: 'Kapil', role: 'SALESPERSON', branch: 'ELLORAPARK', phone: '917621868045', scope: 'ELLORAPARK' },
  { id: 29, name: 'Pavan bhai (photographer)', role: 'ALL_ROUNDER', branch: 'WARASHIYA', phone: '917285861400', scope: 'WARASHIYA + UMA' },
  { id: 30, name: 'Baggi', role: 'DELIVERY', branch: 'ALL_BRANCHES', phone: '919978853563', scope: 'ALL_BRANCHES' },
  { id: 31, name: 'Pritesh', role: 'DELIVERY', branch: 'ALL_BRANCHES', phone: '918160261899', scope: 'ALL_BRANCHES' },
  { id: 32, name: 'Rishi Bhai', role: 'ADMIN', branch: 'GLOBAL', phone: '919712632132', scope: 'GLOBAL' },
];

function normalizePhone(p) {
  if (!p) return null;
  return p.replace(/\D/g, '');
}

function resolveBranchName(branchId) {
  if (!branchId) return 'GLOBAL';
  const id = branchId.toLowerCase();
  if (id.includes('uma')) return 'UMA';
  if (id.includes('warashiya')) return 'WARASHIYA';
  if (id.includes('khanderao')) return 'KHD'; // Khanderao market
  if (id.includes('market')) return 'MARKET';
  if (id.includes('elora') || id.includes('ellora')) return 'ELLORAPARK';
  return branchId;
}

async function run() {
  await client.connect();
  const { rows } = await client.query('SELECT * FROM "User"');
  
  let markdown = "| # | Staff | DB User | Role | Branch | Phone | Scope | Result |\\n|---|---|---|---|---|---|---|---|\\n";
  let analysis = {
    exact_mismatches: [],
    corrections_needed: [],
    creations_needed: [],
    deletions_needed: [],
    duplicates: [],
    branch_conflicts: [],
    scope_conflicts: []
  };

  const dbUsers = rows.map(u => {
    // try finding scope from delivery configuration in DB if it exists, otherwise just default
    // we'll rely on the manual check for now
    let scope = u.deliveryScope || u.branchId || 'GLOBAL'; 
    if (u.role === 'DELIVERY' && !u.deliveryScope) scope = 'Needs Setup';
    return {
      ...u,
      normalizedPhone: normalizePhone(u.phone),
      mappedBranch: resolveBranchName(u.branchId)
    };
  });

  // Track matched DB users to find unexpected ones
  const matchedDbIds = new Set();
  const phoneToDbUser = {};
  
  dbUsers.forEach(u => {
    if (u.normalizedPhone) {
      if (phoneToDbUser[u.normalizedPhone]) {
        phoneToDbUser[u.normalizedPhone].push(u);
      } else {
        phoneToDbUser[u.normalizedPhone] = [u];
      }
    }
  });

  for (const staff of authoritativeStaff) {
    const dbMatches = phoneToDbUser[staff.phone];
    
    if (!dbMatches || dbMatches.length === 0) {
      markdown += "| " + staff.id + " | " + staff.name + " | None | " + staff.role + " | " + staff.branch + " | " + staff.phone + " | " + staff.scope + " | MISSING |\n";
      analysis.creations_needed.push(staff);
      continue;
    }

    if (dbMatches.length > 1) {
      markdown += "| " + staff.id + " | " + staff.name + " | Multiple | " + staff.role + " | " + staff.branch + " | " + staff.phone + " | " + staff.scope + " | DUPLICATE |\n";
      analysis.duplicates.push({ staff, matches: dbMatches });
      dbMatches.forEach(m => matchedDbIds.add(m.id));
      continue;
    }

    const dbUser = dbMatches[0];
    matchedDbIds.add(dbUser.id);
    
    let result = 'MATCH';
    let mismatches = [];
    
    if (dbUser.role !== staff.role) {
      result = 'ROLE_MISMATCH';
      mismatches.push("Role (" + dbUser.role + " != " + staff.role + ")");
    }
    
    if (dbUser.mappedBranch !== staff.branch && staff.branch !== 'ALL_BRANCHES' && staff.branch !== 'GLOBAL') {
      result = result === 'MATCH' ? 'BRANCH_MISMATCH' : 'MULTIPLE_MISMATCHES';
      mismatches.push("Branch (" + dbUser.mappedBranch + " != " + staff.branch + ")");
      analysis.branch_conflicts.push({ staff, dbUser });
    }
    
    if (result !== 'MATCH') {
       analysis.corrections_needed.push({ staff, dbUser, mismatches });
    }

    markdown += "| " + staff.id + " | " + staff.name + " | " + dbUser.name + " (" + dbUser.id + ") | " + dbUser.role + " -> " + staff.role + " | " + dbUser.mappedBranch + " -> " + staff.branch + " | " + staff.phone + " | " + staff.scope + " | " + result + " |\n";
  }

  // Find unexpected staff members
  for (const u of dbUsers) {
    if (!matchedDbIds.has(u.id)) {
      markdown += "| - | Unknown | " + u.name + " (" + u.id + ") | " + u.role + " | " + u.mappedBranch + " | " + u.phone + " | - | UNEXPECTED |\n";
      analysis.deletions_needed.push(u);
    }
  }

  const fs = require('fs');
  fs.writeFileSync('audit_results.json', JSON.stringify({ markdown, analysis }, null, 2));
  
  await client.end();
}

run();
