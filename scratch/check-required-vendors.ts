import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  const products = await prisma.product.findMany({
    where: {
      requiredVendors: {
        isEmpty: false
      }
    }
  });
  console.log(`Products with requiredVendors:`, products.length);
  console.dir(products.map(p => ({ id: p.id, name: p.name, vendors: p.requiredVendors })), { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
