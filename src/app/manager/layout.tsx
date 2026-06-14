import { ManagerSidebar } from "@/components/manager/ManagerSidebar";
import { ManagerTopbar } from "@/components/manager/ManagerTopbar";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <ManagerSidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <ManagerTopbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
