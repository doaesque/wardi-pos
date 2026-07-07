'use client';

import { useState, useMemo } from 'react';
import { Search, Filter, Calendar, ChevronDown, Download, FileText, FileSpreadsheet, File as FileIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// define types with 3nf relation structures
type Transaksi = { 
  id: string; 
  tanggalTransaksi: Date; 
  jumlahTabung: number; 
  totalHarga: number; 
  status: { namaStatus: string }; 
  pelanggan: { nama: string; kategori?: { namaKategori: string } } | null; 
};

export function TransaksiClient({ initialData }: { initialData: any[] }) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'semua' | 'bulan' | 'spesifik'>('semua');
  const [exportDropdown, setExportDropdown] = useState(false);
  
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
      const matchSearch = trx.id.toLowerCase().includes(searchLower) || (trx.pelanggan?.nama || 'umum').toLowerCase().includes(searchLower);

      if (!matchSearch) return false;
      if (filterMode === 'semua') return true;
      if (filterMode === 'spesifik' && filterTanggalSpesifik) return trxDate.toISOString().split('T')[0] === filterTanggalSpesifik;
      if (filterMode === 'bulan') return (filterBulan ? (trxDate.getMonth() + 1).toString().padStart(2, '0') === filterBulan : true) && (filterTahun ? trxDate.getFullYear().toString() === filterTahun : true);
      return true;
    });
  }, [initialData, search, filterMode, filterBulan, filterTahun, filterTanggalSpesifik]);

  const totalTabungFiltered = filteredData.reduce((acc, trx) => acc + trx.jumlahTabung, 0);
  const totalUangFiltered = filteredData.reduce((acc, trx) => acc + trx.totalHarga, 0);

  const handleExportCSV = () => {
    const headers = ['ID Transaksi', 'Tanggal', 'Waktu', 'Nama Pelanggan', 'Kategori', 'Metode Pembayaran', 'Jumlah Tabung', 'Total Harga'];
    
    const rows = filteredData.map(trx => {
      const date = new Date(trx.tanggalTransaksi);
      return [
        trx.id,
        date.toLocaleDateString('id-ID'),
        date.toLocaleTimeString('id-ID'),
        `"${trx.pelanggan?.nama || 'Umum'}"`,
        trx.pelanggan?.kategori?.namaKategori || '-',
        trx.status.namaStatus,
        trx.jumlahTabung,
        trx.totalHarga
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Riwayat_Transaksi_WardiPOS_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportDropdown(false);
  };

  const handleExportXLSX = () => {
    const headers = ['ID Transaksi', 'Tanggal', 'Waktu', 'Nama Pelanggan', 'Kategori', 'Metode Pembayaran', 'Jumlah Tabung', 'Total Harga'];
    
    const rows = filteredData.map(trx => {
      const date = new Date(trx.tanggalTransaksi);
      return [
        trx.id,
        date.toLocaleDateString('id-ID'),
        date.toLocaleTimeString('id-ID'),
        trx.pelanggan?.nama || 'Umum',
        trx.pelanggan?.kategori?.namaKategori || '-',
        trx.status.namaStatus,
        trx.jumlahTabung,
        trx.totalHarga
      ];
    });

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");
    XLSX.writeFile(workbook, `Riwayat_Transaksi_WardiPOS_${new Date().getTime()}.xlsx`);
    setExportDropdown(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(14);
    doc.text('Riwayat Transaksi WardiPOS', 14, 15);
    doc.setFontSize(10);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [['ID Transaksi', 'Waktu', 'Pelanggan', 'Metode', 'Jumlah', 'Total (Rp)']],
      body: filteredData.map(trx => {
        const date = new Date(trx.tanggalTransaksi);
        return [
          trx.id.slice(-8).toUpperCase(),
          `${date.toLocaleDateString('id-ID')} ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
          trx.pelanggan?.nama || 'Umum',
          trx.status.namaStatus,
          `${trx.jumlahTabung} Tbg`,
          trx.totalHarga.toLocaleString('id-ID')
        ];
      }),
      theme: 'grid',
      headStyles: { fillColor: [82, 121, 111] },
      styles: { fontSize: 8 }
    });

    doc.save(`Riwayat_Transaksi_WardiPOS_${new Date().getTime()}.pdf`);
    setExportDropdown(false);
  };

  return (
    <div className="space-y-4 pt-14 md:pt-0">
      
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">Riwayat Transaksi</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <p className="text-sm text-zinc-500 font-medium mb-1">Total Tabung Terjual</p>
          <h4 className="text-2xl font-bold text-zinc-900 dark:text-white">{totalTabungFiltered.toLocaleString('id-ID')} <span className="text-sm font-normal text-zinc-500">Tbg</span></h4>
        </div>
        <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <p className="text-sm text-zinc-500 font-medium mb-1">Total Pemasukan</p>
          <h4 className="text-2xl font-bold text-[#52796F]">Rp {totalUangFiltered.toLocaleString('id-ID')}</h4>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-950 p-3 md:p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <input type="text" placeholder="Ketik ID atau nama pelanggan..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:border-[#52796F] transition-colors" />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          
          <div className="relative w-full md:w-auto">
            <button onClick={() => setExportDropdown(!exportDropdown)} className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors w-full md:w-auto">
               <Download size={14} />
               <span>Unduh Laporan</span>
               <ChevronDown size={14} />
            </button>
            
            {exportDropdown && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <button onClick={handleExportCSV} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300">
                  <FileIcon size={14} className="text-zinc-400" /> Format CSV
                </button>
                <button onClick={handleExportXLSX} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300 border-t border-zinc-100 dark:border-zinc-800">
                  <FileSpreadsheet size={14} className="text-[#52796F]" /> Format Excel
                </button>
                <button onClick={handleExportPDF} className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-700 dark:text-zinc-300 border-t border-zinc-100 dark:border-zinc-800">
                  <FileText size={14} className="text-red-500" /> Format PDF
                </button>
              </div>
            )}
          </div>

          <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg w-full md:w-auto">
            <div className="pl-3 py-2 text-zinc-400 pointer-events-none"><Filter size={14} /></div>
            <select value={filterMode} onChange={(e) => setFilterMode(e.target.value as any)} className="appearance-none w-full py-2 pr-8 pl-2 bg-transparent text-sm font-medium outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <option value="semua">Semua Waktu</option><option value="bulan">Per Bulan</option><option value="spesifik">Pilih Tanggal</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
          </div>

          {filterMode === 'bulan' && (
            <div className="flex items-center gap-2 w-full md:w-auto animate-in fade-in duration-300">
              <div className="relative flex-1 md:w-auto">
                <select value={filterBulan} onChange={(e) => setFilterBulan(e.target.value)} className="appearance-none w-full py-2 pl-3 pr-8 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none focus:border-[#52796F] cursor-pointer text-zinc-700 dark:text-zinc-300">
                  <option value="">Bulan</option><option value="01">Jan</option><option value="02">Feb</option><option value="03">Mar</option><option value="04">Apr</option><option value="05">Mei</option><option value="06">Jun</option><option value="07">Jul</option><option value="08">Agu</option><option value="09">Sep</option><option value="10">Okt</option><option value="11">Nov</option><option value="12">Des</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
              <div className="relative flex-1 md:w-auto">
                <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)} className="appearance-none w-full py-2 pl-3 pr-8 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none focus:border-[#52796F] cursor-pointer text-zinc-700 dark:text-zinc-300">
                  <option value="">Tahun</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          )}

          {filterMode === 'spesifik' && (
            <div className="w-full md:w-auto animate-in fade-in duration-300">
              <input type="date" value={filterTanggalSpesifik} onChange={(e) => setFilterTanggalSpesifik(e.target.value)} className="w-full py-2 pl-3 pr-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none focus:border-[#52796F] cursor-pointer text-zinc-700 dark:text-zinc-300 dark:[color-scheme:dark]" />
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400 min-w-[700px]">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold border-b border-zinc-200 dark:border-zinc-800 select-none">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap">ID Transaksi</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Waktu</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Pelanggan</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Jumlah</th>
                <th className="px-5 py-3.5 whitespace-nowrap">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {filteredData.length === 0 ? (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-zinc-500">Data transaksi tidak ditemukan.</td></tr>
              ) : (
                filteredData.map((trx) => (
                  <tr key={trx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-5 py-3 whitespace-nowrap font-mono text-xs">{trx.id.slice(-8).toUpperCase()}</td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5"><Calendar size={14} className="text-zinc-400" />{new Date(trx.tanggalTransaksi).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{trx.pelanggan?.nama || 'Umum'}</div> 
                      <div className="text-xs text-zinc-500 mt-0.5">{trx.pelanggan?.kategori?.namaKategori || 'Tanpa Golongan'}</div>
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap font-medium">{trx.jumlahTabung} Tbg</td>
                    <td className="px-5 py-3 whitespace-nowrap font-semibold text-[#52796F]">Rp {trx.totalHarga.toLocaleString('id-ID')}</td>
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
