import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { KaryawanClient } from './KaryawanClient';

export default async function KaryawanPage() {
  // get current user session to prevent self-deletion
  const cookieStore = await cookies();
  const session = cookieStore.get('wardi_session');
  const currentUser = session ? JSON.parse(session.value) : null;

  // fetch all users, their transaction count, and recent work sessions
  const daftarKaryawan = await prisma.user.findMany({
    select: {
      id: true,
      nama: true,
      username: true,
      role: true,
      _count: {
        select: { transaksi: true },
      },
      sesiKerja: {
        orderBy: { waktuMulai: 'desc' },
        take: 5, // fetch last 5 sessions for performance detail
        select: {
          id: true,
          waktuMulai: true,
          waktuSelesai: true,
        }
      }
    },
    orderBy: { role: 'asc' },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Data Karyawan & Performa</h1>
        </div>
      </div>

      {/* pass data and current user to client component */}
      <KaryawanClient initialData={daftarKaryawan} currentUser={currentUser} />
    </div>
  );
}
