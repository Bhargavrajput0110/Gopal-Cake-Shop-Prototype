import LoginClient from "./LoginClient";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  // Only show the 4 canonical spec branches in the login branch selector.
  // KHD (Khanderao Market) is retained in the DB for historical orders
  // but is excluded from staff login since no spec staff is assigned there.
  const SPEC_BRANCH_CODES = ['UMA', 'MARKET', 'WARASIYA', 'ELLORAPARK'];

  const dbBranches = await prisma.branch.findMany({
    where: { isActive: true, code: { in: SPEC_BRANCH_CODES } },
    select: { id: true, name: true, code: true },
    orderBy: { name: 'asc' }
  });

  const branchList = dbBranches.map((b: any) => ({
    id: b.id,
    name: b.name
  }));

  const dbUsers = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'MANAGER', 'SALESPERSON', 'CHEF', 'DELIVERY'] },
      status: { not: 'SUSPENDED' }
    }
  });

  const staffList = dbUsers.map((u: any) => {
    let mappedRole = u.role.toLowerCase();
    if (u.role === 'SALESPERSON') mappedRole = 'sales';
    if (u.role === 'DELIVERY') mappedRole = 'driver';
    if (u.role === 'CHEF') mappedRole = 'chef';
    if (u.role === 'KITCHEN') mappedRole = 'chef'; // Helper chefs shown under Chef tab
    if (u.role === 'MANAGER') mappedRole = 'manager';
    if (u.role === 'ADMIN') mappedRole = 'admin';

    return {
      id: u.id,
      name: u.name,
      role: mappedRole,
      branchId: u.branchId
    };
  });

  return <LoginClient staffList={staffList} branchList={branchList} />;
}
