import { Calendar } from 'lucide-react';

export default function TransaksiPage() {
  return (
    <div className="space-y-6">
      {/* header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Riwayat Transaksi</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Log penjualan LPG 3kg pangkalan.</p>
      </div>

      {/* filter section */}
      <div className="flex gap-4">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="date"
            className="pl-10 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F] outline-none"
          />
        </div>
      </div>

      {/* table section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400">
            <tr>
              <th className="px-6 py-4 font-medium">ID Transaksi</th>
              <th className="px-6 py-4 font-medium">Pelanggan</th>
              <th className="px-6 py-4 font-medium">Tabung</th>
              <th className="px-6 py-4 font-medium">Total (Rp)</th>
              <th className="px-6 py-4 font-medium">Metode</th>
              <th className="px-6 py-4 font-medium">Waktu</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {/* dummy data */}
            <tr className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition">
              <td className="px-6 py-4 text-zinc-500 font-mono text-xs">TRX-123456</td>
              <td className="px-6 py-4 text-zinc-900 dark:text-zinc-100">Asep Surasep</td>
              <td className="px-6 py-4 font-medium">1</td>
              <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">16.000</td>
              <td className="px-6 py-4">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  Tunai
                </span>
              </td>
              <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">10:30 WIB</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
