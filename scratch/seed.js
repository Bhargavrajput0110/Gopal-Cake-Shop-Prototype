const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  await prisma.product.upsert({
    where: { id: 'mock-e2e-prod-1' },
    update: { availableForSale: true },
    create: {
      id: 'mock-e2e-prod-1',
      name: 'E2E Test Cake',
      description: 'Mock product for E2E tests',
      basePrice: 500,
      availableForSale: true
    }
  });
  console.log('Seeded E2E product successfully');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
