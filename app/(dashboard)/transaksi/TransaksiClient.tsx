'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, Calendar, ChevronDown, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

// update type to match 3nf relation from prisma include
type Transaksi = {
  id: string;
  tanggalTransaksi: Date;
  jumlahTabung: number;
  totalHarga: number;
  status?: { namaStatus: string } | null;
  pelanggan: {
    nama: string;
    kategori: { namaKategori: string } | null;
  } | null;
  kasir?: { nama: string } | null;
};

interface TransaksiClientProps {
  initialData: any[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;
  totalTabungFiltered: number;
  totalUangFiltered: number;
  urlParams: {
    search: string;
    filterMode: 'semua' | 'bulan' | 'spesifik';
    filterBulan: string;
    filterTahun: string;
    filterTanggalSpesifik: string;
    sortKey: string;
    sortDirection: 'asc' | 'desc';
  };
}

export function TransaksiClient({
  initialData,
  totalItems,
  totalPages,
  currentPage,
  itemsPerPage,
  totalTabungFiltered,
  totalUangFiltered,
  urlParams,
}: TransaksiClientProps) {
  const router = useRouter();
  
  // manage local state for the search input text fields
  const [search, setSearch] = useState(urlParams.search);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // debounce search input changes to prevent excessive database queries on every keypress
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (search !== urlParams.search) {
        updateUrl({ search, page: 1 });
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, urlParams.search]);

  // helper function to update url query parameters smoothly
  const updateUrl = (newParams: Record<string, any>) => {
    const params = new URLSearchParams();
    
    const targetParams = {
      search: newParams.search !== undefined ? newParams.search : search,
      filterMode: newParams.filterMode !== undefined ? newParams.filterMode : urlParams.filterMode,
      filterBulan: newParams.filterBulan !== undefined ? newParams.filterBulan : urlParams.filterBulan,
      filterTahun: newParams.filterTahun !== undefined ? newParams.filterTahun : urlParams.filterTahun,
      filterTanggalSpesifik: newParams.filterTanggalSpesifik !== undefined ? newParams.filterTanggalSpesifik : urlParams.filterTanggalSpesifik,
      sortKey: newParams.sortKey !== undefined ? newParams.sortKey : urlParams.sortKey,
      sortDirection: newParams.sortDirection !== undefined ? newParams.sortDirection : urlParams.sortDirection,
      page: newParams.page !== undefined ? newParams.page : currentPage,
    };

    if (targetParams.search) params.set('search', targetParams.search);
    params.set('filterMode', targetParams.filterMode);
    
    if (targetParams.filterMode === 'bulan') {
      if (targetParams.filterBulan) params.set('filterBulan', targetParams.filterBulan);
      if (targetParams.filterTahun) params.set('filterTahun', targetParams.filterTahun);
    } else if (targetParams.filterMode === 'spesifik') {
      if (targetParams.filterTanggalSpesifik) params.set('filterTanggalSpesifik', targetParams.filterTanggalSpesifik);
    }
    
    if (targetParams.sortKey) params.set('sortKey', targetParams.sortKey);
    if (targetParams.sortDirection) params.set('sortDirection', targetParams.sortDirection);
    if (targetParams.page && targetParams.page > 1) params.set('page', targetParams.page.toString());

    router.push(`?${params.toString()}`);
  };

  // handle updating sort parameters on columns
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (urlParams.sortKey === key && urlParams.sortDirection === 'asc') {
      direction = 'desc';
    }
    updateUrl({ sortKey: key, sortDirection: direction, page: 1 });
  };

  // helper to shorten category names for cleaner ui layout
  const getShortCategory = (namaKategori: string | undefined | null) => {
    if (!namaKategori) return 'NON';
    const lower = namaKategori.toLowerCase();
    if (lower.includes('rumah')) return 'RT';
    if (lower.includes('mikro') || lower === 'um') return 'UM';
    if (lower.includes('pengecer') || lower.includes('ecer')) return 'ECER';
    return namaKategori.substring(0, 4).toUpperCase();
  };

  return (
    <div className="space-y-4">

      {/* dynamic stats container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <p className="text-sm text-zinc-500 font-medium mb-1">Total Tabung</p>
          <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalTabungFiltered.toLocaleString('id-ID')} Tabung</h4>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <p className="text-sm text-zinc-500 font-medium mb-1">Total Pemasukan</p>
          <h4 className="text-2xl font-bold text-[#52796F]">Rp {totalUangFiltered.toLocaleString('id-ID')}</h4>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input type="text" placeholder="Ketik ID, nama pelanggan, atau nama kasir..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:border-[#52796F] transition-colors" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg w-full md:w-auto">
            <div className="pl-3 py-2 text-zinc-400 pointer-events-none"><Filter size={14} /></div>
            <select value={urlParams.filterMode} onChange={(e) => updateUrl({ filterMode: e.target.value, page: 1 })} className="appearance-none w-full py-2 pr-8 pl-2 bg-transparent text-sm font-medium outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <option value="semua">Semua Waktu</option><option value="bulan">Per Bulan</option><option value="spesifik">Pilih Tanggal</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          {urlParams.filterMode === 'bulan' && (
            <div className="flex items-center gap-2 w-full md:w-auto animate-in fade-in duration-300">
              <div className="relative flex-1 md:w-auto">
                <select value={urlParams.filterBulan} onChange={(e) => updateUrl({ filterBulan: e.target.value, page: 1 })} className="appearance-none w-full py-2 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none focus:border-[#52796F] cursor-pointer">
                  <option value="">Bulan</option><option value="01">Jan</option><option value="02">Feb</option><option value="03">Mar</option><option value="04">Apr</option><option value="05">Mei</option><option value="06">Jun</option><option value="07">Jul</option><option value="08">Agu</option><option value="09">Sep</option><option value="10">Okt</option><option value="11">Nov</option><option value="12">Des</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
              <div className="relative flex-1 md:w-auto">
                <select value={urlParams.filterTahun} onChange={(e) => updateUrl({ filterTahun: e.target.value, page: 1 })} className="appearance-none w-full py-2 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none focus:border-[#52796F] cursor-pointer">
                  <option value="">Tahun</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          )}

          {urlParams.filterMode === 'spesifik' && (
            <div className="w-full md:w-auto animate-in fade-in duration-300">
              <input type="date" value={urlParams.filterTanggalSpesifik} onChange={(e) => updateUrl({ filterTanggalSpesifik: e.target.value, page: 1 })} className="w-full py-2 pl-3 pr-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none focus:border-[#52796F] cursor-pointer dark:[color-scheme:dark]" />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400 min-w-[700px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 uppercase font-semibold border-b border-zinc-200 dark:border-zinc-800 select-none">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('id')}>
                  <div className="flex items-center gap-2">ID Transaksi <ArrowUpDown size={14} className="text-zinc-400" /></div>
                </th>
                <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('waktu')}>
                  <div className="flex items-center gap-2">Waktu <ArrowUpDown size={14} className="text-zinc-400" /></div>
                </th>
                <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('pelanggan')}>
                  <div className="flex items-center gap-2">Pelanggan <ArrowUpDown size={14} className="text-zinc-400" /></div>
                </th>
                <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('pembayaran')}>
                  <div className="flex items-center gap-2">Pembayaran <ArrowUpDown size={14} className="text-zinc-400" /></div>
                </th>
                <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('jumlah')}>
                  <div className="flex items-center gap-2">Jumlah <ArrowUpDown size={14} className="text-zinc-400" /></div>
                </th>
                <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('total')}>
                  <div className="flex items-center gap-2">Total <ArrowUpDown size={14} className="text-zinc-400" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialData.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">Data tidak ditemukan.</td></tr>
              ) : (
                initialData.map((trx) => (
                  <tr key={trx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">{trx.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5"><Calendar size={12} className="text-zinc-400" />{new Date(trx.tanggalTransaksi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">{trx.pelanggan?.nama || 'Umum'}</span>
                        <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 ml-2 rounded uppercase font-semibold tracking-wide border border-zinc-200 dark:border-zinc-700/50 shrink-0">
                          {getShortCategory(trx.pelanggan?.kategori?.namaKategori)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-500">{trx.status?.namaStatus || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{trx.jumlahTabung} Tabung</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#52796F]">Rp {trx.totalHarga.toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* server-side pagination controller controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 select-none">
            <span className="text-sm text-zinc-500">
              Menampilkan {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} - {Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems} transaksi
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => updateUrl({ page: currentPage - 1 })}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Halaman {currentPage} dari {totalPages}
              </span>
              <button
                onClick={() => updateUrl({ page: currentPage + 1 })}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-600 dark:text-zinc-400 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
