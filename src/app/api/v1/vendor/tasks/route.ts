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

  let vendorUserIds = [user.id];
  if (isVendor) {
    // Find all active vendor users with the same vendor role (e.g., Vikas Bhai for VENDOR_FLORIST)
    const sameRoleVendors = await prisma.user.findMany({
      where: { role: appRole as any, status: { not: 'SUSPENDED' } },
      select: { id: true }
    });
    vendorUserIds = Array.from(new Set([user.id, ...sameRoleVendors.map(v => v.id)]));
  }

  // 1. Fetch assigned OrderItems
  const orderItems = await prisma.orderItem.findMany({
    where: {
      assignedVendorId: { in: vendorUserIds },
      status: { notIn: ['DELIVERED', 'CANCELLED'] }
    },
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
        select: { id: true, name: true, role: true }
      }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Determine vendor type string from appRole
  const roleVendorType = appRole === 'VENDOR_FLORIST' ? 'flower'
    : appRole === 'VENDOR_PHOTO' ? 'photo'
    : appRole === 'VENDOR_ACRYLIC' ? 'acrylic'
    : null;

  // 2. Fetch VendorTask table entries for this vendor
  const vendorTasks = await prisma.vendorTask.findMany({
    where: {
      OR: [
        { vendorId: { in: vendorUserIds } },
        ...(roleVendorType ? [{ vendorType: roleVendorType }] : [])
      ],
      status: { notIn: ['DELIVERED', 'CANCELLED'] }
    },
    include: {
      order: {
        include: {
          items: true,
          branch: { select: { name: true } }
        }
      },
      vendor: { select: { id: true, name: true, role: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Map OrderItems
  const mappedOrderItems = orderItems.map((item: any) => ({
    id: item.id,
    vendorId: item.assignedVendor?.id || user.id,
    instructions: item.instructions || item.notes || "",
    order: {
      orderNumber: item.order?.orderNumber || "Task",
      branch: { name: item.order?.branch?.name || "Kitchen" },
      targetDate: item.order?.targetDate
    },
    productName: item.productName,
    quantity: item.quantity,
    status: item.status || 'accepted'
  }));

  // Map VendorTasks
  const mappedVendorTasks = vendorTasks.map((vt: any) => {
    const firstItem = vt.order?.items?.[0] || {};
    const imgUrl = firstItem.designImageUrl || firstItem.image || firstItem.parentItem?.designImageUrl || "";
    return {
      id: vt.id,
      vendorId: vt.vendorId || user.id,
      instructions: vt.instructions || "",
      order: {
        orderNumber: vt.order?.orderNumber || "Task",
        branch: { name: vt.order?.branch?.name || "Kitchen" },
        targetDate: vt.order?.targetDate
      },
      productName: firstItem.productName || "Custom Fulfillment Assignment",
      quantity: firstItem.quantity || 1,
      status: vt.status || 'accepted',
      designImageUrl: imgUrl,
      parentItem: {
        productName: firstItem.productName || "Custom Assignment",
        notes: vt.instructions || "",
        designImageUrl: imgUrl,
        gallery: firstItem.media ? firstItem.media.map((m: any) => m.url) : null
      }
    };
  });

  // Combine unique tasks
  const allTasks = [...mappedOrderItems];
  mappedVendorTasks.forEach(vt => {
    if (!allTasks.some(t => t.id === vt.id)) {
      allTasks.push(vt);
    }
  });

  return NextResponse.json({ success: true, data: allTasks });
});
