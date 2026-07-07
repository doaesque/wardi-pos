'use client';

import { useState, useMemo, useTransition } from 'react';
import { Trash2, UserPlus, X, AlertTriangle, CheckCircle, ChevronDown, Edit, Search, ArrowUpDown } from 'lucide-react';
import { addEmployee, deleteEmployee, editEmployee } from '@/app/actions/karyawan';

// define types
type Karyawan = { id: string; nama: string; username: string; role: string; };

export default function KaryawanClient({ initialData, currentUser }: { initialData: Karyawan[], currentUser: any }) {
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [editModal, setEditModal] = useState<Karyawan | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Karyawan | null>(null);
  
  // search, filter, and sorting states
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

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
      return matchSearch && matchRole;
    });

    // apply sorting
    if (sortConfig !== null) {
      result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Karyawan];
        let bValue: any = b[sortConfig.key as keyof Karyawan];

        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [initialData, search, filterRole, sortConfig]);

  const executeDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.id === currentUser?.id) { showNotification('Anda tidak dapat menghapus akun Anda sendiri.', 'error'); return; }
    
    startTransition(async () => {
      const res = await deleteEmployee(confirmDelete.id);
      if (res?.error) showNotification(res.error, 'error'); else showNotification('Akun staf berhasil dihapus.', 'success');
      setConfirmDelete(null);
    });
  };

  const openEdit = (k: Karyawan) => {
    setEditModal(k);
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await addEmployee(formData);
      if (res?.error) showNotification(res.error, 'error'); else { showNotification('Staf berhasil didaftarkan.', 'success'); form.reset(); }
    });
  };

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await editEmployee(formData);
      if (res?.error) showNotification(res.error, 'error'); else { showNotification('Data staf berhasil diperbarui.', 'success'); setEditModal(null); }
    });
  };

  const handleInvalid = (e: React.InvalidEvent<HTMLInputElement | HTMLSelectElement>) => {
    (e.target as HTMLInputElement).setCustomValidity('Harap isi bidang ini.');
  };
  const handleInput = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement>) => {
    (e.target as HTMLInputElement).setCustomValidity('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start relative pt-16 md:pt-0">
      
      {/* alert notification */}
      {notification && (
        <div className={`fixed top-20 md:top-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium w-[90%] md:w-auto transition-all ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'}`}>
          {notification.type === 'success' ? <CheckCircle size={20} className="shrink-0" /> : <AlertTriangle size={20} className="shrink-0" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* left section (table & filters) */}
      <div className="w-full space-y-4">
        
        {/* search & filters bar */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input type="text" placeholder="Cari nama atau username..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-zinc-300 bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-700 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#52796F] focus:bg-white transition-colors" />
          </div>
          <div className="w-full md:w-48">
            <div className="relative">
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="appearance-none w-full py-2.5 pl-3 pr-8 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-medium outline-none text-zinc-700 dark:text-zinc-300 focus:border-[#52796F] cursor-pointer transition-colors">
                <option value="">Semua Peran</option><option value="KASIR">Kasir</option><option value="ADMIN">Administrator</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* table container */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-700 dark:text-zinc-300 min-w-[500px]">
              <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-semibold border-b border-zinc-200 dark:border-zinc-800 select-none">
                <tr>
                  <th className="px-5 py-3.5 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('nama')}><div className="flex items-center gap-2">Nama Lengkap <ArrowUpDown size={14} className="text-zinc-400" /></div></th>
                  <th className="px-5 py-3.5 whitespace-nowrap cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => handleSort('role')}><div className="flex items-center gap-2">Peran Akses <ArrowUpDown size={14} className="text-zinc-400" /></div></th>
                  <th className="px-5 py-3.5 whitespace-nowrap text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                {processedData.length === 0 ? (
                  <tr><td colSpan={3} className="px-5 py-8 text-center text-zinc-500">Data staf tidak ditemukan.</td></tr>
                ) : (
                  processedData.map((k) => (
                    <tr key={k.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">{k.nama}</div>
                        <div className="text-xs text-zinc-500 mt-0.5">@{k.username}</div>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs rounded border ${k.role === 'ADMIN' ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800' : 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'}`}>
                          {k.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(k)} className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded transition-colors" title="Ubah Data"><Edit size={18} /></button>
                          <button onClick={() => setConfirmDelete(k)} className={`p-1.5 rounded transition-colors ${k.id === currentUser?.id ? 'text-zinc-300 dark:text-zinc-700 cursor-not-allowed' : 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30'}`} title={k.id === currentUser?.id ? "Ini Akun Anda" : "Hapus Karyawan"} disabled={k.id === currentUser?.id}><Trash2 size={18} /></button>
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

      {/* right section (form) - sticky registration form */}
      <div className="w-full lg:sticky lg:top-6 self-start">
        <div className="p-5 md:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
          <div className="flex items-center gap-2 mb-5 text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <UserPlus size={20} className="text-[#52796F]" />
            <h3 className="text-base font-semibold">Tambah Staf Baru</h3>
          </div>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nama Lengkap</label>
              <input type="text" name="nama" required onInvalid={handleInvalid} onInput={handleInput} className="w-full px-3 py-2.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-[#52796F] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nama Pengguna (Username)</label>
              <input type="text" name="username" required onInvalid={handleInvalid} onInput={handleInput} className="w-full px-3 py-2.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-[#52796F] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Kata Sandi</label>
              <input type="password" name="password" required onInvalid={handleInvalid} onInput={handleInput} className="w-full px-3 py-2.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-[#52796F] focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Peran Akses</label>
              <div className="relative">
                <select name="role" required onInvalid={handleInvalid} onInput={handleInput} className="appearance-none w-full px-3 py-2.5 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-[#52796F] focus:bg-white cursor-pointer transition-colors">
                  <option value="KASIR">Kasir</option><option value="ADMIN">Administrator</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              </div>
            </div>

            <button type="submit" disabled={isPending} className="w-full py-2.5 mt-2 text-sm rounded-lg text-white font-medium bg-[#52796F] hover:bg-[#43645a] transition duration-200 disabled:opacity-50 shadow-sm">
              {isPending ? 'Memproses...' : 'Simpan Karyawan'}
            </button>
          </form>
        </div>
      </div>

      {/* delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full p-6 text-center shadow-xl border border-zinc-200 dark:border-zinc-800">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-2">Hapus Akun Staf?</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">Anda akan menghapus akun <strong>{confirmDelete.nama}</strong>. Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} disabled={isPending} className="flex-1 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800">Batal</button>
              <button onClick={executeDelete} disabled={isPending} className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium">{isPending ? 'Memproses...' : 'Hapus'}</button>
            </div>
          </div>
        </div>
      )}

      {/* edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-zinc-200 dark:border-zinc-800 my-8">
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 sticky top-0 z-10">
              <h3 className="font-bold text-zinc-900 dark:text-white">Ubah Data Staf</h3>
              <button onClick={() => setEditModal(null)} className="p-1 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-md transition-colors"><X size={20} /></button>
            </div>
            <div className="p-5">
              <form onSubmit={handleEdit} className="space-y-4">
                <input type="hidden" name="id" value={editModal.id} />
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nama Lengkap</label>
                  <input type="text" name="nama" defaultValue={editModal.nama} required onInvalid={handleInvalid} onInput={handleInput} className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-[#52796F]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Nama Pengguna (Username)</label>
                  <input type="text" name="username" defaultValue={editModal.username} required onInvalid={handleInvalid} onInput={handleInput} className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-[#52796F]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Kata Sandi Baru (Opsional)</label>
                  <input type="password" name="password" placeholder="Kosongkan jika tidak diubah" className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-[#52796F]" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">Peran Akses</label>
                  <div className="relative">
                    <select name="role" defaultValue={editModal.role} required onInvalid={handleInvalid} onInput={handleInput} className="appearance-none w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-[#52796F] cursor-pointer">
                      <option value="KASIR">Kasir</option><option value="ADMIN">Administrator</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                  </div>
                </div>

                <button type="submit" disabled={isPending} className="w-full mt-2 py-2.5 text-sm rounded-lg text-white font-medium bg-[#52796F] hover:bg-[#43645a] transition duration-200 disabled:opacity-50">
                  {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
