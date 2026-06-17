import prisma from '@/app/lib/prisma';
import { TransaksiClient } from './TransaksiClient';

export default async function TransaksiPage() {
  // fetch transactions, including customer and cashier relations
  const riwayatTransaksi = await prisma.transaksi.findMany({
    include: { 
      pelanggan: true,
      kasir: true 
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
