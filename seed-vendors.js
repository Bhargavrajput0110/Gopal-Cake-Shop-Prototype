const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.createMany({
    data: [
      { id: 'usr_vendor_photo', name: 'Vendor Photo', role: 'VENDOR_PHOTO', passwordHash: 'hashed_pin_7777' },
      { id: 'usr_vendor_florist', name: 'Vendor Florist', role: 'VENDOR_FLORIST', passwordHash: 'hashed_pin_8888' },
      { id: 'usr_vendor_acrylic', name: 'Vendor Acrylic', role: 'VENDOR_ACRYLIC', passwordHash: 'hashed_pin_9999' }
    ],
    skipDuplicates: true
  });
  console.log('Vendors added');
}
main().catch(console.error).finally(() => prisma.$disconnect());
