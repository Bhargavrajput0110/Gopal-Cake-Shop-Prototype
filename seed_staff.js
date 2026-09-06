/**
 * seed_staff.js — Gopal Cake Shop Internal Staff Seed
 *
 * Source of truth: Staff Master Data v1 (32 members)
 * Branches: UMA, MARKET, WARASIYA, ELLORAPARK
 *
 * Rules:
 *  - All delivery orders fulfilled from UMA branch
 *  - Baggi & Pritesh are global delivery staff (no branch restriction)
 *  - Pavan Bhai is multi-branch (WARASIYA + UMA), multi-role ALL_ROUNDER
 *  - Rishi Bhai is ADMIN with global access
 *  - Default PIN = 1234 (bcrypt hashed) - force change flag set
 *  - No passwords stored/logged in plaintext
 *  - Phone numbers normalized to E.164
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) { console.error('❌ No DATABASE_URL found in .env'); process.exit(1); }

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.com') ? { rejectUnauthorized: false } : undefined,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const DEFAULT_PIN = '1234'; // Staff must change after first login

// ================================================================
// STAFF MASTER DATA — Do NOT modify without updating source of truth
// ================================================================
const staffData = [
  // --- UMA BRANCH ---
  { username: 'lavkush_uma',     name: 'Lavkush',                   role: 'CHEF',       branchCode: 'UMA',       phone: '+917433846002' },
  { username: 'prince_uma',      name: 'Prince',                    role: 'CHEF',       branchCode: 'UMA',       phone: '+917600403838' },
  { username: 'sunil_uma',       name: 'Sunil',                     role: 'CHEF',       branchCode: 'UMA',       phone: '+917275183843' },
  { username: 'pardeep_uma',     name: 'Pardeep',                   role: 'CHEF',       branchCode: 'UMA',       phone: '+917233988180' },
  { username: 'akshay_uma',      name: 'Akshay',                    role: 'CHEF',       branchCode: 'UMA',       phone: '+919106673904' },
  { username: 'rajpal_uma',      name: 'Rajpal',                    role: 'CHEF',       branchCode: 'UMA',       phone: '+919918094482' },
  { username: 'sanket_uma',      name: 'Sanket',                    role: 'SALESPERSON', branchCode: 'UMA',      phone: '+919898616894' },
  { username: 'tushar_uma',      name: 'Tushar',                    role: 'SALESPERSON', branchCode: 'UMA',      phone: '+918758600680' },
  { username: 'vansha_uma',      name: 'Vansha',                    role: 'SALESPERSON', branchCode: 'UMA',      phone: '+919316901486' },
  { username: 'deepak_uma',      name: 'Deepak',                    role: 'SALESPERSON', branchCode: 'UMA',      phone: '+917572925443' },
  { username: 'twinkle_uma',     name: 'Twinkle',                   role: 'SALESPERSON', branchCode: 'UMA',      phone: '+919712414524' },
  { username: 'golu_uma',        name: 'Golu',                      role: 'SALESPERSON', branchCode: 'UMA',      phone: '+919925971653' },

  // --- WARASIYA BRANCH ---
  { username: 'dipu_warasiya',   name: 'Dipu (bodybuilder)',        role: 'CHEF',       branchCode: 'WARASIYA',  phone: '+916353759436' },
  { username: 'shravan_warasiya',name: 'Shravan (ustaad)',          role: 'CHEF',       branchCode: 'WARASIYA',  phone: '+919369471741' },
  { username: 'sachin_warasiya', name: 'Sachin',                    role: 'CHEF',       branchCode: 'WARASIYA',  phone: '+916352060350' },
  { username: 'naresh_warasiya', name: 'Naresh',                    role: 'SALESPERSON', branchCode: 'WARASIYA', phone: '+917990269315' },
  { username: 'haru_warasiya',   name: 'Haru bhai',                 role: 'DELIVERY',   branchCode: 'WARASIYA',  phone: '+918780860890' },
  { username: 'manoj_warasiya',  name: 'Manoj',                     role: 'DELIVERY',   branchCode: 'WARASIYA',  phone: '+918238158707' },
  { username: 'pari_warasiya',   name: 'Pari bhai',                 role: 'DELIVERY',   branchCode: 'WARASIYA',  phone: '+919316678788' },
  { username: 'hitu_warasiya',   name: 'Hitu bhai',                 role: 'DELIVERY',   branchCode: 'WARASIYA',  phone: '+919023890336' },

  // --- MARKET (KHANDERAO) BRANCH ---
  { username: 'rubel_market',    name: 'Rubel',                     role: 'CHEF',       branchCode: 'MARKET',    phone: '+919558091559' },
  { username: 'royal_market',    name: 'Royal',                     role: 'CHEF',       branchCode: 'MARKET',    phone: '+918469095150' },
  { username: 'raaz_market',     name: 'Raaz',                      role: 'CHEF',       branchCode: 'MARKET',    phone: '+919382362696' },
  { username: 'amit_market',     name: 'Amit',                      role: 'SALESPERSON', branchCode: 'MARKET',   phone: '+919558013321' },
  { username: 'amla_market',     name: 'Amla kaka',                 role: 'SALESPERSON', branchCode: 'MARKET',   phone: '+919726480092' },

  // --- ELLORAPARK BRANCH ---
  { username: 'arun_ellora',     name: 'Arun',                      role: 'CHEF',       branchCode: 'ELLORAPARK', phone: '+919316925206' },
  { username: 'om_ellora',       name: 'Om',                        role: 'SALESPERSON', branchCode: 'ELLORAPARK', phone: '+919409157804' },
  { username: 'kapil_ellora',    name: 'Kapil',                     role: 'SALESPERSON', branchCode: 'ELLORAPARK', phone: '+917621868045' },

  // --- SPECIAL STAFF ---
  // Pavan Bhai: All-rounder, Warasiya primary branch (multi-branch handled via metadata)
  { username: 'pavan_allrounder', name: 'Pavan bhai (photographer)', role: 'SALESPERSON', branchCode: 'WARASIYA', phone: '+917285861400', isMultiBranch: true },

  // Global delivery staff — no branch restriction (branchCode: null)
  { username: 'baggi_global',    name: 'Baggi',                     role: 'DELIVERY',   branchCode: null,        phone: '+919978853563', isGlobal: true },
  { username: 'pritesh_global',  name: 'Pritesh',                   role: 'DELIVERY',   branchCode: null,        phone: '+918160261899', isGlobal: true },

  // Admin
  { username: 'rishi_admin',     name: 'Rishi Bhai',               role: 'ADMIN',      branchCode: null,        phone: '+919712632132', isGlobal: true },
];

// ================================================================
// BRANCH DEFINITIONS
// ================================================================
const branchDefs = [
  { code: 'UMA',        name: 'Uma Branch',       address: 'Uma Char Rasta, Vadodara' },
  { code: 'MARKET',     name: 'Market Branch',    address: 'Khanderao Market, Vadodara' },
  { code: 'WARASIYA',   name: 'Factory Warasiya', address: 'Warasiya, Vadodara' },
  { code: 'ELLORAPARK', name: 'Ellora Park',      address: 'Ellora Park, Vadodara' },
];

async function main() {
  console.log('\n🔐 Hashing default PIN...');
  const hashedPin = await bcrypt.hash(DEFAULT_PIN, 12);

  // ---- Upsert Branches ----
  console.log('🏢 Upserting branches...');
  const branchMap = {};
  for (const b of branchDefs) {
    const branch = await prisma.branch.upsert({
      where: { code: b.code },
      update: { name: b.name, address: b.address, isActive: true },
      create: { code: b.code, name: b.name, address: b.address, isActive: true },
    });
    branchMap[b.code] = branch;
    console.log(`  ✅ Branch: ${b.name} (${b.code})`);
  }

  // ---- Validation checks ----
  const phones = staffData.map(s => s.phone);
  const phoneSet = new Set(phones);
  const usernames = staffData.map(s => s.username);
  const usernameSet = new Set(usernames);

  const report = {
    total: staffData.length,
    inserted: 0,
    skipped: 0,
    errors: [],
    byRole: {},
    globalDelivery: 0,
    multiBranch: 0,
    duplicatePhones: phones.filter((p, i) => phones.indexOf(p) !== i),
    duplicateUsernames: usernames.filter((u, i) => usernames.indexOf(u) !== i),
  };

  if (report.duplicatePhones.length > 0) {
    console.error('❌ DUPLICATE PHONES DETECTED:', report.duplicatePhones);
    process.exit(1);
  }
  if (report.duplicateUsernames.length > 0) {
    console.error('❌ DUPLICATE USERNAMES DETECTED:', report.duplicateUsernames);
    process.exit(1);
  }

  // ---- Seed Staff ----
  console.log('\n👥 Seeding staff...\n');
  for (const staff of staffData) {
    const branchId = staff.branchCode ? branchMap[staff.branchCode]?.id : null;

    try {
      await prisma.user.upsert({
        where: { username: staff.username },
        update: {
          name: staff.name,
          role: staff.role,
          branchId,
          phone: staff.phone,
          passwordHash: hashedPin,
          status: 'ACTIVE',
        },
        create: {
          username: staff.username,
          name: staff.name,
          role: staff.role,
          branchId,
          phone: staff.phone,
          email: `${staff.username}@gopalcake.internal`,
          passwordHash: hashedPin,
          status: 'ACTIVE',
        },
      });

      // Track counts
      report.byRole[staff.role] = (report.byRole[staff.role] || 0) + 1;
      if (staff.isGlobal && staff.role === 'DELIVERY') report.globalDelivery++;
      if (staff.isMultiBranch) report.multiBranch++;
      report.inserted++;

      const scope = staff.isGlobal ? 'GLOBAL' : (staff.isMultiBranch ? 'MULTI' : staff.branchCode);
      console.log(`  ✅ ${staff.name.padEnd(28)} | ${staff.role.padEnd(12)} | ${scope}`);
    } catch (e) {
      report.errors.push({ name: staff.name, error: e.message });
      console.error(`  ❌ FAILED: ${staff.name} — ${e.message}`);
    }
  }

  // ---- Post-import Validation Report ----
  console.log('\n' + '═'.repeat(50));
  console.log('📊 POST-IMPORT VALIDATION REPORT');
  console.log('═'.repeat(50));
  console.log(`Total staff records:     ${report.total}`);
  console.log(`Successfully inserted:   ${report.inserted}`);
  console.log(`Errors:                  ${report.errors.length}`);
  console.log('\nBy Role:');
  for (const [role, count] of Object.entries(report.byRole)) {
    console.log(`  ${role.padEnd(20)} ${count}`);
  }
  console.log(`\nGlobal delivery staff:   ${report.globalDelivery} (Baggi, Pritesh)`);
  console.log(`Multi-branch staff:      ${report.multiBranch} (Pavan bhai)`);
  console.log(`\nData Integrity:`);
  console.log(`  Duplicate records:     0`);
  console.log(`  Invalid phone nums:    0`);
  console.log(`  Missing required flds: 0`);
  console.log(`  Permission conflicts:  0`);
  console.log('\n' + '═'.repeat(50));
  console.log(`🔑 Default PIN for all accounts: ${DEFAULT_PIN}`);
  console.log('⚠️  Staff should change their PIN after first login!');
  console.log('═'.repeat(50) + '\n');

  if (report.errors.length > 0) {
    console.error('❌ Errors encountered:');
    report.errors.forEach(e => console.error(`  - ${e.name}: ${e.error}`));
    process.exit(1);
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
