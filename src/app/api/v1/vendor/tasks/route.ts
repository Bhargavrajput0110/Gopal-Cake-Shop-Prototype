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
    const sameRoleVendors = await prisma.user.findMany({
      where: { role: appRole as any, status: { not: 'SUSPENDED' } },
      select: { id: true }
    });
    vendorUserIds = Array.from(new Set([user.id, ...sameRoleVendors.map(v => v.id)]));
  }

  // Map role → vendorType string (used in VendorTask.vendorType)
  const roleVendorType = appRole === 'VENDOR_FLORIST' ? 'flower'
    : appRole === 'VENDOR_PHOTO' ? 'photo'
    : appRole === 'VENDOR_ACRYLIC' ? 'acrylic'
    : null;

  // Map role → exact productName in OrderItem
  const roleProductName = appRole === 'VENDOR_FLORIST' ? 'FLORIST Component'
    : appRole === 'VENDOR_PHOTO' ? 'PHOTO Component'
    : appRole === 'VENDOR_ACRYLIC' ? 'ACRYLIC Component'
    : null;

  // === 1. OrderItems assigned to this vendor ===
  let orderItemWhere: any = {
    parentItemId: { not: null },  // ONLY child items — never show main cake
    // Show all statuses — vendor sees active + completed in history tab
    status: { notIn: ['CANCELLED'] }
  };
  if (isVendor) {
    orderItemWhere.assignedVendorId = { in: vendorUserIds };
    // Also filter by product name to prevent cross-contamination
    if (roleProductName) {
      orderItemWhere.productName = roleProductName;
    }
  } else if (isStaff) {
    orderItemWhere.assignedVendorId = { not: null };
  }

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

  // === 2. VendorTask table entries ===
  let vendorTaskWhere: any = { status: { notIn: ['cancelled', 'CANCELLED'] } };
  if (isVendor) {
    const conditions: any[] = [];
    if (vendorUserIds.length > 0) conditions.push({ vendorId: { in: vendorUserIds } });
    if (roleVendorType) conditions.push({ vendorType: roleVendorType });
    if (conditions.length > 0) vendorTaskWhere.OR = conditions;
  }

  const vendorTasks = await prisma.vendorTask.findMany({
    where: vendorTaskWhere,
    include: {
      order: {
        include: {
          items: {
            where: { parentItemId: { not: null } }, // only fetch child items from order
            include: { media: true, parentItem: { include: { media: true } } }
          },
          branch: { select: { name: true } }
        }
      },
      vendor: { select: { id: true, name: true, role: true } }
    },
    orderBy: { createdAt: 'asc' }
  });

  // === 3. Map OrderItems ===
  const mappedOrderItems = orderItems.map((item: any) => {
    const parentMedia = item.parentItem?.media || [];
    const itemMedia = item.media || [];
    const productionMedia = parentMedia.find((m: any) => m.type === 'PRODUCTION') || itemMedia.find((m: any) => m.type === 'PRODUCTION');
    const cakeImg = item.designImageUrl || item.image || item.parentItem?.designImageUrl || "";
    const customerPhoto = productionMedia?.url || item.image || item.designImageUrl || "";
    const gallery = Array.from(new Set([cakeImg, customerPhoto, ...itemMedia.map((m: any) => m.url), ...parentMedia.map((m: any) => m.url)].filter(Boolean)));

    return {
      id: item.id,
      sourceType: 'ORDER_ITEM',
      orderItemId: item.id,
      vendorId: item.assignedVendor?.id || user.id,
      assignedVendor: item.assignedVendor,
      instructions: item.notes || "",
      designImageUrl: cakeImg,
      customerPhotoUrl: customerPhoto,
      order: {
        orderNumber: item.order?.orderNumber || "Task",
        branch: { name: item.order?.branch?.name || "Kitchen" },
        targetDate: item.order?.targetDate
      },
      productName: item.productName,
      quantity: item.quantity,
      status: item.status || 'CHEF_ACCEPTED',
      parentItem: {
        productName: item.parentItem?.productName || item.productName || "Custom Assignment",
        notes: item.notes || item.parentItem?.notes || "",
        designImageUrl: cakeImg,
        customerPhotoUrl: customerPhoto,
        gallery: gallery
      }
    };
  });

  // === 4. Map VendorTasks — find the CORRECT child item by type ===
  const vendorTypeToProductName: Record<string, string> = {
    'flower': 'FLORIST Component',
    'photo': 'PHOTO Component',
    'acrylic': 'ACRYLIC Component',
    'VENDOR_FLORIST': 'FLORIST Component',
    'VENDOR_PHOTO': 'PHOTO Component',
    'VENDOR_ACRYLIC': 'ACRYLIC Component',
  };

  const mappedVendorTasks = vendorTasks.map((vt: any) => {
    const expectedName = vendorTypeToProductName[vt.vendorType] || '';
    const items = vt.order?.items || [];

    // Find the CORRECT child item matching this vendor type
    const matchingChildItem = items.find((i: any) =>
      i.productName === expectedName
    ) || items[0] || {};

    const notesJson = typeof vt.notes === 'object' && vt.notes !== null ? vt.notes : {};
    const itemMedia = matchingChildItem.media || [];
    const parentMedia = matchingChildItem.parentItem?.media || [];
    const productionMedia = itemMedia.find((m: any) => m.type === 'PRODUCTION');

    const cakeImg = notesJson.designImageUrl || matchingChildItem.designImageUrl || matchingChildItem.image || matchingChildItem.parentItem?.designImageUrl || "";
    const customerPhoto = notesJson.photoUrl || productionMedia?.url || matchingChildItem.designImageUrl || matchingChildItem.image || "";
    const gallery = Array.from(new Set([cakeImg, customerPhoto, ...itemMedia.map((m: any) => m.url), ...parentMedia.map((m: any) => m.url)].filter(Boolean)));

    return {
      id: vt.id,
      sourceType: 'VENDOR_TASK',
      vendorTaskId: vt.id,
      vendorId: vt.vendorId || user.id,
      assignedVendor: vt.vendor,
      instructions: vt.instructions || "",
      order: {
        orderNumber: vt.order?.orderNumber || "Task",
        branch: { name: vt.order?.branch?.name || "Kitchen" },
        targetDate: vt.order?.targetDate
      },
      // Show the CORRECT component name — not whatever item[0] is
      productName: expectedName || vt.vendorType + ' Component',
      quantity: matchingChildItem.quantity || 1,
      status: vt.status || 'accepted',
      designImageUrl: cakeImg,
      customerPhotoUrl: customerPhoto,
      parentItem: {
        productName: matchingChildItem.parentItem?.productName || vt.order?.orderNumber || "Custom Assignment",
        notes: vt.instructions || "",
        designImageUrl: cakeImg,
        customerPhotoUrl: customerPhoto,
        gallery: gallery
      }
    };
  });

  // === 5. De-duplicate: prefer OrderItem over VendorTask for same order+vendorType ===
  // Key = orderId (from orderNumber) + productName to avoid showing both sources for same assignment
  const seen = new Set<string>();
  const allTasks: any[] = [];

  // OrderItems first (they are the authoritative source after fix)
  mappedOrderItems.forEach(t => {
    const key = `${t.order.orderNumber}__${t.productName}`;
    seen.add(key);
    allTasks.push(t);
  });

  // VendorTasks only if we haven't seen this order+type already
  mappedVendorTasks.forEach(vt => {
    const key = `${vt.order.orderNumber}__${vt.productName}`;
    if (!seen.has(key)) {
      seen.add(key);
      allTasks.push(vt);
    }
  });

  // Fetch all vendors for staff view
  let allVendors: any[] = [];
  if (isStaff) {
    allVendors = await prisma.user.findMany({
      where: {
        role: { in: ['VENDOR_FLORIST', 'VENDOR_PHOTO', 'VENDOR_ACRYLIC'] },
        status: { not: 'SUSPENDED' }
      },
      select: { id: true, name: true, role: true, phone: true }
    });
  }

  return NextResponse.json({ success: true, data: allTasks, vendors: allVendors });
});
