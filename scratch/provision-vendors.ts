import { prisma } from '../src/lib/prisma';
import bcrypt from 'bcryptjs';

async function hashPin(pin: string) {
  return await bcrypt.hash(pin, 10);
}

async function run() {
  const samirHash = await hashPin('4670');
  const vikasHash = await hashPin('1977');
  const amitHash = await hashPin('3321');
  const zeroHash = await hashPin('0000');

  // Samir
  await prisma.user.upsert({
    where: { phone: '6352554670' },
    update: { passwordHash: samirHash, role: 'VENDOR_ACRYLIC' },
    create: {
      name: 'Samir',
      phone: '6352554670',
      passwordHash: samirHash,
      role: 'VENDOR_ACRYLIC'
    }
  });

  // Vikas Bhai
  await prisma.user.upsert({
    where: { phone: '9558951977' },
    update: { passwordHash: vikasHash, role: 'VENDOR_FLORIST' },
    create: {
      name: 'Vikas Bhai',
      phone: '9558951977',
      passwordHash: vikasHash,
      role: 'VENDOR_FLORIST'
    }
  });

  // Amit Hemrajani
  await prisma.user.upsert({
    where: { phone: '9558013321' },
    update: { passwordHash: amitHash, role: 'VENDOR_PHOTO' },
    create: {
      name: 'Amit Hemrajani',
      phone: '9558013321',
      passwordHash: amitHash,
      role: 'VENDOR_PHOTO'
    }
  });

  // Ensure Rishi Bhai (Admin) has a known PIN (0000)
  await prisma.user.updateMany({
    where: { name: 'Rishi Bhai' },
    data: { passwordHash: zeroHash }
  });

  // Ensure Baggi (Driver) has a known PIN (0000)
  await prisma.user.updateMany({
    where: { name: 'Baggi' },
    data: { passwordHash: zeroHash }
  });

  console.log('Successfully provisioned real vendors and reset PINs for Rishi Bhai and Baggi.');
}

run();
