import { ChefTopbar } from "@/components/chef/ChefTopbar";

export default function ChefLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Full width KDS, no sidebar */}
      <ChefTopbar />
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
