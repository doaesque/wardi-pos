'use client';

import { useState, useTransition } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { addEmployee, deleteEmployee } from '@/app/actions/karyawan';

// define types for props
type Karyawan = {
  id: string;
  nama: string;
  username: string;
  role: string;
  _count: { transaksi: number };
};

export function KaryawanClient({ initialData }: { initialData: Karyawan[] }) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState('');

  const handleDelete = (id: string, nama: string) => {
    // confirmation popup
    if (window.confirm(`Apakah Anda yakin ingin menghapus akun milik ${nama}? Tindakan ini tidak dapat dibatalkan.`)) {
      startTransition(async () => {
        const res = await deleteEmployee(id);
        if (res?.error) {
          alert(res.error);
        }
      });
    }
  };

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');
    const form = e.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const res = await addEmployee(formData);
      if (res?.error) {
        setFormError(res.error);
      } else {
        alert('Karyawan berhasil didaftarkan ke dalam sistem!');
        form.reset();
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* left section: employee list and performance */}
      <div className="flex-1">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 uppercase font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Peran</th>
                <th className="px-6 py-4">Transaksi Dilayani</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialData.map((k) => (
                <tr key={k.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                    {k.nama} <br/><span className="text-xs text-zinc-400 font-normal">@{k.username}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${k.role === 'ADMIN' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'}`}>
                      {k.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#52796F]">{k._count.transaksi} kali</td>
                  <td className="px-6 py-4 text-center">
                    {/* trash icon button for deletion */}
                    <button 
                      onClick={() => handleDelete(k.id, k.nama)}
                      className="text-zinc-400 hover:text-red-500 transition-colors"
                      title="Hapus Karyawan"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* right section: add employee form */}
      <div className="w-full lg:w-80">
        <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm sticky top-8">
          <div className="flex items-center gap-2 mb-6 text-zinc-900 dark:text-white font-semibold">
            <UserPlus size={20} className="text-[#52796F]" />
            <h3>Tambah Staf Baru</h3>
          </div>
          
          <form onSubmit={handleAdd} className="space-y-4">
            {/* error message block */}
            {formError && (
              <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md">
                {formError}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Nama Lengkap</label>
              <input type="text" name="nama" required className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:border-[#52796F]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Nama Pengguna</label>
              <input type="text" name="username" required className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:border-[#52796F]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Kata Sandi</label>
              <input type="password" name="password" required className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:border-[#52796F]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Peran Akses</label>
              <select name="role" className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:border-[#52796F]">
                <option value="KASIR">Kasir</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>
            <button type="submit" disabled={isPending} className="w-full py-2 text-sm rounded-md text-white font-medium bg-[#52796F] hover:bg-[#43645a] transition duration-200 disabled:opacity-50">
              {isPending ? 'Memproses...' : 'Simpan Karyawan'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
