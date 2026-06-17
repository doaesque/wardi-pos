import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // await is required for next.js 15+
  const cookieStore = await cookies();
  const session = cookieStore.get('wardi_session');

  // redirect if no session
  if (!session) {
    redirect('/login');
  }

  // parse user data
  const user = JSON.parse(session.value);

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar user={user} />

      <main className="flex-1 p-8 overflow-y-auto bg-zinc-50 dark:bg-zinc-900 transition-colors duration-300">
        {children}
      </main>
    </div>
  );
}
