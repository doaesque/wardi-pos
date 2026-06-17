'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';

// define types
type Transaksi = {
  id: string;
  tanggalTransaksi: Date;
  jumlahTabung: number;
  totalHarga: number;
  metodePembayaran: string;
  pelanggan: { nama: string; kategori: string } | null;
  kasir: { nama: string } | null;
};

export function TransaksiClient({ initialData }: { initialData: any[] }) {
  const [search, setSearch] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [filterTahun, setFilterTahun] = useState('');

  // calculate current year for dropdown
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

  // filter logic
  const filteredData = useMemo(() => {
    return initialData.filter((trx: Transaksi) => {
      const trxDate = new Date(trx.tanggalTransaksi);
      const trxDay = trxDate.getDate().toString().padStart(2, '0');
      const trxMonth = (trxDate.getMonth() + 1).toString().padStart(2, '0');
      const trxYear = trxDate.getFullYear().toString();

      // date filters
      const matchTanggal = filterTanggal ? trxDay === filterTanggal : true;
      const matchBulan = filterBulan ? trxMonth === filterBulan : true;
      const matchTahun = filterTahun ? trxYear === filterTahun : true;

      // search filter (id, customer name, cashier name)
      const searchLower = search.toLowerCase();
      const matchSearch = 
        trx.id.toLowerCase().includes(searchLower) ||
        (trx.pelanggan?.nama || 'umum').toLowerCase().includes(searchLower) ||
        (trx.kasir?.nama || '').toLowerCase().includes(searchLower);

      return matchTanggal && matchBulan && matchTahun && matchSearch;
    });
  }, [initialData, search, filterTanggal, filterBulan, filterTahun]);

  return (
    <div className="space-y-4">
      {/* filter controls */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        
        {/* search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari ID, Pelanggan, atau Kasir..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:border-[#52796F] text-sm"
          />
        </div>

        {/* date filters */}
        <div className="flex gap-2">
          <select value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:border-[#52796F] text-sm">
            <option value="">Tanggal</option>
            {Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0')).map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:border-[#52796F] text-sm">
            <option value="">Bulan</option>
            {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="px-3 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:border-[#52796F] text-sm">
            <option value="">Tahun</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>

          {/* reset button */}
          <button 
            onClick={() => {setSearch(''); setFilterTanggal(''); setFilterBulan(''); setFilterTahun('');}}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-md text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
          >
            Bersihkan
          </button>
        </div>
      </div>

      {/* transaction table */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 uppercase font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">ID Transaksi</th>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Kasir</th>
                <th className="px-6 py-4">Jumlah</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                    Data transaksi tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredData.map((trx) => (
                  <tr key={trx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {trx.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(trx.tanggalTransaksi).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {trx.pelanggan?.nama || 'Umum'} <br/>
                      <span className="text-xs text-zinc-400">{trx.pelanggan?.kategori}</span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {trx.kasir?.nama || '-'}
                    </td>
                    <td className="px-6 py-4">{trx.jumlahTabung} Tabung</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-[10px] uppercase tracking-wider rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {trx.metodePembayaran}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#52796F]">
                      Rp {trx.totalHarga.toLocaleString('id-ID')}
                    </td>
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
