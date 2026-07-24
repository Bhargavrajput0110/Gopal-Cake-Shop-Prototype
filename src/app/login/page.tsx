import LoginClient from "./LoginClient";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const dbBranches = await prisma.branch.findMany({
    select: { id: true, name: true }
  });

  const branchList = dbBranches.map((b: any) => ({
    id: b.id,
    name: b.name
  }));

  const dbUsers = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'MANAGER', 'SALESPERSON', 'CHEF', 'DELIVERY'] }
    }
  });

  const staffList = dbUsers.map((u: any) => {
    let mappedRole = u.role.toLowerCase();
    if (u.role === 'SALESPERSON') mappedRole = 'sales';
    if (u.role === 'DELIVERY') mappedRole = 'driver';

    return {
      id: u.id,
      name: u.name,
      role: mappedRole,
      branchId: u.branchId
    };
  });

  return <LoginClient staffList={staffList} branchList={branchList} />;
}
