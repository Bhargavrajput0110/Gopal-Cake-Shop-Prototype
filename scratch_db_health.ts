import { prisma } from './src/lib/prisma';

async function checkDb() {
  try {
    // Total database size
    const dbSizeQuery: any = await prisma.$queryRaw`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size_pretty,
             pg_database_size(current_database()) as size_bytes;
    `;
    
    // Table sizes
    const tableSizes: any = await prisma.$queryRaw`
      SELECT relname as "Table",
             pg_size_pretty(pg_total_relation_size(relid)) as "Size",
             n_live_tup as "Rows"
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(relid) DESC
      LIMIT 10;
    `;
    
    console.dir({
      database_size: dbSizeQuery[0],
      top_tables: tableSizes
    }, { depth: null });
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
