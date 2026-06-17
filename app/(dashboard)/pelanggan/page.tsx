import prisma from '@/app/lib/prisma';
import { PelangganClient } from './PelangganClient';

export default async function PelangganPage() {
  // fetch all customers ordered by newest
  const daftarPelanggan = await prisma.pelanggan.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Data Pelanggan</h1>
        </div>
      </div>

      {/* pass data to client component */}
      <PelangganClient initialData={daftarPelanggan} />
    </div>
  );
}
