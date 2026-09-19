import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- LINKING UNASSIGNED VENDOR TASKS TO REAL VENDORS ---');
  
  const vikas = await prisma.user.findFirst({ where: { role: 'VENDOR_FLORIST' } });
  const amit = await prisma.user.findFirst({ where: { role: 'VENDOR_PHOTO' } });
  const samir = await prisma.user.findFirst({ where: { role: 'VENDOR_ACRYLIC' } });

  console.log('Florist (Vikas Bhai):', vikas?.name, vikas?.id);
  console.log('Photo (Amit):', amit?.name, amit?.id);
  console.log('Acrylic (Samir):', samir?.name, samir?.id);

  if (vikas) {
    const res = await prisma.vendorTask.updateMany({
      where: { vendorType: 'flower', vendorId: null },
      data: { vendorId: vikas.id }
    });
    console.log(`Updated ${res.count} flower tasks -> Vikas Bhai`);
  }

  if (amit) {
    const res = await prisma.vendorTask.updateMany({
      where: { vendorType: 'photo', vendorId: null },
      data: { vendorId: amit.id }
    });
    console.log(`Updated ${res.count} photo tasks -> Amit`);
  }

  if (samir) {
    const res = await prisma.vendorTask.updateMany({
      where: { vendorType: 'acrylic', vendorId: null },
      data: { vendorId: samir.id }
    });
    console.log(`Updated ${res.count} acrylic tasks -> Samir`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
