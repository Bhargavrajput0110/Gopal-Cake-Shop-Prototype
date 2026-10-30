import LoginClient from "./LoginClient";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  // Include all 4 canonical branches in the login branch selector:
  // UMA, KHD (Khanderao Market), WARASIYA, ELLORAPARK
  const SPEC_BRANCH_CODES = ['UMA', 'KHD', 'WARASIYA', 'ELLORAPARK', 'MARKET'];

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
      role: { in: ['ADMIN', 'MANAGER', 'SALESPERSON', 'CHEF', 'DELIVERY', 'VENDOR_PHOTO', 'VENDOR_FLORIST', 'VENDOR_ACRYLIC'] },
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
    if (u.role.startsWith('VENDOR_')) mappedRole = 'vendor';

    return {
      id: u.id,
      name: u.name,
      role: mappedRole,
      branchId: u.branchId
    };
  });

  return <LoginClient staffList={staffList} branchList={branchList} />;
}
