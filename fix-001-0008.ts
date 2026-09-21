import { prisma } from './src/lib/prisma'

async function main() {
  const order = await prisma.order.findUnique({
    where: { orderNumber: '001-0008' },
    include: { items: true }
  });

  if (!order) {
    console.error('Order 001-0008 not found!');
    return;
  }

  const photoVendor = await prisma.user.findFirst({
    where: { role: 'VENDOR_PHOTO', status: 'ACTIVE' }
  });

  if (!photoVendor) {
    console.error('Photo vendor not found!');
    return;
  }

  const mainItem = order.items.find(i => i.parentItemId === null);

  if (!mainItem) {
    console.error('No main item found in order!');
    return;
  }

  // Check if a child item already exists for this vendor to prevent duplicates
  const existingChild = order.items.find(i => i.assignedVendorId === photoVendor.id);
  if (existingChild) {
    console.log('Vendor task already exists!', existingChild.id);
    return;
  }

  const childItem = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      parentItemId: mainItem.id,
      productName: 'PHOTO Component',
      price: 0,
      quantity: mainItem.quantity,
      weight: 0,
      status: 'WAITING_FOR_CHEF',
      assignedVendorId: photoVendor.id,
    }
  });

  console.log('Successfully created photo vendor task for order 001-0008! Item ID:', childItem.id);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
