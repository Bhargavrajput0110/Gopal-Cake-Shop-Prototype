import { NextResponse } from 'next/server';
import { withApiHandler, HandlerContext } from '@/lib/withApiHandler';
import { prisma } from '@/lib/prisma';

export const GET = withApiHandler(async (ctx: HandlerContext) => {
  const { appRole, user } = ctx;
  const isStaff = appRole ? ['ADMIN', 'MANAGER', 'SALESPERSON'].includes(appRole) : false;
  const isVendor = appRole ? appRole.startsWith('VENDOR_') : false;

  if (!isStaff && !isVendor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Filter out DELIVERED or CANCELLED tasks
  const whereClause: any = {
    assignedVendorId: { not: null },
    status: { notIn: ['DELIVERED', 'CANCELLED'] }
  };

  // If vendor, restrict to their own tasks
  if (isVendor) {
    whereClause.assignedVendorId = user.id;
  } else if (isStaff) {
    const queryVendorId = ctx.req.nextUrl.searchParams.get('vendorId');
    if (queryVendorId) {
      whereClause.assignedVendorId = queryVendorId;
    }
  }

  const tasks = await prisma.orderItem.findMany({
    where: whereClause,
    include: {
      order: {
        select: {
          orderNumber: true,
          targetDate: true,
          branch: { select: { name: true } }
        }
      },
      parentItem: {
        select: {
          productName: true,
          designImageUrl: true,
          notes: true,
          media: true
        }
      },
      assignedVendor: {
        select: {
          id: true,
          name: true,
          role: true
        }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  return NextResponse.json({ success: true, data: tasks });
});
