const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function seedPasswords() {
  const users = [
    { id: 'usr_admin', pin: '0000' },
    { id: 'usr_manager_khm', pin: '1111' },
    { id: 'usr_sales_khm', pin: '2222' },
    { id: 'usr_chef_khm', pin: '3333' },
    { id: 'usr_driver_khm', pin: '4444' },
    { id: 'usr_sales_uma', pin: '5555' },
    { id: 'usr_chef_uma', pin: '6666' },
    { id: 'usr_vendor_photo', pin: '7777' },
    { id: 'usr_vendor_florist', pin: '8888' },
    { id: 'usr_vendor_acrylic', pin: '9999' },
  ];
  for (const u of users) {
    const hash = await bcrypt.hash(u.pin, 10);
    await prisma.user.update({
      where: { id: u.id },
      data: { passwordHash: hash }
    }).catch(e => console.log(`Error updating ${u.id}:`, e.message));
    console.log(`Updated ${u.id}`);
  }
}
seedPasswords().finally(() => prisma.$disconnect());
