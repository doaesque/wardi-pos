import prisma from '@/app/lib/prisma';
import { KaryawanClient } from './KaryawanClient';

export default async function KaryawanPage() {
  // fetch all users and their total handled transactions
  const daftarKaryawan = await prisma.user.findMany({
    select: {
      id: true,
      nama: true,
      username: true,
      role: true,
      _count: {
        select: { transaksi: true },
      },
    },
    orderBy: { role: 'asc' },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Data Karyawan & Performa</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Kelola akun staf dan pantau jumlah transaksi yang telah mereka layani.</p>
        </div>
      </div>

      {/* pass data to client component */}
      <KaryawanClient initialData={daftarKaryawan} />
    </div>
  );
}
