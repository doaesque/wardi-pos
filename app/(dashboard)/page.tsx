"use server"

import prisma from "@/app/lib/prisma";

export async function prosesTransaksiServer(data: {
  nikPelanggan: string;
  jumlahTabung: number;
  metodePembayaran: any;
}) {
  try {
    const pelanggan = await prisma.pelanggan.findUnique({
      where: { nik: data.nikPelanggan }
    });

    if (!pelanggan) return { error: "Data pelanggan tidak ditemukan di sistem." };

    // calculate the start of today and the start of this week
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // validate rt limit: max 1 transaction per day
    if (pelanggan.kategori === "RT") {
      const count = await prisma.transaksi.count({
        where: { nikPelanggan: data.nikPelanggan, tanggalTransaksi: { gte: startOfDay } }
      });
      if (count >= 1) return { error: "Batas limit RT tercapai: Maksimal 1x transaksi per hari." };
    }

    // validate um limit: max 2 transactions per day
    else if (pelanggan.kategori === "UM") {
      const count = await prisma.transaksi.count({
        where: { nikPelanggan: data.nikPelanggan, tanggalTransaksi: { gte: startOfDay } }
      });
      if (count >= 2) return { error: "Batas limit UM tercapai: Maksimal 2x transaksi per hari." };
    }

    // validate pengecer limit: max 10 tubes per week
    else if (pelanggan.kategori === "PENGECER") {
      // calculate total tubes already bought this week
      const agg = await prisma.transaksi.aggregate({
        where: { nikPelanggan: data.nikPelanggan, tanggalTransaksi: { gte: startOfWeek } },
        _sum: { jumlahTabung: true }
      });

      const tabungSudahDibeli = agg._sum.jumlahTabung || 0;
      const sisaKuota = 10 - tabungSudahDibeli;

      if (data.jumlahTabung > sisaKuota) {
        return { error: `Batas limit Pengecer tidak mencukupi: Sisa kuota minggu ini hanya ${sisaKuota} tabung.` };
      }
    }

    // if limit is passed, save transaction to database
    const totalHarga = data.jumlahTabung * 16000;
    const transaksi = await prisma.transaksi.create({
      data: {
        nikPelanggan: data.nikPelanggan,
        jumlahTabung: data.jumlahTabung,
        totalHarga: totalHarga,
        metodePembayaran: data.metodePembayaran
      }
    });

    return { success: true, transaksi };

  } catch (error) {
    // log server error for debugging
    console.error("error processing transaction:", error);
    return { error: "Terjadi kesalahan sistem saat memproses transaksi." };
  }
}
