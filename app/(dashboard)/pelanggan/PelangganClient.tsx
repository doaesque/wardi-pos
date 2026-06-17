'use client';

import { useState, useTransition } from 'react';
import { Eye, Edit, Trash2, UserPlus } from 'lucide-react';
import { addCustomer, deleteCustomer } from '@/app/actions/pelanggan';

// define types based on prisma schema
type Pelanggan = {
  nik: string;
  nama: string;
  kategori: string;
};

export function PelangganClient({ initialData }: { initialData: Pelanggan[] }) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState('');

  const handleDelete = (nik: string, nama: string) => {
    // confirmation popup before deletion
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pelanggan bernama ${nama} (NIK: ${nik})? Tindakan ini tidak dapat dibatalkan.`)) {
      startTransition(async () => {
        const res = await deleteCustomer(nik);
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
      const res = await addCustomer(formData);
      if (res?.error) {
        setFormError(res.error);
      } else {
        alert('Data pelanggan berhasil ditambahkan ke dalam sistem!');
        form.reset();
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      
      {/* left section: customer table */}
      <div className="flex-1">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 uppercase font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">NIK</th>
                <th className="px-6 py-4">Nama Lengkap</th>
                <th className="px-6 py-4">Kategori</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-zinc-500">
                    Belum ada data pelanggan yang terdaftar.
                  </td>
                </tr>
              ) : (
                initialData.map((p) => (
                  <tr key={p.nik} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs">{p.nik}</td>
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">{p.nama}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-[10px] uppercase tracking-wider rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {p.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-3">
                        {/* view details button */}
                        <button onClick={() => alert('Fitur detail sedang dalam pengembangan.')} className="text-zinc-400 hover:text-[#52796F] transition-colors" title="Lihat Detail">
                          <Eye size={18} />
                        </button>
                        
                        {/* edit button */}
                        <button onClick={() => alert('Fitur ubah data sedang dalam pengembangan.')} className="text-zinc-400 hover:text-amber-500 transition-colors" title="Ubah Data">
                          <Edit size={18} />
                        </button>

                        {/* delete button */}
                        <button onClick={() => handleDelete(p.nik, p.nama)} className="text-zinc-400 hover:text-red-500 transition-colors" title="Hapus Data">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* right section: add customer form */}
      <div className="w-full lg:w-80">
        <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm sticky top-8">
          <div className="flex items-center gap-2 mb-6 text-zinc-900 dark:text-white font-semibold">
            <UserPlus size={20} className="text-[#52796F]" />
            <h3>Registrasi Pelanggan</h3>
          </div>
          
          <form onSubmit={handleAdd} className="space-y-4">
            {/* error message alert */}
            {formError && (
              <div className="p-3 text-xs text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md">
                {formError}
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">NIK (16 Digit)</label>
              <input type="text" name="nik" maxLength={16} required className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:border-[#52796F]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Nama Lengkap</label>
              <input type="text" name="nama" required className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:border-[#52796F]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1">Kategori Pelanggan</label>
              <select name="kategori" className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:border-[#52796F]">
                <option value="RT">Rumah Tangga (RT)</option>
                <option value="UM">Usaha Mikro (UM)</option>
                <option value="PENGECER">Pengecer</option>
              </select>
            </div>
            <button type="submit" disabled={isPending} className="w-full py-2 text-sm rounded-md text-white font-medium bg-[#52796F] hover:bg-[#43645a] transition duration-200 disabled:opacity-50">
              {isPending ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
