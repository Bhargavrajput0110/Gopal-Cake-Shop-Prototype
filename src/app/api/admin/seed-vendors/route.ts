import { NextResponse } from 'next/server'; import { prisma } from '@/lib/prisma'; import bcrypt from 'bcryptjs'; export async function GET() { const hash = await bcrypt.hash('7777', 10); const hash8 = await bcrypt.hash('8888', 10); const hash9 = await bcrypt.hash('9999', 10);  await prisma.user.createMany({
    data: [
      { id: 'usr_vendor_photo', name: 'Vendor Photo', role: 'VENDOR_PHOTO', passwordHash: hash, username: 'vendor_photo' },
      { id: 'usr_vendor_florist', name: 'Vendor Florist', role: 'VENDOR_FLORIST', passwordHash: hash8, username: 'vendor_florist' },
      { id: 'usr_vendor_acrylic', name: 'Vendor Acrylic', role: 'VENDOR_ACRYLIC', passwordHash: hash9, username: 'vendor_acrylic' }
    ],
    skipDuplicates: true
  }); return NextResponse.json({ success: true, message: 'Vendors seeded' }); }
