import { Sidebar } from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* sidebar component */}
      <Sidebar />

      {/* main content area */}
      <main className="flex-1 p-8 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 transition-colors duration-300">
        {children}
      </main>
    </div>
  );
}
