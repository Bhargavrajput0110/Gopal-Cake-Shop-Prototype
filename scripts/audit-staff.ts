import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function auditStaff() {
  const users = await prisma.user.findMany({
    include: {
      branch: true
    }
  });

  console.log("Total staff accounts:", users.length);
  const tableData = users.map(user => {
    return {
      Staff: user.name || user.email || user.phone,
      Role: user.role || 'MISSING',
      Branch: user.branch?.name || user.branchId || 'MISSING',
      Status: user.status,
      HasPIN: user.passwordHash ? 'Yes' : 'No',
      Ready: (user.role && user.passwordHash && user.status === 'ACTIVE') ? 'Yes' : 'No'
    };
  });
  console.table(tableData);
}

auditStaff().catch(console.error).finally(() => prisma.$disconnect());
