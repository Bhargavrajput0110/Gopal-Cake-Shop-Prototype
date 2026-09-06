const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPrisma() {
  try {
    const updatedOrder = await prisma.order.update({
      where: { id: 'cmtlvf3zi00244gu3souzrioi' },
      data: {
        customerNotes: undefined,
        targetDate: undefined,
      }
    });
    console.log("Success!", updatedOrder.id);
  } catch(e) {
    console.log("Error!", e.message);
  }
}

testPrisma().catch(e => console.error(e)).finally(() => prisma.$disconnect());
