import prisma from '@/app/lib/prisma';
import PelangganClient from './PelangganClient';

export default async function PelangganPage() {
  // fetch all customers ordered by newest, include category relation
  const daftarPelanggan = await prisma.pelanggan.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      kategori: true
    }
  });

  // map data to match client expectations
  const formattedData = daftarPelanggan.map(p => ({
    nik: p.nik,
    nama: p.nama,
    kategori: p.kategori.namaKategori,
    idKategori: p.idKategori
  }));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Data Pelanggan</h1>
        </div>
      </div>

      {/* pass data to client component */}
      <PelangganClient initialData={formattedData} />
    </div>
  );
}
