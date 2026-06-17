"use client"

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, X, ChevronUp, ChevronDown, ChevronsUpDown, Trash2, History, AlertTriangle } from 'lucide-react';
import { fetchPelangganDataTable, simpanPelanggan, hapusPelanggan, fetchRiwayatDanStats } from '@/app/actions/pelanggan';

export default function PelangganPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [query, setQuery] = useState("");
  const [kategori, setKategori] = useState("ALL");
  const [sortConfig, setSortConfig] = useState<{key: string, order: 'asc'|'desc'}>({ key: 'createdAt', order: 'desc' });

  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({ nik: "", nama: "", kategori: "RT" });
  const [errorMsg, setErrorMsg] = useState("");

  const [deleteModal, setDeleteModal] = useState({ open: false, customer: null as any });
  const [historyModal, setHistoryModal] = useState({ open: false, loading: false, data: null as any, customer: null as any });

  const loadData = async () => {
    setLoading(true);
    const result = await fetchPelangganDataTable(query, kategori, sortConfig.key, sortConfig.order);
    setData(result);
    setLoading(false);
  };

  useEffect(() => {
    const timeout = setTimeout(() => loadData(), 300);
    return () => clearTimeout(timeout);
  }, [query, kategori, sortConfig]);

  const handleSort = (key: string) => {
    let order: 'asc'|'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.order === 'asc') order = 'desc';
    setSortConfig({ key, order });
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ChevronsUpDown size={14} className="text-zinc-400 opacity-50" />;
    return sortConfig.order === 'asc' ? <ChevronUp size={14} className="text-[#52796F]" /> : <ChevronDown size={14} className="text-[#52796F]" />;
  };

  const openAddModal = () => {
    setFormData({ nik: "", nama: "", kategori: "RT" });
    setIsEdit(false);
    setErrorMsg("");
    setModalOpen(true);
  };

  const openEditModal = (pelanggan: any) => {
    setFormData({ nik: pelanggan.nik, nama: pelanggan.nama, kategori: pelanggan.kategori });
    setIsEdit(true);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validasi Manual Bahasa Indonesia
    if (formData.nik.length !== 16) {
      setErrorMsg("NIK harus berjumlah tepat 16 digit angka.");
      return;
    }
    if (formData.nama.trim() === "") {
      setErrorMsg("Nama pelanggan wajib diisi.");
      return;
    }

    const res = await simpanPelanggan({ ...formData, isEdit });
    if (res.error) setErrorMsg(res.error);
    else { setModalOpen(false); loadData(); }
  };

  const confirmDelete = async () => {
    const res = await hapusPelanggan(deleteModal.customer.nik);
    if (res.error) alert(res.error);
    setDeleteModal({ open: false, customer: null });
    loadData();
  };

  const openHistory = async (pelanggan: any) => {
    setHistoryModal({ open: true, loading: true, data: null, customer: pelanggan });
    const res = await fetchRiwayatDanStats(pelanggan.nik);
    if (res.error) {
      alert(res.error);
      setHistoryModal({ open: false, loading: false, data: null, customer: null });
    } else {
      setHistoryModal({ open: true, loading: false, data: res, customer: pelanggan });
    }
  };

  const formatRupiah = (number: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);

  return (
    <div className="space-y-6">
      
      {/* modal add/edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-xl w-full max-w-md border border-zinc-200 dark:border-zinc-800">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
                {isEdit ? "Detail & Edit Pelanggan" : "Tambah Pelanggan Baru"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 transition"><X size={20} /></button>
            </div>
            
            {errorMsg && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">{errorMsg}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nomor Induk Kependudukan (NIK)</label>
                <input 
                  type="text" 
                  value={formData.nik} 
                  onChange={(e) => setFormData({...formData, nik: e.target.value.replace(/\D/g, '')})}
                  readOnly={isEdit}
                  placeholder="Masukkan 16 digit NIK..."
                  className={`w-full px-4 py-2.5 rounded-lg border bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-[#52796F] ${isEdit ? 'border-transparent opacity-60 cursor-not-allowed' : 'border-zinc-300 dark:border-zinc-700'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={formData.nama} 
                  onChange={(e) => setFormData({...formData, nama: e.target.value})}
                  placeholder="Masukkan nama lengkap..."
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-[#52796F]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Kategori Kuota</label>
                <div className="relative">
                  <select 
                    value={formData.kategori} onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                    className="w-full pl-4 pr-10 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-[#52796F] appearance-none cursor-pointer"
                  >
                    <option value="RT">Rumah Tangga (RT)</option>
                    <option value="UM">Usaha Mikro (UM)</option>
                    <option value="PENGECER">Pengecer</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={18} />
                </div>
              </div>

              <button type="submit" className="w-full mt-2 py-3 bg-[#52796F] hover:bg-[#43645a] text-white rounded-lg font-bold transition">
                {isEdit ? "Simpan Perubahan" : "Simpan Data Baru"}
              </button>
            </form>

            {/* Tombol Opsi Tambahan (Riwayat & Hapus) */}
            {isEdit && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-3">
                <button 
                  type="button"
                  onClick={() => { setModalOpen(false); openHistory(formData); }}
                  className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 rounded-lg font-medium transition"
                >
                  <History size={16} /> Lihat Riwayat
                </button>
                <button 
                  type="button"
                  onClick={() => { setModalOpen(false); setDeleteModal({ open: true, customer: formData }); }}
                  className="flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 rounded-lg font-medium transition"
                >
                  <Trash2 size={16} /> Hapus Data
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* modal delete confirm */}
      {deleteModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-xl w-full max-w-sm border border-zinc-200 dark:border-zinc-800 text-center">
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Hapus Pelanggan?</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              Anda yakin ingin menghapus data <span className="font-bold text-zinc-700 dark:text-zinc-300">{deleteModal.customer?.nama}</span>? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ open: false, customer: null })} className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl font-bold transition">Batal</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* modal history & stats */}
      {historyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-xl w-full max-w-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Riwayat & Statistik</h2>
                <p className="text-zinc-500 dark:text-zinc-400">{historyModal.customer?.nama} ({historyModal.customer?.nik})</p>
              </div>
              <button onClick={() => setHistoryModal({ open: false, loading: false, data: null, customer: null })} className="text-zinc-400 hover:text-zinc-600 transition p-1"><X size={24} /></button>
            </div>

            {historyModal.loading ? (
              <div className="py-20 text-center text-zinc-500">Memuat data...</div>
            ) : (
              <div className="overflow-y-auto custom-scrollbar pr-2">
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 p-4 rounded-xl text-center">
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Hari Ini</p>
                    <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{historyModal.data.stats.hariIni}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-4 rounded-xl text-center">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Minggu Ini</p>
                    <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">{historyModal.data.stats.mingguIni}</p>
                  </div>
                  <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 rounded-xl text-center">
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Total Dibeli</p>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">{historyModal.data.stats.total}</p>
                  </div>
                </div>

                <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-3 flex items-center gap-2"><History size={16} /> 10 Transaksi Terakhir</h3>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Waktu</th>
                        <th className="px-4 py-3 font-medium text-center">Tabung</th>
                        <th className="px-4 py-3 font-medium text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                      {historyModal.data.riwayat.length > 0 ? (
                        historyModal.data.riwayat.map((t: any) => (
                          <tr key={t.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                            <td className="px-4 py-3 text-zinc-600 dark:text-zinc-300">
                              {new Date(t.tanggalTransaksi).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-3 text-center font-bold text-zinc-800 dark:text-zinc-200">{t.jumlahTabung}</td>
                            <td className="px-4 py-3 text-right text-[#52796F] dark:text-emerald-400 font-medium">{formatRupiah(t.totalHarga)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={3} className="px-4 py-8 text-center text-zinc-500">Belum ada riwayat transaksi.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* header & actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Data Pelanggan</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Kelola data penerima LPG subsidi.</p>
        </div>
        <button onClick={openAddModal} className="px-4 py-2.5 bg-[#52796F] hover:bg-[#43645a] text-white rounded-lg font-medium flex items-center justify-center gap-2 transition">
          <Plus size={18} /> Tambah Pelanggan
        </button>
      </div>

      {/* advanced filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input 
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari NIK atau nama..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F] outline-none"
          />
        </div>
        
        <div className="relative w-full sm:w-56 flex-shrink-0">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
          <select 
            value={kategori} onChange={(e) => setKategori(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F] outline-none appearance-none cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            <option value="RT">Rumah Tangga</option>
            <option value="UM">Usaha Mikro</option>
            <option value="PENGECER">Pengecer</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={18} />
        </div>
      </div>

      {/* data table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 select-none">
              <tr>
                <th onClick={() => handleSort('nik')} className="px-6 py-4 font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                  <div className="flex items-center gap-2">NIK <SortIcon columnKey="nik" /></div>
                </th>
                <th onClick={() => handleSort('nama')} className="px-6 py-4 font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                  <div className="flex items-center gap-2">Nama <SortIcon columnKey="nama" /></div>
                </th>
                <th onClick={() => handleSort('kategori')} className="px-6 py-4 font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                  <div className="flex items-center gap-2">Kategori <SortIcon columnKey="kategori" /></div>
                </th>
                <th onClick={() => handleSort('createdAt')} className="px-6 py-4 font-medium cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                  <div className="flex items-center gap-2">Tanggal Daftar <SortIcon columnKey="createdAt" /></div>
                </th>
                <th className="px-6 py-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Memuat data...</td></tr>
              ) : data.length > 0 ? (
                data.map((p) => (
                  <tr key={p.nik} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                    <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100 font-mono">{p.nik}</td>
                    <td className="px-6 py-4 font-medium text-zinc-800 dark:text-zinc-200">{p.nama}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        p.kategori === 'RT' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                        p.kategori === 'UM' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400'
                      }`}>
                        {p.kategori}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 dark:text-zinc-400">
                      {new Date(p.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => openEditModal(p)} className="px-4 py-1.5 text-sm font-medium text-[#52796F] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded-lg border border-[#52796F]/30 transition">
                        Detail / Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Data tidak ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
