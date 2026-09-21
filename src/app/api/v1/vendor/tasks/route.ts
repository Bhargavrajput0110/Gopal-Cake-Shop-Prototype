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

  // Determine vendor type string from appRole
  const roleVendorType = appRole === 'VENDOR_FLORIST' ? 'flower'
    : appRole === 'VENDOR_PHOTO' ? 'photo'
    : appRole === 'VENDOR_ACRYLIC' ? 'acrylic'
    : null;

  let orderItemWhere: any = { status: { notIn: ['DELIVERED', 'CANCELLED'] } };
  if (isVendor) {
    orderItemWhere.assignedVendorId = { in: vendorUserIds };
  } else if (isStaff) {
    orderItemWhere.assignedVendorId = { not: null };
  }

  let vendorTaskWhere: any = { status: { notIn: ['DELIVERED', 'CANCELLED'] } };
  if (isVendor) {
    vendorTaskWhere.OR = [
      { vendorId: { in: vendorUserIds } },
      ...(roleVendorType ? [{ vendorType: roleVendorType }] : [])
    ];
  }

  // 1. Fetch assigned OrderItems
  const orderItems = await prisma.orderItem.findMany({
    where: orderItemWhere,
    include: {
      media: true,
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

  // 2. Fetch VendorTask table entries
  const vendorTasks = await prisma.vendorTask.findMany({
    where: vendorTaskWhere,
    include: {
      order: {
        include: {
          items: {
            include: { media: true, parentItem: { include: { media: true } } }
          },
          branch: { select: { name: true } }
        }
      },
      vendor: { select: { id: true, name: true, role: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Map OrderItems
  const mappedOrderItems = orderItems.map((item: any) => {
    const parentMedia = item.parentItem?.media || [];
    const itemMedia = item.media || [];
    const productionMedia = parentMedia.find((m: any) => m.type === 'PRODUCTION') || itemMedia.find((m: any) => m.type === 'PRODUCTION');
    
    const cakeImg = item.designImageUrl || item.image || item.parentItem?.designImageUrl || "";
    const customerPhoto = productionMedia?.url || item.image || item.designImageUrl || "";
    const mediaUrls = [
      ...itemMedia.map((m: any) => m.url),
      ...parentMedia.map((m: any) => m.url)
    ];
    
    const gallery = Array.from(new Set([cakeImg, customerPhoto, ...mediaUrls].filter(Boolean)));
    return {
      id: item.id,
      vendorId: item.assignedVendor?.id || user.id,
      instructions: item.instructions || item.notes || "",
      designImageUrl: cakeImg,
      customerPhotoUrl: customerPhoto,
      order: {
        orderNumber: item.order?.orderNumber || "Task",
        branch: { name: item.order?.branch?.name || "Kitchen" },
        targetDate: item.order?.targetDate
      },
      productName: item.productName,
      quantity: item.quantity,
      status: item.status || 'accepted',
      parentItem: {
        productName: item.productName || "Custom Assignment",
        notes: item.instructions || item.notes || "",
        designImageUrl: cakeImg,
        customerPhotoUrl: customerPhoto,
        gallery: gallery
      }
    };
  });

  // Map VendorTasks
  const mappedVendorTasks = vendorTasks.map((vt: any) => {
    const items = vt.order?.items || [];
    const itemWithImage = items.find((i: any) => i.designImageUrl || i.image || i.parentItem?.designImageUrl) || items[0] || {};
    const notesJson = typeof vt.notes === 'object' && vt.notes !== null ? vt.notes : {};
    
    const itemMedia = itemWithImage.media || [];
    const parentMedia = itemWithImage.parentItem?.media || [];
    const productionMedia = itemMedia.find((m: any) => m.type === 'PRODUCTION');

    const cakeImg = notesJson.designImageUrl || itemWithImage.designImageUrl || itemWithImage.image || itemWithImage.parentItem?.designImageUrl || "";
    const customerPhoto = notesJson.photoUrl || productionMedia?.url || itemWithImage.designImageUrl || itemWithImage.image || "";
    const mediaUrls = [
      ...itemMedia.map((m: any) => m.url),
      ...parentMedia.map((m: any) => m.url)
    ];

    const gallery = Array.from(new Set([cakeImg, customerPhoto, ...mediaUrls].filter(Boolean)));

    return {
      id: vt.id,
      vendorId: vt.vendorId || user.id,
      instructions: vt.instructions || "",
      order: {
        orderNumber: vt.order?.orderNumber || "Task",
        branch: { name: vt.order?.branch?.name || "Kitchen" },
        targetDate: vt.order?.targetDate
      },
      productName: itemWithImage.productName || "Custom Fulfillment Assignment",
      quantity: itemWithImage.quantity || 1,
      status: vt.status || 'accepted',
      designImageUrl: cakeImg,
      customerPhotoUrl: customerPhoto,
      parentItem: {
        productName: itemWithImage.productName || "Custom Assignment",
        notes: vt.instructions || "",
        designImageUrl: cakeImg,
        customerPhotoUrl: customerPhoto,
        gallery: gallery
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
