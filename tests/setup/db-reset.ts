import { prismaTest } from './prisma-test'

/**
 * Truncates all application tables in the test database.
 * This should be called in a `beforeEach` block for integration tests to guarantee clean state.
 */
export async function resetDatabase() {
  const connectionString = process.env.DATABASE_URL || '';
  const schemaMatch = connectionString.match(/schema=([^&]+)/);
  const schemaName = schemaMatch ? schemaMatch[1] : 'public';

  const tablenames: Array<{ tablename: string }> = await prismaTest.$queryRawUnsafe(`SELECT tablename FROM pg_tables WHERE schemaname='${schemaName}'`);
  console.log('TABLES FOUND FOR SCHEMA:', schemaName, tablenames);

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"${schemaName}"."${name}"`)
    .join(', ')

  if (tables.length > 0) {
    try {
      await prismaTest.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`)
    } catch (error) {
      console.error('Error truncating tables:', error)
      throw error
    }
  }
}
