import { describe, it, expect } from 'vitest';
import { prisma } from '@/lib/prisma';
import { prismaTest } from './prisma-test';

describe('Search Path Check', () => {
  it('checks search path', async () => {
    const result = await prisma.$queryRawUnsafe('SHOW search_path');
    console.log('SEARCH PATH (prisma):', result);
    
    const countPublic = await prisma.$queryRawUnsafe('SELECT count(*) FROM "public"."Branch"');
    const countTest = await prisma.$queryRawUnsafe('SELECT count(*) FROM "postgres_test"."Branch"');
    console.log('COUNT PUBLIC Branch:', countPublic);
    console.log('COUNT POSTGRES_TEST Branch:', countTest);
  });
});
