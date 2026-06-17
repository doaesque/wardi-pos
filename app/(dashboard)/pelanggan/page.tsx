import { Plus, Search, ArrowUpDown } from 'lucide-react';
import prisma from '@/app/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function PelangganPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string };
}) {
  const query = searchParams?.q || "";
  const sort = searchParams?.sort === "asc" ? "asc" : "desc";

  // fetch data straight from database
  const pelangganList = await prisma.pelanggan.findMany({
    where: {
      OR: [
        { nama: { contains: query, mode: "insensitive" } },
        { nik: { contains: query } }
      ]
    },
    orderBy: {
      createdAt: sort
    }
  });

  // toggle sort direction
  const nextSort = sort === "desc" ? "asc" : "desc";

  // server action for search
  const searchAction = async (formData: FormData) => {
    "use server"
    const q = formData.get("q")?.toString() || "";
    redirect(`/pelanggan?q=${q}&sort=${sort}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Data Pelanggan</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Kelola data penerima LPG subsidi.</p>
        </div>
        <button className="px-4 py-2 bg-[#52796F] hover:bg-[#43645a] text-white rounded-lg font-medium flex items-center gap-2 transition">
          <Plus size={18} /> Tambah Pelanggan
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* search form */}
        <form action={searchAction} className="relative w-full max-w-md">
          <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
            <Search size={18} />
          </button>
          <input 
            type="text" 
            name="q"
            defaultValue={query}
            placeholder="Cari NIK atau nama, lalu Enter..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F] outline-none"
          />
        </form>

        {/* sort button */}
        <Link 
          href={`/pelanggan?q=${query}&sort=${nextSort}`}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition"
        >
          <ArrowUpDown size={16} /> Urutkan ({sort === "desc" ? "Terbaru" : "Terlama"})
        </Link>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
            <tr>
              <th className="px-6 py-4 font-medium">NIK</th>
              <th className="px-6 py-4 font-medium">Nama</th>
              <th className="px-6 py-4 font-medium">Kategori</th>
              <th className="px-6 py-4 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {pelangganList.length > 0 ? (
              pelangganList.map((p) => (
                <tr key={p.nik} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
                  <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100 font-medium">{p.nik}</td>
                  <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">{p.nama}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                      {p.kategori}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-zinc-500 dark:text-zinc-400">
                  Data pelanggan tidak ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
