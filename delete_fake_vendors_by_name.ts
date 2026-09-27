import { prisma } from './src/lib/prisma'

async function main() {
  const users = await prisma.user.findMany({
    where: {
      name: { contains: "Vendor Florist" }
    }
  });

  for (const u of users) {
    try {
      await prisma.orderItem.updateMany({
        where: { assignedVendorId: u.id },
        data: { assignedVendorId: null }
      });
      await prisma.vendorTask.deleteMany({
        where: { vendorId: u.id }
      });
      await prisma.user.delete({ where: { id: u.id } });
      console.log(`Deleted fake vendor ${u.name} (${u.id})`);
    } catch(e: any) {
      console.log(`Error deleting ${u.name}:`, e.message);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
