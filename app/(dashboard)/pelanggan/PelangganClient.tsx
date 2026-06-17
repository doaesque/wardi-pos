'use client';

import { useState, useTransition } from 'react';
import { Eye, Edit, Trash2, UserPlus, X } from 'lucide-react';
import { addCustomer, deleteCustomer, editCustomer } from '@/app/actions/pelanggan';

// define types based on prisma schema
type Pelanggan = {
  nik: string;
  nama: string;
  kategori: string;
};

export function PelangganClient({ initialData }: { initialData: Pelanggan[] }) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState('');
  
  // modal state
  const [modal, setModal] = useState<{ type: 'detail' | 'edit' | null, data: Pelanggan | null }>({ type: null, data: null });

  const handleDelete = (nik: string, nama: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus data pelanggan bernama ${nama} (NIK: ${nik})? Tindakan ini tidak dapat dibatalkan.`)) {
      startTransition(async () => {
        const res = await deleteCustomer(nik);
        if (res?.error) alert(res.error);
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

  const handleEdit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await editCustomer(formData);
      if (res?.error) {
        alert(res.error);
      } else {
        alert('Data pelanggan berhasil diperbarui!');
        setModal({ type: null, data: null }); // close modal
      }
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 relative">
      
      {/* left section: customer table */}
      <div className="flex-1">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 uppercase font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">Nomor Induk Kependudukan</th>
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
                        <button 
                          onClick={() => setModal({ type: 'detail', data: p })} 
                          className="text-zinc-400 hover:text-[#52796F] transition-colors" 
                          title="Lihat Detail"
                        >
                          <Eye size={18} />
                        </button>
                        
                        {/* edit button */}
                        <button 
                          onClick={() => setModal({ type: 'edit', data: p })} 
                          className="text-zinc-400 hover:text-amber-500 transition-colors" 
                          title="Ubah Data"
                        >
                          <Edit size={18} />
                        </button>

                        {/* delete button */}
                        <button 
                          onClick={() => handleDelete(p.nik, p.nama)} 
                          className="text-zinc-400 hover:text-red-500 transition-colors" 
                          title="Hapus Data"
                        >
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

      {/* modal overlay for detail and edit */}
      {modal.type && modal.data && (
        <div className="fixed inset-0 z-50 bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-lg w-full max-w-sm overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-zinc-900 dark:text-white">
                {modal.type === 'edit' ? 'Ubah Data Pelanggan' : 'Detail Pelanggan'}
              </h3>
              <button onClick={() => setModal({ type: null, data: null })} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-5">
              {modal.type === 'detail' ? (
                <div className="space-y-4 text-sm">
                  <div>
                    <span className="block text-zinc-500 text-xs">Nomor Induk Kependudukan</span>
                    <span className="font-mono text-zinc-900 dark:text-zinc-100">{modal.data.nik}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 text-xs">Nama Lengkap</span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">{modal.data.nama}</span>
                  </div>
                  <div>
                    <span className="block text-zinc-500 text-xs">Kategori</span>
                    <span className="px-2 py-1 mt-1 inline-block text-[10px] uppercase tracking-wider rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {modal.data.kategori}
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEdit} className="space-y-4">
                  {/* nik is read-only because it's the primary key */}
                  <input type="hidden" name="nik" value={modal.data.nik} />
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">NIK (Tidak dapat diubah)</label>
                    <input type="text" disabled value={modal.data.nik} className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 text-zinc-500 cursor-not-allowed outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Nama Lengkap</label>
                    <input type="text" name="nama" defaultValue={modal.data.nama} required className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:border-[#52796F]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-500 mb-1">Kategori Pelanggan</label>
                    <select name="kategori" defaultValue={modal.data.kategori} className="w-full px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-transparent text-zinc-900 dark:text-white outline-none focus:border-[#52796F]">
                      <option value="RT">Rumah Tangga (RT)</option>
                      <option value="UM">Usaha Mikro (UM)</option>
                      <option value="PENGECER">Pengecer</option>
                    </select>
                  </div>
                  <button type="submit" disabled={isPending} className="w-full mt-2 py-2 text-sm rounded-md text-white font-medium bg-[#52796F] hover:bg-[#43645a] transition duration-200 disabled:opacity-50">
                    {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
