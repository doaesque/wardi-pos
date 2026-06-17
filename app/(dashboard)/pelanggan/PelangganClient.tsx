'use client';

import { useState, useMemo, useTransition } from 'react';
import { Eye, Edit, Trash2, UserPlus, X, Search, CheckCircle, AlertTriangle, ArrowUpDown, Loader2, ChevronDown } from 'lucide-react';
import { addCustomer, deleteCustomer, editCustomer, getDetailRiwayatPelanggan } from '@/app/actions/pelanggan';

// define types
type Pelanggan = { nik: string; nama: string; kategori: string; };

export default function PelangganClient({ initialData }: { initialData: Pelanggan[] }) {
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [filterKategori, setFilterKategori] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Pelanggan; direction: 'asc' | 'desc' } | null>(null);
  const [modal, setModal] = useState<{ type: 'detail' | 'edit' | null, data: Pelanggan | null }>({ type: null, data: null });
  const [confirmDelete, setConfirmDelete] = useState<Pelanggan | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [monthOffset, setMonthOffset] = useState(0);
  const [historyData, setHistoryData] = useState<any>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSort = (key: keyof Pelanggan) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let sortableItems = [...initialData];
    sortableItems = sortableItems.filter((item) => {
      const matchSearch = item.nama.toLowerCase().includes(search.toLowerCase()) || item.nik.includes(search);
      const matchKategori = filterKategori ? item.kategori === filterKategori : true;
      return matchSearch && matchKategori;
    });

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key].toString().toLowerCase();
        const valB = b[sortConfig.key].toString().toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [initialData, search, filterKategori, sortConfig]);

  const executeDelete = () => {
    if (!confirmDelete) return;
    startTransition(async () => {
      const res = await deleteCustomer(confirmDelete.nik);
      if (res?.error) showNotification(res.error, 'error'); else showNotification('Pelanggan berhasil dihapus.', 'success');
      setConfirmDelete(null);
    });
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    startTransition(async () => {
      const res = await addCustomer(new FormData(form));
      if (res?.error) showNotification(res.error, 'error'); else { showNotification('Pelanggan berhasil didaftarkan!', 'success'); form.reset(); }
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await editCustomer(new FormData(e.currentTarget));
      if (res?.error) showNotification(res.error, 'error'); else { showNotification('Pelanggan berhasil diperbarui!', 'success'); setModal({ type: null, data: null }); }
    });
  };

  const openDetail = async (p: Pelanggan) => { setModal({ type: 'detail', data: p }); setMonthOffset(0); fetchHistory(p.nik, 0); };
  const fetchHistory = async (nik: string, offset: number) => {
    setHistoryLoading(true);
    const res = await getDetailRiwayatPelanggan(nik, offset);
    if (res?.success) setHistoryData(res.data);
    setHistoryLoading(false);
  };
  const changeHistoryMonth = (offset: number) => { setMonthOffset(offset); if (modal.data) fetchHistory(modal.data.nik, offset); };

  const getCategoryColor = (kategori: string) => {
    switch(kategori) {
      case 'RT': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'UM': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'PENGECER': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      default: return 'bg-zinc-100 text-zinc-700';
    }
  };

  // custom indonesian validation message
  const handleInvalid = (e: React.InvalidEvent<HTMLInputElement | HTMLSelectElement>) => {
    (e.target as HTMLInputElement).setCustomValidity('Harap isi bidang ini.');
  };
  const handleInput = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement>) => {
    (e.target as HTMLInputElement).setCustomValidity('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start relative">
      {notification && (
        <div className={`fixed top-20 md:top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium w-[90%] md:w-auto transition-all ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-900 dark:text-green-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-900 dark:text-red-300'}`}>
          {notification.type === 'success' ? <CheckCircle size={18} className="shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* left section (table) */}
      <div className="w-full space-y-4">
        <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input type="text" placeholder="Ketik nama atau NIK..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:border-[#52796F] transition-colors" />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <div className="relative w-full md:w-auto">
              <select value={filterKategori} onChange={(e) => setFilterKategori(e.target.value)} className="appearance-none w-full py-2 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none text-zinc-700 dark:text-zinc-300 focus:border-[#52796F] cursor-pointer hover:border-zinc-300 transition-colors">
                <option value="">Semua Kategori</option><option value="RT">Rumah Tangga (RT)</option><option value="UM">Usaha Mikro (UM)</option><option value="PENGECER">Pengecer</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400 min-w-[600px]">
              <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 uppercase font-semibold border-b border-zinc-200 dark:border-zinc-800 select-none">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('nik')}><div className="flex items-center gap-2">NIK <ArrowUpDown size={14} className="text-zinc-400" /></div></th>
                  <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('nama')}><div className="flex items-center gap-2">Nama Lengkap <ArrowUpDown size={14} className="text-zinc-400" /></div></th>
                  <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('kategori')}><div className="flex items-center gap-2">Kategori <ArrowUpDown size={14} className="text-zinc-400" /></div></th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {processedData.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Data tidak ditemukan.</td></tr>
                ) : (
                  processedData.map((p) => (
                    <tr key={p.nik} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs">{p.nik}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">{p.nama}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-[10px] uppercase tracking-wider rounded-md font-semibold ${getCategoryColor(p.kategori)}`}>{p.kategori}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => openDetail(p)} className="text-zinc-400 hover:text-[#52796F] p-1"><Eye size={18} /></button>
                          <button onClick={() => setModal({ type: 'edit', data: p })} className="text-zinc-400 hover:text-amber-500 p-1"><Edit size={18} /></button>
                          <button onClick={() => setConfirmDelete(p)} className="text-zinc-400 hover:text-red-500 p-1"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* right section (form) */}
      <div className="w-full lg:sticky lg:top-8">
        <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-zinc-900 dark:text-white font-semibold">
            <UserPlus size={20} className="text-[#52796F]" />
            <h3>Registrasi Pelanggan</h3>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div><label className="block text-xs font-medium text-zinc-500 mb-1">NIK (16 Digit)</label><input type="text" name="nik" maxLength={16} required onInvalid={handleInvalid} onInput={handleInput} className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F]" /></div>
            <div><label className="block text-xs font-medium text-zinc-500 mb-1">Nama Lengkap</label><input type="text" name="nama" required onInvalid={handleInvalid} onInput={handleInput} className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F]" /></div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Kategori</label>
              <div className="relative">
                <select name="kategori" required onInvalid={handleInvalid} onInput={handleInput} className="appearance-none w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F] cursor-pointer">
                  <option value="RT">Rumah Tangga (RT)</option><option value="UM">Usaha Mikro (UM)</option><option value="PENGECER">Pengecer</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <button type="submit" disabled={isPending} className="w-full py-2.5 mt-2 text-sm rounded-lg text-white font-semibold bg-[#52796F] hover:bg-[#43645a] disabled:opacity-50 transition-colors">
              {isPending ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </form>
        </div>
      </div>

      {/* popups */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full p-6 text-center shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Hapus Pelanggan?</h3>
            <p className="text-sm text-zinc-500 mb-6">Anda akan menghapus data pelanggan <strong>{confirmDelete.nama}</strong>. Data tidak dapat dikembalikan.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} disabled={isPending} className="flex-1 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100">Batal</button>
              <button onClick={executeDelete} disabled={isPending} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium">{isPending ? 'Memproses...' : 'Ya, Hapus'}</button>
            </div>
          </div>
        </div>
      )}

      {modal.type && modal.data && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`bg-white dark:bg-zinc-950 rounded-xl shadow-xl w-full overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200 ${modal.type === 'detail' ? 'max-w-2xl' : 'max-w-sm'}`}>
            <div className="p-4 md:p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <div><h3 className="font-bold text-zinc-900 dark:text-white">{modal.type === 'edit' ? 'Ubah Data' : 'Riwayat Pelanggan'}</h3>{modal.type === 'detail' && <p className="text-xs text-zinc-500 mt-1">{modal.data.nama} - {modal.data.nik}</p>}</div>
              <button onClick={() => setModal({ type: null, data: null })} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X size={20} /></button>
            </div>
            <div className="p-4 md:p-5">
              {modal.type === 'detail' ? (
                <>
                  {historyLoading ? <div className="flex flex-col items-center justify-center py-12 text-zinc-400"><Loader2 className="animate-spin mb-2" size={32} /><p className="text-sm">Memuat data...</p></div> : historyData ? (
                    <div>
                      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
                        <div className="bg-[#52796F]/10 p-3 md:p-4 rounded-lg border border-[#52796F]/20"><p className="text-[10px] md:text-xs text-[#52796F] font-semibold mb-1">Hari Ini</p><p className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">{historyData.totalHariIni} <span className="text-xs md:text-sm font-normal text-zinc-500">Tbg</span></p></div>
                        <div className="bg-[#52796F]/10 p-3 md:p-4 rounded-lg border border-[#52796F]/20"><p className="text-[10px] md:text-xs text-[#52796F] font-semibold mb-1">Minggu Ini</p><p className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">{historyData.totalMingguIni} <span className="text-xs md:text-sm font-normal text-zinc-500">Tbg</span></p></div>
                        <div className="bg-[#52796F]/10 p-3 md:p-4 rounded-lg border border-[#52796F]/20"><p className="text-[10px] md:text-xs text-[#52796F] font-semibold mb-1">Bulan Ini</p><p className="text-xl md:text-2xl font-bold text-zinc-900 dark:text-white">{historyData.totalBulanIni} <span className="text-xs md:text-sm font-normal text-zinc-500">Tbg</span></p></div>
                      </div>
                      <div className="flex justify-between items-center mb-3"><h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Daftar Transaksi</h4><div className="relative"><select value={monthOffset} onChange={(e) => changeHistoryMonth(Number(e.target.value))} className="appearance-none text-xs border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 rounded-md pl-2 pr-7 py-1.5 outline-none text-zinc-700 dark:text-zinc-300 cursor-pointer"><option value={0}>Bulan Ini</option><option value={1}>1 Bulan Lalu</option><option value={2}>2 Bulan Lalu</option></select><ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" /></div></div>
                      <div className="max-h-48 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg custom-scrollbar">
                        <table className="w-full text-left text-xs"><thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-500 sticky top-0 border-b border-zinc-200 dark:border-zinc-800"><tr><th className="px-4 py-2 font-medium">Tanggal</th><th className="px-4 py-2 font-medium">Jumlah</th><th className="px-4 py-2 font-medium hidden md:table-cell">Kasir</th></tr></thead><tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{historyData.listRiwayat.length === 0 ? <tr><td colSpan={3} className="px-4 py-6 text-center text-zinc-500">Tidak ada transaksi di bulan ini.</td></tr> : historyData.listRiwayat.map((trx: any) => (<tr key={trx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50"><td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{new Date(trx.tanggal).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</td><td className="px-4 py-2 font-semibold text-[#52796F]">{trx.jumlah} Tbg</td><td className="px-4 py-2 text-zinc-500 hidden md:table-cell">{trx.kasir}</td></tr>))}</tbody></table>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <form onSubmit={handleEdit} className="space-y-4">
                  <input type="hidden" name="nik" value={modal.data.nik} />
                  <div><label className="block text-xs font-medium text-zinc-500 mb-1">NIK (Paten)</label><input type="text" disabled value={modal.data.nik} className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 cursor-not-allowed outline-none" /></div>
                  <div><label className="block text-xs font-medium text-zinc-500 mb-1">Nama Lengkap</label><input type="text" name="nama" defaultValue={modal.data.nama} required onInvalid={handleInvalid} onInput={handleInput} className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F]" /></div>
                  <div><label className="block text-xs font-medium text-zinc-500 mb-1">Kategori Pelanggan</label><div className="relative"><select name="kategori" defaultValue={modal.data.kategori} required onInvalid={handleInvalid} onInput={handleInput} className="appearance-none w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F] cursor-pointer"><option value="RT">Rumah Tangga (RT)</option><option value="UM">Usaha Mikro (UM)</option><option value="PENGECER">Pengecer</option></select><ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" /></div></div>
                  <button type="submit" disabled={isPending} className="w-full mt-2 py-2.5 text-sm rounded-lg text-white font-semibold bg-[#52796F] hover:bg-[#43645a] disabled:opacity-50">{isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
