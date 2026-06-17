'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Calendar, ChevronDown } from 'lucide-react';

type Transaksi = { id: string; tanggalTransaksi: Date; jumlahTabung: number; totalHarga: number; metodePembayaran: string; pelanggan: { nama: string; kategori: string } | null; kasir: { nama: string } | null; };

export function TransaksiClient({ initialData }: { initialData: any[] }) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'semua' | 'bulan' | 'spesifik'>('semua');
  
  const currentYear = new Date().getFullYear();
  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
  
  const [filterBulan, setFilterBulan] = useState(currentMonth);
  const [filterTahun, setFilterTahun] = useState(currentYear.toString());
  const [filterTanggalSpesifik, setFilterTanggalSpesifik] = useState('');

  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  const filteredData = useMemo(() => {
    return initialData.filter((trx: Transaksi) => {
      const trxDate = new Date(trx.tanggalTransaksi);
      const searchLower = search.toLowerCase();
      const matchSearch = trx.id.toLowerCase().includes(searchLower) || (trx.pelanggan?.nama || 'umum').toLowerCase().includes(searchLower) || (trx.kasir?.nama || '').toLowerCase().includes(searchLower);

      if (!matchSearch) return false;
      if (filterMode === 'semua') return true;
      if (filterMode === 'spesifik' && filterTanggalSpesifik) return trxDate.toISOString().split('T')[0] === filterTanggalSpesifik;
      if (filterMode === 'bulan') return (filterBulan ? (trxDate.getMonth() + 1).toString().padStart(2, '0') === filterBulan : true) && (filterTahun ? trxDate.getFullYear().toString() === filterTahun : true);
      return true;
    });
  }, [initialData, search, filterMode, filterBulan, filterTahun, filterTanggalSpesifik]);

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input type="text" placeholder="Cari ID, Pelanggan, atau Kasir..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:border-[#52796F] transition-colors" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          <div className="relative flex items-center bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg w-full md:w-auto">
            <div className="pl-3 py-2 text-zinc-400 pointer-events-none"><Filter size={14} /></div>
            <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as any)} className="appearance-none w-full py-2 pr-8 pl-2 bg-transparent text-sm font-medium outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <option value="semua">Semua Waktu</option><option value="bulan">Per Bulan</option><option value="spesifik">Pilih Tanggal</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          {filterMode === 'bulan' && (
            <div className="flex items-center gap-2 w-full md:w-auto animate-in fade-in duration-300">
              <div className="relative flex-1 md:w-auto">
                <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="appearance-none w-full py-2 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none focus:border-[#52796F] cursor-pointer">
                  <option value="">Bulan</option><option value="01">Jan</option><option value="02">Feb</option><option value="03">Mar</option><option value="04">Apr</option><option value="05">Mei</option><option value="06">Jun</option><option value="07">Jul</option><option value="08">Agu</option><option value="09">Sep</option><option value="10">Okt</option><option value="11">Nov</option><option value="12">Des</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
              <div className="relative flex-1 md:w-auto">
                <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="appearance-none w-full py-2 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none focus:border-[#52796F] cursor-pointer">
                  <option value="">Tahun</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          )}

          {filterMode === 'spesifik' && (
            <div className="w-full md:w-auto animate-in fade-in duration-300">
              <input type="date" value={filterTanggalSpesifik} onChange={(e) => setFilterTanggalSpesifik(e.target.value)} className="w-full py-2 pl-3 pr-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none focus:border-[#52796F] cursor-pointer dark:[color-scheme:dark]" />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400 min-w-[700px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 uppercase font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">ID Transaksi</th>
                <th className="px-6 py-4 whitespace-nowrap">Waktu</th>
                <th className="px-6 py-4 whitespace-nowrap">Pelanggan</th>
                <th className="px-6 py-4 whitespace-nowrap">Kasir</th>
                <th className="px-6 py-4 whitespace-nowrap">Jumlah</th>
                <th className="px-6 py-4 whitespace-nowrap">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredData.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-500">Data tidak ditemukan.</td></tr>
              ) : (
                filteredData.map((trx) => (
                  <tr key={trx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">{trx.id.slice(-8).toUpperCase()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5"><Calendar size={12} className="text-zinc-400" />{new Date(trx.tanggalTransaksi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-medium text-zinc-900 dark:text-zinc-100">{trx.pelanggan?.nama || 'Umum'}</span> 
                      <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 ml-1.5 rounded uppercase font-semibold tracking-wide border border-zinc-200 dark:border-zinc-700/50">{trx.pelanggan?.kategori || 'NON'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-500">{trx.kasir?.nama || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">{trx.jumlahTabung} Tabung</td>
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#52796F]">Rp {trx.totalHarga.toLocaleString('id-ID')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
