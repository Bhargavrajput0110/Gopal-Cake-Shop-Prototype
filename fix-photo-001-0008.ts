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

  const mainItem = order.items.find(i => i.parentItemId === null);

  if (!mainItem) {
    console.error('No main item found in order!');
    return;
  }

  // Create a Media record of type PRODUCTION linked to the main item
  const dummyPhotoUrl = 'https://res.cloudinary.com/drldymf2a/image/upload/v1700000000/dummy-edible-print.jpg'; // just a placeholder or any valid url
  
  await prisma.orderItemMedia.create({
    data: {
      orderItemId: mainItem.id,
      type: 'PRODUCTION',
      url: dummyPhotoUrl
    }
  });

  console.log('Successfully attached dummy customer photo to order 001-0008!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
