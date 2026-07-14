import prisma from '@/app/lib/prisma';
import { TransaksiClient } from './TransaksiClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    filterMode?: string;
    filterBulan?: string;
    filterTahun?: string;
    filterTanggalSpesifik?: string;
    sortKey?: string;
    sortDirection?: string;
    page?: string;
  }>;
}

export default async function TransaksiPage({ searchParams }: PageProps) {
  // resolve search parameters from nextjs routing
  const params = await searchParams;

  const search = params.search || '';
  const filterMode = params.filterMode || 'semua';
  const filterBulan = params.filterBulan || (new Date().getMonth() + 1).toString().padStart(2, '0');
  const filterTahun = params.filterTahun || new Date().getFullYear().toString();
  const filterTanggalSpesifik = params.filterTanggalSpesifik || '';
  const sortKey = params.sortKey || 'waktu';
  const sortDirection = (params.sortDirection === 'asc' || params.sortDirection === 'desc') ? params.sortDirection : 'desc';
  const page = Number(params.page) || 1;
  const itemsPerPage = 10;

  // build prisma where clause based on active filters
  const where: any = {};

  // apply global text search filter
  if (search) {
    where.OR = [
      { id: { contains: search, mode: 'insensitive' } },
      { pelanggan: { nama: { contains: search, mode: 'insensitive' } } },
      { kasir: { nama: { contains: search, mode: 'insensitive' } } },
    ];
  }

  // apply date and time filtering modes
  if (filterMode === 'spesifik' && filterTanggalSpesifik) {
    const startOfDay = new Date(`${filterTanggalSpesifik}T00:00:00.000Z`);
    const endOfDay = new Date(`${filterTanggalSpesifik}T23:59:59.999Z`);
    where.tanggalTransaksi = {
      gte: startOfDay,
      lte: endOfDay,
    };
  } else if (filterMode === 'bulan' && filterBulan && filterTahun) {
    const startOfMonth = new Date(Number(filterTahun), Number(filterBulan) - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(Number(filterTahun), Number(filterBulan), 0, 23, 59, 59, 999);
    where.tanggalTransaksi = {
      gte: startOfMonth,
      lte: endOfMonth,
    };
  }

  // build prisma order by configuration for sorting rows
  let orderBy: any = { tanggalTransaksi: 'desc' };
  if (sortKey) {
    switch (sortKey) {
      case 'id':
        orderBy = { id: sortDirection };
        break;
      case 'waktu':
        orderBy = { tanggalTransaksi: sortDirection };
        break;
      case 'pelanggan':
        orderBy = { pelanggan: { nama: sortDirection } };
        break;
      case 'pembayaran':
        orderBy = { status: { namaStatus: sortDirection } };
        break;
      case 'jumlah':
        orderBy = { jumlahTabung: sortDirection };
        break;
      case 'total':
        orderBy = { totalHarga: sortDirection };
        break;
    }
  }

  // execute database queries concurrently to maximize efficiency
  const [riwayatTransaksi, totalItems, allFilteredDataForStats] = await prisma.$transaction([
    prisma.transaksi.findMany({
      where,
      orderBy,
      skip: (page - 1) * itemsPerPage,
      take: itemsPerPage,
      include: {
        status: true,
        pelanggan: {
          include: {
            kategori: true,
          },
        },
        kasir: true,
      },
    }),
    prisma.transaksi.count({ where }),
    prisma.transaksi.findMany({
      where,
      select: {
        jumlahTabung: true,
        totalHarga: true,
      },
    }),
  ]);

  // compute dynamic stats from all matching records instead of just the active page
  const totalTabungFiltered = allFilteredDataForStats.reduce((acc, trx) => acc + trx.jumlahTabung, 0);
  const totalUangFiltered = allFilteredDataForStats.reduce((acc, trx) => acc + trx.totalHarga, 0);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Riwayat Transaksi</h1>
      </div>

      {/* pass data to client component for filtering */}
      <TransaksiClient
        initialData={riwayatTransaksi}
        totalItems={totalItems}
        totalPages={totalPages}
        currentPage={page}
        itemsPerPage={itemsPerPage}
        totalTabungFiltered={totalTabungFiltered}
        totalUangFiltered={totalUangFiltered}
        urlParams={{
          search,
          filterMode: filterMode as 'semua' | 'bulan' | 'spesifik',
          filterBulan,
          filterTahun,
          filterTanggalSpesifik,
          sortKey,
          sortDirection: sortDirection as 'asc' | 'desc',
        }}
      />
    </div>
  );
}
