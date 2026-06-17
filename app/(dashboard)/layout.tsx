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
    <div className="flex min-h-[100dvh] bg-zinc-50 dark:bg-zinc-950">
      <Sidebar user={currentUser} />
      {/* pt-16 ditambahkan agar konten tidak tertabrak oleh top navbar di mobile */}
      <main className="flex-1 h-[100dvh] overflow-y-auto pt-16 md:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
