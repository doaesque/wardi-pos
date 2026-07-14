import { Sidebar } from '@/components/Sidebar';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = cookieStore.get('wardi_session');

  if (!session) {
    redirect('/login');
  }

  let currentUser;
  try {
    currentUser = JSON.parse(session.value);
  } catch (e) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-[100dvh] bg-[#fafafa] dark:bg-zinc-950 transition-colors duration-300">
      <Sidebar user={currentUser} />
      {/* pt-14 matches the h-14 mobile navbar in sidebar */}
      <main className="flex-1 h-[100dvh] overflow-y-auto pt-14 md:pt-0">
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
