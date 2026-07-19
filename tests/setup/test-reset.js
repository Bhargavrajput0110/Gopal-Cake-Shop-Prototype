require('dotenv').config({path: '.env.test', override: true});
const { pool } = require('./prisma-test');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('Database URL:', process.env.DATABASE_URL);
  
  // Create Branch-A
  try {
    await prisma.branch.create({ data: { id: 'BRANCH-A', name: 'Test', isActive: true, code: 'A' } });
    console.log('Created BRANCH-A');
  } catch (e) {
    console.error('Failed to create BRANCH-A', e.message);
  }

  // Reset database using the exact same logic
  const connectionString = process.env.DATABASE_URL || '';
  const schemaMatch = connectionString.match(/schema=([^&]+)/);
  const schemaName = schemaMatch ? schemaMatch[1] : 'public';
  console.log('SchemaName in resetDatabase:', schemaName);

  const { rows } = await pool.query(`SELECT tablename FROM pg_tables WHERE schemaname=$1`, [schemaName]);
  const tablenames = rows;
  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"${schemaName}"."${name}"`)
    .join(', ');

  console.log('Tables to truncate:', tables);
  if (tables.length > 0) {
    await pool.query(`TRUNCATE TABLE ${tables} CASCADE;`);
    console.log('Truncated tables');
  }

  // Verify branch count
  const count = await prisma.branch.count();
  console.log('Branch count after truncate:', count);

  await prisma.$disconnect();
  await pool.end();
}

run();
