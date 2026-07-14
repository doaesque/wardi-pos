import prisma from '@/app/lib/prisma';
import { TransaksiClient } from './TransaksiClient';

export default async function TransaksiPage() {
  // fetch transactions, including customer and category relations
  // note: kasir relation is omitted because it doesn't exist in the current schema
  const riwayatTransaksi = await prisma.transaksi.findMany({
    include: {
      pelanggan: {
        include: {
          kategori: true
        }
      }
    },
    orderBy: { tanggalTransaksi: 'desc' },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Riwayat Transaksi</h1>
      </div>

      {/* pass data to client component for filtering */}
      <TransaksiClient initialData={riwayatTransaksi} />
    </div>
  );
}
