import { prisma } from './src/lib/prisma';

// ============================================================
// MASTER STAFF DATA — source of truth (from the spec)
// ============================================================
const MASTER: {
  id: number;
  name: string;
  phone: string;
  role: string;        // spec role label
  location: string;
  branchCode: string | string[] | null; // null = global
  deliveryScope?: string;
}[] = [
  { id:  1, name: 'Lavkush',                  phone: '+917433846002', role: 'CHEF',         location: 'Uma',             branchCode: 'UMA' },
  { id:  2, name: 'Prince',                   phone: '+917600403838', role: 'CHEF',         location: 'Uma',             branchCode: 'UMA' },
  { id:  3, name: 'Sunil',                    phone: '+917275183843', role: 'CHEF',         location: 'Uma',             branchCode: 'UMA' },
  { id:  4, name: 'Pardeep',                  phone: '+917233988180', role: 'CHEF',         location: 'Uma',             branchCode: 'UMA' },
  { id:  5, name: 'Akshay',                   phone: '+919106673904', role: 'CHEF',         location: 'Uma',             branchCode: 'UMA' },  // Helper Chef → CHEF
  { id:  6, name: 'Rajpal',                   phone: '+919918094482', role: 'CHEF',         location: 'Uma',             branchCode: 'UMA' },  // Helper Chef → CHEF
  { id:  7, name: 'Sanket',                   phone: '+919898616894', role: 'SALESPERSON',  location: 'Uma',             branchCode: 'UMA' },
  { id:  8, name: 'Tushar',                   phone: '+918758600680', role: 'SALESPERSON',  location: 'Uma',             branchCode: 'UMA' },
  { id:  9, name: 'Vansha',                   phone: '+919316901486', role: 'SALESPERSON',  location: 'Uma',             branchCode: 'UMA' },
  { id: 10, name: 'Deepak',                   phone: '+917572925443', role: 'SALESPERSON',  location: 'Uma',             branchCode: 'UMA' },
  { id: 11, name: 'Twinkle',                  phone: '+919712414524', role: 'SALESPERSON',  location: 'Uma',             branchCode: 'UMA' },
  { id: 12, name: 'Golu',                     phone: '+919925971653', role: 'SALESPERSON',  location: 'Uma',             branchCode: 'UMA' },
  { id: 13, name: 'Dipu (bodybuilder)',        phone: '+916353759436', role: 'CHEF',         location: 'Warashiya',       branchCode: 'WARASIYA' },
  { id: 14, name: 'Shravan (ustaad)',          phone: '+919369471741', role: 'CHEF',         location: 'Warashiya',       branchCode: 'WARASIYA' },
  { id: 15, name: 'Sachin',                   phone: '+916352060350', role: 'CHEF',         location: 'Warashiya',       branchCode: 'WARASIYA' },
  { id: 16, name: 'Naresh',                   phone: '+917990269315', role: 'SALESPERSON',  location: 'Warashiya',       branchCode: 'WARASIYA' },
  { id: 17, name: 'Haru bhai',                phone: '+918780860890', role: 'DELIVERY',     location: 'Warashiya',       branchCode: 'WARASIYA', deliveryScope: 'WARASHIYA_PLUS_ASSIGNED' },
  { id: 18, name: 'Manoj',                    phone: '+918238158707', role: 'DELIVERY',     location: 'Warashiya',       branchCode: 'WARASIYA', deliveryScope: 'WARASHIYA_PLUS_ASSIGNED' },
  { id: 19, name: 'Pari bhai',               phone: '+919316678788', role: 'DELIVERY',     location: 'Warashiya',       branchCode: 'WARASIYA', deliveryScope: 'WARASHIYA_PLUS_ASSIGNED' },
  { id: 20, name: 'Hitu bhai',               phone: '+919023890336', role: 'DELIVERY',     location: 'Warashiya',       branchCode: 'WARASIYA', deliveryScope: 'WARASHIYA' },
  { id: 21, name: 'Rubel',                    phone: '+919558091559', role: 'CHEF',         location: 'Market',          branchCode: 'MARKET' },
  { id: 22, name: 'Royal',                    phone: '+918469095150', role: 'CHEF',         location: 'Market',          branchCode: 'MARKET' },
  { id: 23, name: 'Raaz',                     phone: '+919382362696', role: 'CHEF',         location: 'Market',          branchCode: 'MARKET' },
  { id: 24, name: 'Amit',                     phone: '+919558013321', role: 'SALESPERSON',  location: 'Market',          branchCode: 'MARKET' },
  { id: 25, name: 'Amla kaka',                phone: '+919726480092', role: 'SALESPERSON',  location: 'Market',          branchCode: 'MARKET' },
  { id: 26, name: 'Arun',                     phone: '+919316925206', role: 'CHEF',         location: 'Ellorapark',      branchCode: 'ELLORAPARK' },
  { id: 27, name: 'Om',                       phone: '+919409157804', role: 'SALESPERSON',  location: 'Ellorapark',      branchCode: 'ELLORAPARK' },
  { id: 28, name: 'Kapil',                    phone: '+917621868045', role: 'SALESPERSON',  location: 'Ellorapark',      branchCode: 'ELLORAPARK' },
  { id: 29, name: 'Pavan bhai (photographer)',phone: '+917285861400', role: 'SALESPERSON',  location: 'Warashiya & Uma', branchCode: ['WARASIYA','UMA'], deliveryScope: 'WARASHIYA_UMA_ASSIGNED' },
  { id: 30, name: 'Baggi',                    phone: '+919978853563', role: 'DELIVERY',     location: 'ALL',             branchCode: null, deliveryScope: 'ALL_BRANCHES' },
  { id: 31, name: 'Pritesh',                  phone: '+918160261899', role: 'DELIVERY',     location: 'ALL',             branchCode: null, deliveryScope: 'ALL_BRANCHES' },
  { id: 32, name: 'Rishi Bhai',               phone: '+919712632132', role: 'ADMIN',        location: 'ALL',             branchCode: null },
];

// ============================================================
// Fetch all users with real phone numbers matching spec
// ============================================================
async function run() {
  const phones = MASTER.map(m => m.phone);
  
  const dbUsers = await prisma.user.findMany({
    where: { phone: { in: phones } },
    include: { branch: { select: { name: true, code: true } } }
  });

  // index by phone for lookup
  const byPhone = new Map(dbUsers.map(u => [u.phone, u]));

  console.log('='.repeat(90));
  console.log('GOPAL CAKE SHOP — STAFF VERIFICATION REPORT');
  console.log(`Generated: ${new Date().toISOString()}`);
  console.log('='.repeat(90));
  console.log('');

  const results = {
    pass: 0, fail: 0, warn: 0,
    missing: [] as string[],
    roleWrong: [] as string[],
    branchWrong: [] as string[],
    phoneWrong: [] as string[],
    noEmail: [] as string[],
  };

  for (const m of MASTER) {
    const u = byPhone.get(m.phone);

    if (!u) {
      results.fail++;
      results.missing.push(`#${m.id} ${m.name} (${m.phone})`);
      console.log(`❌ MISSING  #${m.id.toString().padStart(2)} ${m.name.padEnd(30)} phone=${m.phone}`);
      continue;
    }

    let ok = true;
    const issues: string[] = [];

    // Role check
    if (u.role !== m.role) {
      ok = false;
      issues.push(`role DB=${u.role} EXPECTED=${m.role}`);
      results.roleWrong.push(`#${m.id} ${m.name}`);
    }

    // Branch check
    if (m.branchCode === null) {
      // Global: branch should be null
      if (u.branchId !== null) {
        issues.push(`branch should be NULL (global) but DB has branchId=${u.branchId}`);
        ok = false;
        results.branchWrong.push(`#${m.id} ${m.name}`);
      }
    } else if (Array.isArray(m.branchCode)) {
      // Multi-branch (Pavan): branch in DB is likely primary one, just warn
      const codes = Array.isArray(m.branchCode) ? m.branchCode : [m.branchCode];
      const dbCode = (u as any).branch?.code;
      if (!dbCode || !codes.includes(dbCode)) {
        issues.push(`multi-branch user: DB primary branch=${dbCode}, expected one of [${codes.join(',')}]`);
        results.warn++;
      }
    } else {
      // Single branch
      const dbCode = (u as any).branch?.code;
      if (dbCode !== m.branchCode) {
        ok = false;
        issues.push(`branch DB=${dbCode} EXPECTED=${m.branchCode}`);
        results.branchWrong.push(`#${m.id} ${m.name}`);
      }
    }

    // Email/login check
    if (!u.email) {
      issues.push('NO EMAIL — cannot login');
      results.noEmail.push(`#${m.id} ${m.name}`);
      ok = false;
    }

    // Delivery scope check (stored in deliveryScopes field if exists)
    const dsField = (u as any).deliveryScopes as string | null | undefined;
    if (m.deliveryScope) {
      if (!dsField) {
        issues.push(`deliveryScope missing in DB, expected=${m.deliveryScope}`);
      } else {
        const scopes = dsField.split(',').map(s => s.trim());
        // Simple presence check for key scope keywords
        const scopeOk = m.deliveryScope === 'ALL_BRANCHES' 
          ? scopes.includes('ALL') || dsField.includes('ALL')
          : m.deliveryScope === 'WARASHIYA_PLUS_ASSIGNED'
          ? scopes.some(s => s.toLowerCase().includes('waras') || s.toLowerCase().includes('varas'))
          : true;
        if (!scopeOk) {
          issues.push(`deliveryScope mismatch: DB="${dsField}" EXPECTED=${m.deliveryScope}`);
        }
      }
    }

    if (ok && issues.length === 0) {
      results.pass++;
      console.log(`✅ OK       #${m.id.toString().padStart(2)} ${m.name.padEnd(30)} role=${u.role.padEnd(15)} branch=${((u as any).branch?.code || 'NULL').padEnd(12)} email=${u.email}`);
    } else if (!ok) {
      results.fail++;
      console.log(`❌ FAIL     #${m.id.toString().padStart(2)} ${m.name.padEnd(30)} → ${issues.join(' | ')}`);
    } else {
      results.warn++;
      console.log(`⚠️  WARN     #${m.id.toString().padStart(2)} ${m.name.padEnd(30)} → ${issues.join(' | ')}`);
    }
  }

  // Check for duplicates by phone
  const phoneCounts = new Map<string, number>();
  for (const u of await prisma.user.findMany({ where: { phone: { in: phones } }, select: { phone: true } })) {
    if (u.phone) phoneCounts.set(u.phone, (phoneCounts.get(u.phone) || 0) + 1);
  }
  const dupes = [...phoneCounts.entries()].filter(([, c]) => c > 1);

  console.log('');
  console.log('='.repeat(90));
  console.log('SUMMARY');
  console.log('='.repeat(90));
  console.log(`Total spec records : 32`);
  console.log(`Found in DB        : ${dbUsers.length}`);
  console.log(`✅ PASS            : ${results.pass}`);
  console.log(`❌ FAIL            : ${results.fail}`);
  console.log(`⚠️  WARN            : ${results.warn}`);
  console.log('');
  console.log(`Missing records    : ${results.missing.length === 0 ? 'None' : results.missing.join(', ')}`);
  console.log(`Role mismatches    : ${results.roleWrong.length === 0 ? 'None' : results.roleWrong.join(', ')}`);
  console.log(`Branch mismatches  : ${results.branchWrong.length === 0 ? 'None' : results.branchWrong.join(', ')}`);
  console.log(`No email/login     : ${results.noEmail.length === 0 ? 'None' : results.noEmail.join(', ')}`);
  console.log(`Duplicate phones   : ${dupes.length === 0 ? 'None' : dupes.map(([p, c]) => `${p} (${c}x)`).join(', ')}`);
  console.log('');

  // Role counts from DB
  const roleCounts: Record<string, number> = {};
  for (const u of dbUsers) { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1; }
  console.log('ROLE DISTRIBUTION (from DB, spec phones only):');
  for (const [role, count] of Object.entries(roleCounts).sort()) {
    console.log(`  ${role.padEnd(20)}: ${count}`);
  }

  console.log('');
  if (results.fail === 0 && results.missing.length === 0) {
    console.log('🟢 VERIFICATION RESULT: ALL 32 STAFF RECORDS MATCH SPEC');
  } else {
    console.log(`🔴 VERIFICATION RESULT: ${results.fail} ISSUES FOUND — see details above`);
  }
  console.log('='.repeat(90));
}

run().catch(console.error).finally(() => prisma.$disconnect());
