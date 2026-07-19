import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import DashboardPage from "@/components/dashboard/DashboardPage";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const branch = await prisma.branch.findUnique({
    where: { id: params.id },
    select: { name: true },
  });
  return {
    title: branch ? `${branch.name} Dashboard — Bakery OS` : "Branch Dashboard",
  };
}

export default async function BranchDashboardPage({ params }: Props) {
  const branch = await prisma.branch.findUnique({
    where: { id: params.id },
    select: { id: true, name: true },
  });

  if (!branch) notFound();

  return <DashboardPage branchId={branch.id} branchName={branch.name} />;
}
