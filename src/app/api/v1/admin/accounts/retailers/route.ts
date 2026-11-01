import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export const GET = withApiHandler(async (ctx) => {
  const { appRole, req } = ctx;
  if (appRole && appRole !== 'ADMIN' && appRole !== 'MANAGER' && appRole !== 'SALESPERSON') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const search = req.nextUrl.searchParams.get('q')?.trim() || '';
  const partyType = req.nextUrl.searchParams.get('partyType')?.trim() || '';

  const whereClause: Prisma.RetailerWhereInput = {
    ...(partyType && partyType !== 'all' ? { partyType } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { shopName: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
            { city: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const retailers = await prisma.retailer.findMany({
    where: whereClause,
    include: {
      _count: {
        select: { ledgerEntries: true },
      },
      ledgerEntries: {
        orderBy: { date: 'desc' },
        take: 1,
        select: { date: true, type: true, amount: true },
      },
    },
    orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
  });

  const formatted = retailers.map((r) => ({
    id: r.id,
    name: r.name,
    shopName: r.shopName || '',
    phone: r.phone || '',
    email: r.email || '',
    address: r.address || '',
    city: r.city || 'Surat',
    partyType: r.partyType || 'VENDOR',
    category: r.category || (r.partyType === 'VENDOR' ? 'Raw Ingredients' : 'Retail Store'),
    openingBalance: Number(r.openingBalance),
    currentBalance: Number(r.currentBalance),
    creditLimit: r.creditLimit ? Number(r.creditLimit) : null,
    notes: r.notes || '',
    isActive: r.isActive,
    entriesCount: r._count.ledgerEntries,
    lastTransaction: r.ledgerEntries[0]
      ? {
          date: r.ledgerEntries[0].date,
          type: r.ledgerEntries[0].type,
          amount: Number(r.ledgerEntries[0].amount),
        }
      : null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));

  return NextResponse.json({
    success: true,
    data: formatted,
  });
});

export const POST = withApiHandler(async (ctx) => {
  const { appRole, req } = ctx;
  if (appRole && appRole !== 'ADMIN' && appRole !== 'MANAGER' && appRole !== 'SALESPERSON') {
    return NextResponse.json({ error: 'Unauthorized: insufficient permissions' }, { status: 403 });
  }

  const body = await req.json();
  const { name, shopName, phone, email, address, city, partyType, category, openingBalance, creditLimit, notes } = body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Contact person or business name is required' }, { status: 400 });
  }

  // Clean 10-digit phone
  let cleanPhone = null;
  if (phone && typeof phone === 'string' && phone.trim()) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length > 0 && digits.length !== 10) {
      return NextResponse.json({ error: `Mobile number must be exactly 10 digits (received ${digits.length} digits)` }, { status: 400 });
    }
    cleanPhone = digits.length === 10 ? digits : null;
  }

  const initBal = Number(openingBalance) || 0;
  const limit = (creditLimit !== undefined && creditLimit !== '' && creditLimit !== null && !isNaN(Number(creditLimit)))
    ? Number(creditLimit)
    : null;

  try {
    const retailer = await prisma.retailer.create({
      data: {
        name: name.trim(),
        shopName: shopName?.trim() || null,
        phone: cleanPhone,
        email: email?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || 'Surat',
        partyType: partyType === 'RETAILER' ? 'RETAILER' : 'VENDOR',
        category: category?.trim() || (partyType === 'RETAILER' ? 'Retail Store' : 'Raw Ingredients'),
        openingBalance: initBal,
        currentBalance: initBal,
        creditLimit: limit,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({
      success: true,
      data: retailer,
    });
  } catch (err: any) {
    console.error('[Retailer/Vendor Create Error]', err);
    return NextResponse.json({ error: err.message || 'Failed to save account in database' }, { status: 500 });
  }
});
