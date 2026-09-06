const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const p = await prisma.product.findUnique({
      where: { id: 'cmsuqd4kh001zqgu37svhcvbd' }
    });
    console.log('Result:', JSON.stringify(p, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
run();
