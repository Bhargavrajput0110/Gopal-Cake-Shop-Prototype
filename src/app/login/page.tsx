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

  staffList.push({
    id: "3", // E2E Mock ID
    name: "Raju Bhai (Sales)",
    role: "sales",
    branchId: branchList.length > 0 ? branchList[0].id : undefined
  });

  staffList.push({
    id: "4",
    name: "Super Admin",
    role: "admin",
    branchId: undefined
  });

  staffList.push({
    id: "5",
    name: "Head Chef",
    role: "chef",
    branchId: branchList.length > 0 ? branchList[0].id : undefined
  });

  staffList.push({
    id: "6",
    name: "Creative Acrylics",
    role: "vendor",
    branchId: undefined
  });

  staffList.push({
    id: "7",
    name: "Sayaji Florists",
    role: "vendor",
    branchId: undefined
  });

  staffList.push({
    id: "8",
    name: "Gopal Photography Studio",
    role: "vendor",
    branchId: undefined
  });

  return <LoginClient staffList={staffList} branchList={branchList} />;
}
