'use client';

import { useState, useTransition } from 'react';
import { Trash2, UserPlus, Eye, Clock, X, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';
import { addEmployee, deleteEmployee } from '@/app/actions/karyawan';

// define types
type SesiKerja = { id: string; waktuMulai: Date; waktuSelesai: Date | null; };
type Karyawan = { id: string; nama: string; username: string; role: string; _count: { transaksi: number }; sesiKerja: SesiKerja[]; };

export function KaryawanClient({ initialData, currentUser }: { initialData: Karyawan[], currentUser: any }) {
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [detailModal, setDetailModal] = useState<Karyawan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Karyawan | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const executeDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.id === currentUser?.id) { showNotification('Anda tidak dapat menghapus akun Anda sendiri.', 'error'); return; }
    
    startTransition(async () => {
      const res = await deleteEmployee(confirmDelete.id);
      if (res?.error) showNotification(res.error, 'error'); else showNotification('Akun staf berhasil dihapus.', 'success');
      setConfirmDelete(null);
    });
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    startTransition(async () => {
      const res = await addEmployee(new FormData(form));
      if (res?.error) showNotification(res.error, 'error'); else { showNotification('Staf berhasil didaftarkan!', 'success'); form.reset(); }
    });
  };

  const hitungDurasi = (mulai: Date, selesai: Date | null) => {
    if (!selesai) return 'Sedang Aktif';
    const selisihMenit = Math.round((new Date(selesai).getTime() - new Date(mulai).getTime()) / 60000);
    const jam = Math.floor(selisihMenit / 60);
    const menit = selisihMenit % 60;
    return jam > 0 ? `${jam} jam ${menit} menit` : `${menit} menit`;
  };

  return (
    // PERUBAHAN: flex-col-reverse digunakan di sini agar Form di mobile naik ke atas
    <div className="flex flex-col-reverse lg:flex-row gap-8 relative">
      
      {notification && (
        <div className={`fixed top-20 md:top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium w-[90%] md:w-auto transition-all ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-900 dark:text-green-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-900 dark:text-red-300'}`}>
          {notification.type === 'success' ? <CheckCircle size={18} className="shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Bagian Kiri (Tabel) */}
      <div className="flex-1 space-y-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
          {/* PERUBAHAN: overflow-x-auto ditambahkan agar tabel tidak tergencet di HP */}
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400 min-w-[500px]">
              <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 uppercase font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Nama Lengkap</th>
                  <th className="px-6 py-4 whitespace-nowrap">Peran</th>
                  <th className="px-6 py-4 whitespace-nowrap">Transaksi</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {initialData.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500">Belum ada data staf.</td></tr>
                ) : (
                  initialData.map((k) => (
                    <tr key={k.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-900 dark:text-zinc-100">{k.nama} <br/><span className="text-xs text-zinc-400 font-normal">@{k.username}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 text-xs rounded-md font-semibold tracking-wide ${k.role === 'ADMIN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}>{k.role}</span></td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-[#52796F]">{k._count.transaksi}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => setDetailModal(k)} className="text-zinc-400 hover:text-[#52796F] transition-colors p-1" title="Lihat Performa"><Eye size={18} /></button>
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

      {/* Bagian Kanan (Formulir) */}
      <div className="w-full lg:w-80">
        <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm lg:sticky lg:top-8">
          <div className="flex items-center gap-2 mb-6 text-zinc-900 dark:text-white font-semibold">
            <UserPlus size={20} className="text-[#52796F]" />
            <h3>Tambah Staf Baru</h3>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div><label className="block text-xs font-medium text-zinc-500 mb-1">Nama Lengkap</label><input type="text" name="nama" required className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F] transition-colors" /></div>
            <div><label className="block text-xs font-medium text-zinc-500 mb-1">Nama Pengguna (Username)</label><input type="text" name="username" required className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F] transition-colors" /></div>
            <div><label className="block text-xs font-medium text-zinc-500 mb-1">Kata Sandi</label><input type="password" name="password" required className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F] transition-colors" /></div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Peran Akses</label>
              <div className="relative">
                <select name="role" className="appearance-none w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent outline-none focus:border-[#52796F] cursor-pointer transition-colors">
                  <option value="KASIR">Kasir</option><option value="ADMIN">Administrator</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
            <button type="submit" disabled={isPending} className="w-full py-2.5 mt-2 text-sm rounded-lg text-white font-semibold bg-[#52796F] hover:bg-[#43645a] transition duration-200 disabled:opacity-50">
              {isPending ? 'Memproses...' : 'Simpan Karyawan'}
            </button>
          </form>
        </div>
      </div>

      {/* Popups... */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full p-6 text-center shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Hapus Staf?</h3>
            <p className="text-sm text-zinc-500 mb-6">Anda akan menghapus akun <strong>{confirmDelete.nama}</strong>. Staf ini tidak akan bisa login lagi ke sistem.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} disabled={isPending} className="flex-1 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100">Batal</button>
              <button onClick={executeDelete} disabled={isPending} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium">{isPending ? 'Memproses...' : 'Ya, Hapus'}</button>
            </div>
          </div>
        </div>
      )}

      {detailModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
            <div className="p-4 md:p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <div><h3 className="font-bold text-zinc-900 dark:text-white">Riwayat Performa</h3><p className="text-xs text-zinc-500 mt-1">{detailModal.nama} - {detailModal.role}</p></div>
              <button onClick={() => setDetailModal(null)} className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X size={20} /></button>
            </div>
            <div className="p-4 md:p-5">
              <div className="flex items-center gap-2 mb-4 text-[#52796F] font-semibold"><Clock size={16} /><h4>5 Sesi Kerja Terakhir</h4></div>
              <div className="space-y-3">
                {detailModal.sesiKerja.length === 0 ? (
                  <p className="text-sm text-zinc-500 text-center py-6 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-lg">Belum ada riwayat tercatat.</p>
                ) : (
                  detailModal.sesiKerja.map((sesi) => (
                    <div key={sesi.id} className="p-3 md:p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-sm">
                      <div>
                        <p className="text-zinc-900 dark:text-zinc-100 font-medium">Masuk: {new Date(sesi.waktuMulai).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}</p>
                        <p className="text-zinc-500 text-xs mt-1">Keluar: {sesi.waktuSelesai ? new Date(sesi.waktuSelesai).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#52796F] text-xs md:text-sm">{hitungDurasi(sesi.waktuMulai, sesi.waktuSelesai)}</span>
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
