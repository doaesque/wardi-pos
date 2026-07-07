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
    // hand over rendering completely to the client component
    <PelangganClient initialData={formattedData} />
  );
}