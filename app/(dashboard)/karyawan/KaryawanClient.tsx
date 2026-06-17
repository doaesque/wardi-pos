'use client';

import { useState, useMemo, useTransition } from 'react';
import { Trash2, UserPlus, Eye, Clock, X, AlertTriangle, CheckCircle, ChevronDown, Edit, BarChart3, Calendar, Search, ArrowUpDown } from 'lucide-react';
import { addEmployee, deleteEmployee, editEmployee } from '@/app/actions/karyawan';

// define types
type SesiKerja = { id: string; waktuMulai: Date; waktuSelesai: Date | null; _count?: { transaksi: number } };
type JadwalShift = { hari: string; shift: string; };
type Karyawan = { id: string; nama: string; username: string; role: string; _count: { transaksi: number }; sesiKerja: SesiKerja[]; jadwalShift?: JadwalShift[]; };

const HARI_KERJA = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
const SHIFT_KERJA = ['Pagi', 'Siang', 'Sore'];

export default function KaryawanClient({ initialData, currentUser }: { initialData: Karyawan[], currentUser: any }) {
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [detailModal, setDetailModal] = useState<Karyawan | null>(null);
  const [editModal, setEditModal] = useState<Karyawan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Karyawan | null>(null);
  
  // search, filter, and sorting states
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterHari, setFilterHari] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // shift states
  const [jadwalBaru, setJadwalBaru] = useState<JadwalShift[]>([]);
  const [jadwalEdit, setJadwalEdit] = useState<JadwalShift[]>([]);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let result = [...initialData];

    // apply search & filters
    result = result.filter(k => {
      const matchSearch = k.nama.toLowerCase().includes(search.toLowerCase()) || k.username.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole ? k.role === filterRole : true;
      const matchHari = filterHari ? (k.jadwalShift?.some(j => j.hari === filterHari) || false) : true;
      return matchSearch && matchRole && matchHari;
    });

    // apply sorting
    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Karyawan];
        let bValue: any = b[sortConfig.key as keyof Karyawan];
        
        if (sortConfig.key === 'transaksi') {
          aValue = a._count.transaksi;
          bValue = b._count.transaksi;
        }

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [initialData, search, filterRole, filterHari, sortConfig]);

  const executeDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.id === currentUser?.id) { showNotification('Anda tidak dapat menghapus akun Anda sendiri.', 'error'); return; }
    
    startTransition(async () => {
      const res = await deleteEmployee(confirmDelete.id);
      if (res?.error) showNotification(res.error, 'error'); else showNotification('Akun staf berhasil dihapus.', 'success');
      setConfirmDelete(null);
    });
  };

  const toggleShift = (hari: string, shift: string, isEdit: boolean) => {
    const target = isEdit ? jadwalEdit : jadwalBaru;
    const setter = isEdit ? setJadwalEdit : setJadwalBaru;

    const exists = target.find(j => j.hari === hari && j.shift === shift);
    if (exists) {
      setter(target.filter(j => !(j.hari === hari && j.shift === shift)));
    } else {
      setter([...target, { hari, shift }]);
    }
  };

  const openEdit = (k: Karyawan) => {
    setEditModal(k);
    setJadwalEdit(k.jadwalShift || []);
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.append('jadwal', JSON.stringify(jadwalBaru));

    startTransition(async () => {
      const res = await addEmployee(formData);
      if (res?.error) showNotification(res.error, 'error'); else { showNotification('Staf berhasil didaftarkan!', 'success'); form.reset(); setJadwalBaru([]); }
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('jadwal', JSON.stringify(jadwalEdit));

    startTransition(async () => {
      const res = await editEmployee(formData);
      if (res?.error) showNotification(res.error, 'error'); else { showNotification('Data staf berhasil diperbarui!', 'success'); setEditModal(null); }
    });
  };

  const hitungDurasi = (mulai: Date, selesai: Date | null) => {
    if (!selesai) return 'Aktif';
    const selisihMenit = Math.round((new Date(selesai).getTime() - new Date(mulai).getTime()) / 60000);
    const jam = Math.floor(selisihMenit / 60);
    const menit = selisihMenit % 60;
    return jam > 0 ? `${jam}j ${menit}m` : `${menit}m`;
  };

  const getMockMetrics = (sesiList: SesiKerja[]) => {
    let sumMinutes = 0;
    sesiList.forEach(s => {
      if (s.waktuSelesai) {
        sumMinutes += Math.round((new Date(s.waktuSelesai).getTime() - new Date(s.waktuMulai).getTime()) / 60000);
      }
    });
    
    const hariIni = sesiList.length > 0 ? '7j 45m' : '0j 0m';
    const mingguIni = sumMinutes > 0 ? `${Math.floor(sumMinutes / 60)}j ${sumMinutes % 60}m` : '0j 0m';
    const lembur = sesiList.length > 3 ? '4j 30m' : '0j 0m';
    const rasio = sesiList.length > 0 ? '94%' : '0%';
    
    return { hariIni, mingguIni, lembur, rasio };
  };

  // helper function to merge shift hours
  const formatShiftHours = (shifts: string[]) => {
    const SHIFT_HOURS: Record<string, [number, number]> = {
      'Pagi': [8, 12],
      'Siang': [12, 16],
      'Sore': [16, 20]
    };

    if (!shifts || shifts.length === 0) return '-';

    const sorted = shifts
      .map(s => SHIFT_HOURS[s])
      .filter(Boolean)
      .sort((a, b) => a[0] - b[0]);

    if (sorted.length === 0) return '-';

    const merged = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
      const last = merged[merged.length - 1];
      const current = sorted[i];
      if (last[1] >= current[0]) {
        last[1] = Math.max(last[1], current[1]);
      } else {
        merged.push(current);
      }
    }

    return merged.map(m => `${m[0].toString().padStart(2, '0')}:00 - ${m[1].toString().padStart(2, '0')}:00`).join(', ');
  };

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

      {/* left section (table & filters) */}
      <div className="w-full space-y-4">
        
        {/* search & filters bar */}
        <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <input type="text" placeholder="Cari nama atau username..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:border-[#52796F] transition-colors" />
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <div className="relative w-full md:w-auto">
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="appearance-none w-full py-2 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none text-zinc-700 dark:text-zinc-300 focus:border-[#52796F] cursor-pointer hover:border-zinc-300 transition-colors">
                <option value="">Semua Peran</option><option value="KASIR">Kasir</option><option value="ADMIN">Administrator</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
            <div className="relative w-full md:w-auto">
              <select value={filterHari} onChange={(e) => setFilterHari(e.target.value)} className="appearance-none w-full py-2 pl-3 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm font-medium outline-none text-zinc-700 dark:text-zinc-300 focus:border-[#52796F] cursor-pointer hover:border-zinc-300 transition-colors">
                <option value="">Semua Jadwal</option>
                {HARI_KERJA.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400 min-w-[500px]">
              <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 uppercase font-semibold border-b border-zinc-200 dark:border-zinc-800 select-none">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('nama')}><div className="flex items-center gap-2">Nama Lengkap <ArrowUpDown size={14} className="text-zinc-400" /></div></th>
                  <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('role')}><div className="flex items-center gap-2">Peran <ArrowUpDown size={14} className="text-zinc-400" /></div></th>
                  <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('transaksi')}><div className="flex items-center gap-2">Transaksi <ArrowUpDown size={14} className="text-zinc-400" /></div></th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {processedData.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Data tidak ditemukan.</td></tr>
                ) : (
                  processedData.map((k) => (
                    <tr key={k.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">{k.nama} <br/><span className="text-xs text-zinc-400 font-normal">@{k.username}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded-md font-semibold tracking-wide ${k.role === 'ADMIN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}>{k.role}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#52796F]">{k._count.transaksi}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setDetailModal(k)} className="text-zinc-400 hover:text-[#52796F] transition-colors p-1" title="Lihat Performa"><Eye size={18} /></button>
                          <button onClick={() => openEdit(k)} className="text-zinc-400 hover:text-amber-500 transition-colors p-1" title="Ubah Data"><Edit size={18} /></button>
                          <button onClick={() => setConfirmDelete(k)} className={`p-1 transition-colors ${k.id === currentUser?.id ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-red-500'}`} title={k.id === currentUser?.id ? "Ini Akun Anda" : "Hapus Karyawan"} disabled={k.id === currentUser?.id}><Trash2 size={18} /></button>
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

      {/* right section (form) - with self-start so it doesn't stretch and sticky works */}
      <div className="w-full lg:sticky lg:top-8 self-start">
        <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-zinc-900 dark:text-white font-semibold">
            <UserPlus size={20} className="text-[#52796F]" />
            <h3>Tambah Staf Baru</h3>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div><label className="block text-xs font-medium text-zinc-500 mb-1">Nama Lengkap</label><input type="text" name="nama" required onInvalid={handleInvalid} onInput={handleInput} className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F] transition-colors" /></div>
            <div><label className="block text-xs font-medium text-zinc-500 mb-1">Nama Pengguna (Username)</label><input type="text" name="username" required onInvalid={handleInvalid} onInput={handleInput} className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F] transition-colors" /></div>
            <div><label className="block text-xs font-medium text-zinc-500 mb-1">Kata Sandi</label><input type="password" name="password" required onInvalid={handleInvalid} onInput={handleInput} className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F] transition-colors" /></div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Peran Akses</label>
              <div className="relative">
                <select name="role" required onInvalid={handleInvalid} onInput={handleInput} className="appearance-none w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F] cursor-pointer transition-colors">
                  <option value="KASIR">Kasir</option><option value="ADMIN">Administrator</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            
            {/* shift table selector */}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-2">Jadwal Shift (Senin - Jumat)</label>
              <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-center">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                    <tr>
                      <th className="py-2 px-2 font-medium text-zinc-500 text-left">Hari</th>
                      <th className="py-2 px-2 font-medium text-zinc-500">Pagi</th>
                      <th className="py-2 px-2 font-medium text-zinc-500">Siang</th>
                      <th className="py-2 px-2 font-medium text-zinc-500">Sore</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {HARI_KERJA.map(hari => (
                      <tr key={hari} className="bg-white dark:bg-zinc-950">
                        <td className="py-1.5 px-2 font-medium text-zinc-700 dark:text-zinc-300 text-left">{hari}</td>
                        {SHIFT_KERJA.map(shift => (
                          <td key={shift} className="py-1.5 px-2">
                            <input type="checkbox" checked={jadwalBaru.some(j => j.hari === hari && j.shift === shift)} onChange={() => toggleShift(hari, shift, false)} className="cursor-pointer accent-[#52796F]" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button type="submit" disabled={isPending} className="w-full py-2.5 mt-2 text-sm rounded-lg text-white font-semibold bg-[#52796F] hover:bg-[#43645a] transition duration-200 disabled:opacity-50">
              {isPending ? 'Memproses...' : 'Simpan Karyawan'}
            </button>
          </form>
        </div>
      </div>

      {/* popups */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full p-6 text-center shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Hapus Staf?</h3>
            <p className="text-sm text-zinc-500 mb-6">Anda akan menghapus akun <strong>{confirmDelete.nama}</strong>. Data transaksi terkait akan ikut terhapus.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} disabled={isPending} className="flex-1 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100">Batal</button>
              <button onClick={executeDelete} disabled={isPending} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium">{isPending ? 'Memproses...' : 'Ya, Hapus'}</button>
            </div>
          </div>
        </div>
      )}

      {/* edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-4 md:p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 sticky top-0 z-10">
              <div><h3 className="font-bold text-zinc-900 dark:text-white">Ubah Data Staf</h3></div>
              <button onClick={() => setEditModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X size={20} /></button>
            </div>
            <div className="p-4 md:p-5">
              <form onSubmit={handleEdit} className="space-y-4">
                <input type="hidden" name="id" value={editModal.id} />
                <div><label className="block text-xs font-medium text-zinc-500 mb-1">Nama Lengkap</label><input type="text" name="nama" defaultValue={editModal.nama} required onInvalid={handleInvalid} onInput={handleInput} className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F]" /></div>
                <div><label className="block text-xs font-medium text-zinc-500 mb-1">Nama Pengguna (Username)</label><input type="text" name="username" defaultValue={editModal.username} required onInvalid={handleInvalid} onInput={handleInput} className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F]" /></div>
                <div><label className="block text-xs font-medium text-zinc-500 mb-1">Kata Sandi Baru (Opsional)</label><input type="password" name="password" placeholder="Kosongkan jika tidak ingin diubah" className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F]" /></div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-1">Peran Akses</label>
                  <div className="relative">
                    <select name="role" defaultValue={editModal.role} required onInvalid={handleInvalid} onInput={handleInput} className="appearance-none w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F] cursor-pointer">
                      <option value="KASIR">Kasir</option><option value="ADMIN">Administrator</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                {/* shift table selector for edit */}
                <div>
                  <label className="block text-xs font-medium text-zinc-500 mb-2">Jadwal Shift (Senin - Jumat)</label>
                  <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-center">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
                        <tr>
                          <th className="py-2 px-2 font-medium text-zinc-500 text-left">Hari</th>
                          <th className="py-2 px-2 font-medium text-zinc-500">Pagi</th>
                          <th className="py-2 px-2 font-medium text-zinc-500">Siang</th>
                          <th className="py-2 px-2 font-medium text-zinc-500">Sore</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {HARI_KERJA.map(hari => (
                          <tr key={hari} className="bg-white dark:bg-zinc-950">
                            <td className="py-1.5 px-2 font-medium text-zinc-700 dark:text-zinc-300 text-left">{hari}</td>
                            {SHIFT_KERJA.map(shift => (
                              <td key={shift} className="py-1.5 px-2">
                                <input type="checkbox" checked={jadwalEdit.some(j => j.hari === hari && j.shift === shift)} onChange={() => toggleShift(hari, shift, true)} className="cursor-pointer accent-[#52796F]" />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <button type="submit" disabled={isPending} className="w-full mt-2 py-2.5 text-sm rounded-lg text-white font-semibold bg-[#52796F] hover:bg-[#43645a] disabled:opacity-50">{isPending ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* performance dashboard modal */}
      {detailModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
            <div className="p-4 md:p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
              <div><h3 className="font-bold text-zinc-900 dark:text-white">Statistik Performa</h3><p className="text-xs text-zinc-500 mt-1">{detailModal.nama} - {detailModal.role}</p></div>
              <button onClick={() => setDetailModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X size={20} /></button>
            </div>
            
            <div className="p-4 md:p-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              
              <div className="flex items-center gap-2 mb-3 text-[#52796F] font-semibold text-sm"><BarChart3 size={16} /><h4>Metrik Kehadiran</h4></div>
              
              {/* simulated performance stats grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-center flex flex-col justify-center">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mb-1">Hari Ini</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{getMockMetrics(detailModal.sesiKerja).hariIni}</p>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-center flex flex-col justify-center">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide mb-1">Minggu Ini</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{getMockMetrics(detailModal.sesiKerja).mingguIni}</p>
                </div>
                <div className="p-3 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg text-center flex flex-col justify-center">
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide mb-1">Lembur</p>
                  <p className="text-sm font-bold text-red-600 dark:text-red-400">{getMockMetrics(detailModal.sesiKerja).lembur}</p>
                </div>
                <div className="p-3 bg-[#52796F]/10 border border-[#52796F]/20 rounded-lg text-center flex flex-col justify-center">
                  <p className="text-[10px] text-[#52796F] font-bold uppercase tracking-wide mb-1">Tepat Waktu</p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{getMockMetrics(detailModal.sesiKerja).rasio}</p>
                </div>
              </div>

              {/* registered schedule - converted to table with hours */}
              <div className="flex items-center gap-2 mb-3 text-zinc-900 dark:text-white font-semibold text-sm mt-6"><Calendar size={16} /><h4>Jadwal Tersimpan</h4></div>
              
              {(!detailModal.jadwalShift || detailModal.jadwalShift.length === 0) ? (
                <p className="text-sm text-zinc-500 mb-6 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg py-4 text-center">Belum ada jadwal tersimpan.</p>
              ) : (
                <div className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700 text-zinc-500">
                      <tr>
                        <th className="py-2 px-3 font-medium w-1/3">Hari</th>
                        <th className="py-2 px-3 font-medium">Jam Kerja</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {HARI_KERJA.map(hari => {
                        const shifts = detailModal.jadwalShift?.filter(j => j.hari === hari).map(j => j.shift) || [];
                        if (shifts.length === 0) return null;
                        return (
                          <tr key={hari} className="bg-white dark:bg-zinc-950">
                            <td className="py-2 px-3 font-medium text-zinc-700 dark:text-zinc-300">{hari}</td>
                            <td className="py-2 px-3 text-zinc-600 dark:text-zinc-400 font-medium">
                              {formatShiftHours(shifts)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3 text-zinc-900 dark:text-white font-semibold text-sm mt-6"><Clock size={16} /><h4>Riwayat Sesi Log</h4></div>
              
              {/* compact session list */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {detailModal.sesiKerja.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-6 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg">Belum ada sesi tercatat.</p>
                ) : (
                  detailModal.sesiKerja.map((sesi) => (
                    <div key={sesi.id} className="p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 flex justify-between items-center relative overflow-hidden text-sm">
                      {!sesi.waktuSelesai && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500"></div>}
                      
                      <div className="pl-2">
                        <p className="font-medium text-zinc-900 dark:text-white">{new Date(sesi.waktuMulai).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                          <span>{new Date(sesi.waktuMulai).toLocaleTimeString('id-ID', { timeStyle: 'short' })}</span>
                          <span>-</span>
                          <span className={!sesi.waktuSelesai ? 'text-green-600 font-medium' : ''}>{sesi.waktuSelesai ? new Date(sesi.waktuSelesai).toLocaleTimeString('id-ID', { timeStyle: 'short' }) : 'Sekarang'}</span>
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col items-end">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm ${!sesi.waktuSelesai ? 'text-green-600 dark:text-green-500' : 'text-zinc-700 dark:text-zinc-300'}`}>{hitungDurasi(sesi.waktuMulai, sesi.waktuSelesai)}</span>
                        {sesi._count && sesi._count.transaksi !== undefined && (
                          <p className="text-[10px] text-zinc-500 mt-1 font-medium tracking-wide">{sesi._count.transaksi} trx</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
