import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

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

  await prisma.branch.upsert({
    where: { id: 'b-001' },
    update: { isActive: true },
    create: {
      id: 'b-001',
      name: 'Khanderao Market',
      code: 'B001',
      isActive: true,
      address: '123 Main St',
      phone: '1234567890'
    }
  });

  await prisma.user.upsert({
    where: { id: 'usr_mock_loadtest' },
    update: { role: 'ADMIN' },
    create: {
      id: 'usr_mock_loadtest',
      email: 'loadtest@example.com',
      phone: '1234567890',
      name: 'Load Test',
      passwordHash: 'dummy_hash',
      role: 'ADMIN'
    }
  });

  console.log('Seeded E2E product, branch, and mock user successfully');
}

seed().catch(console.error).finally(() => prisma.$disconnect());
