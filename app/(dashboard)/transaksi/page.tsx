import prisma from '@/app/lib/prisma';
import { TransaksiClient } from './TransaksiClient';

export default async function TransaksiPage() {
  // get complete relational data according to 3nf schema
  const riwayatTransaksi = await prisma.transaksi.findMany({
    include: { 
      pelanggan: {
        include: {
          kategori: true
        }
      },
      status: true
    },
    orderBy: { tanggalTransaksi: 'desc' },
  });

  return (
    // hand over rendering to client component
    <TransaksiClient initialData={riwayatTransaksi} />
  );
}
