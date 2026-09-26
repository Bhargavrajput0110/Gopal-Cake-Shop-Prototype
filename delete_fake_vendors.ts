import { prisma } from './src/lib/prisma'

async function main() {
  const fakeIds = ['usr_vendor_photo', 'usr_vendor_flower', 'usr_vendor_acrylic', 'usr_vendor_photographer']
  for (const id of fakeIds) {
    try {
      // First disconnect/delete any tasks assigned to them to prevent FK constraints
      await prisma.orderItem.updateMany({
        where: { assignedVendorId: id },
        data: { assignedVendorId: null }
      })
      await prisma.user.deleteMany({ where: { id } })
      console.log(`Deleted fake vendor ${id}`)
    } catch(e: any) {
      console.log(`Error deleting ${id}:`, e.message)
    }
  }
}
main().catch(console.error)
