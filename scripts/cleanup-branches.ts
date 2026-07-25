import 'dotenv/config'
import { prisma } from '../src/lib/prisma'

async function main() {
  console.log('Cleaning up database branches...')

  // 1. Reassign any users or orders pointing to stray test branches
  const strayBranchIds = ['cmrfv5hab0000h0u3fwuzy9x4', 'default-branch', 'b-001', 'BRANCH-A']
  
  await prisma.user.updateMany({
    where: { branchId: { in: strayBranchIds } },
    data: { branchId: 'khanderao' }
  })

  await prisma.order.updateMany({
    where: { branchId: { in: strayBranchIds } },
    data: { branchId: 'khanderao' }
  })

  // 2. Deactivate stray branches
  await prisma.branch.updateMany({
    where: { id: { in: strayBranchIds } },
    data: { isActive: false }
  })

  // 3. Update canonical branch names
  await prisma.branch.update({
    where: { id: 'varasiya' },
    data: { name: 'Warasiya', address: 'Warasiya, Vadodara' }
  })

  await prisma.branch.update({
    where: { id: 'elora' },
    data: { name: 'Ellora Park', address: 'Ellora Park, Vadodara' }
  })

  const activeBranches = await prisma.branch.findMany({
    where: { isActive: true }
  })

  console.log('✔ Active Branches after cleanup:', activeBranches.map(b => ({ id: b.id, name: b.name, code: b.code })))
}

main().catch(console.error).finally(() => prisma.$disconnect())
