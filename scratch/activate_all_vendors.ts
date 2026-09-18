import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- ACTIVATING VENDOR PARTNERS ---');

  // 1. Samir (VENDOR_ACRYLIC)
  const samir = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: 'Samir', mode: 'insensitive' } },
        { role: 'VENDOR_ACRYLIC' }
      ]
    }
  });

  if (samir) {
    const updatedSamir = await prisma.user.update({
      where: { id: samir.id },
      data: { status: 'ACTIVE', activatedAt: new Date() }
    });
    console.log('✅ Samir (VENDOR_ACRYLIC) activated:', updatedSamir.name, updatedSamir.id, updatedSamir.status);
  } else {
    console.log('❌ Samir not found');
  }

  // 2. Amit Hemrajani (VENDOR_PHOTO)
  const amit = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: 'Amit', mode: 'insensitive' } },
        { role: 'VENDOR_PHOTO' }
      ]
    }
  });

  if (amit) {
    const updatedAmit = await prisma.user.update({
      where: { id: amit.id },
      data: { status: 'ACTIVE', activatedAt: new Date() }
    });
    console.log('✅ Amit Hemrajani (VENDOR_PHOTO) activated:', updatedAmit.name, updatedAmit.id, updatedAmit.status);
  } else {
    console.log('❌ Amit Hemrajani not found');
  }

  // 3. Vikas Bhai (VENDOR_FLORIST)
  const vikas = await prisma.user.findFirst({
    where: {
      OR: [
        { name: { contains: 'Vikas', mode: 'insensitive' } },
        { role: 'VENDOR_FLORIST' }
      ]
    }
  });

  if (vikas) {
    const updatedVikas = await prisma.user.update({
      where: { id: vikas.id },
      data: { status: 'ACTIVE', activatedAt: new Date() }
    });
    console.log('✅ Vikas Bhai (VENDOR_FLORIST) active check:', updatedVikas.name, updatedVikas.id, updatedVikas.status);
  }

  console.log('\n--- ALL VENDOR USERS STATUS ---');
  const vendors = await prisma.user.findMany({
    where: { role: { in: ['VENDOR_FLORIST', 'VENDOR_PHOTO', 'VENDOR_ACRYLIC'] } },
    select: { id: true, name: true, role: true, status: true }
  });
  console.log(JSON.stringify(vendors, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
