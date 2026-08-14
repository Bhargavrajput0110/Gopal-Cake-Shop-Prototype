import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDesigns() {
  const designs = await prisma.design.findMany({
    take: 20
  });
  console.log("Found designs:", designs.length);
  designs.forEach(d => {
    console.log(`- ${d.name} | ${d.imageUrl}`);
  });
}

checkDesigns().catch(console.error).finally(() => prisma.$disconnect());
