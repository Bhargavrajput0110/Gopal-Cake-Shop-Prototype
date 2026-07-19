import { prismaTest } from './prisma-test';

export async function checkSearchPath() {
  const result = await prismaTest.$queryRawUnsafe('SHOW search_path');
  console.log('SEARCH PATH:', result);
  
  const countPublic = await prismaTest.$queryRawUnsafe('SELECT count(*) FROM "public"."Branch"');
  const countTest = await prismaTest.$queryRawUnsafe('SELECT count(*) FROM "postgres_test"."Branch"');
  console.log('COUNT PUBLIC Branch:', countPublic);
  console.log('COUNT POSTGRES_TEST Branch:', countTest);
}

checkSearchPath().catch(console.error).finally(() => process.exit(0));
