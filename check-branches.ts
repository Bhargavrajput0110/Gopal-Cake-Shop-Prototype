// @ts-nocheck
import { prisma } from './src/lib/prisma';
import { Branch } from '@prisma/client';
async function main() {
  const branches = await prisma.branch.findMany();
  console.log("DB Branches:", branches.map((b: Branch) => ({id: b.id, code: b.code, name: b.name})));
}
main().finally(() => process.exit(0));
