import prisma from '@/app/lib/prisma';

export default async function TransaksiPage() {
  // fetch transactions, including customer and cashier relations
  const riwayatTransaksi = await prisma.transaksi.findMany({
    include: { 
      pelanggan: true,
      kasir: true 
    },
    orderBy: { tanggalTransaksi: 'desc' },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Riwayat Transaksi</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Daftar seluruh transaksi penjualan LPG 3 Kg beserta kasir yang melayani.</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-400">
            <thead className="bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 uppercase font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4">ID Transaksi</th>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Pelanggan</th>
                <th className="px-6 py-4">Kasir</th>
                <th className="px-6 py-4">Jumlah</th>
                <th className="px-6 py-4">Metode</th>
                <th className="px-6 py-4">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {riwayatTransaksi.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">
                    Belum ada riwayat transaksi yang tercatat.
                  </td>
                </tr>
              ) : (
                riwayatTransaksi.map((trx) => (
                  <tr key={trx.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {trx.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      {new Date(trx.tanggalTransaksi).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      {trx.pelanggan?.nama || 'Umum'} <br/>
                      <span className="text-xs text-zinc-400">{trx.pelanggan?.kategori}</span>
                    </td>
                    <td className="px-6 py-4 text-zinc-500">
                      {trx.kasir?.nama || '-'}
                    </td>
                    <td className="px-6 py-4">{trx.jumlahTabung} Tabung</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-[10px] uppercase tracking-wider rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {trx.metodePembayaran}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-[#52796F]">
                      Rp {trx.totalHarga.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
