// app/actions/transaksi.ts
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

    // hitung waktu awal hari ini dan awal minggu ini
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); 
    startOfWeek.setHours(0, 0, 0, 0);

    // validasi limit transaksi berdasarkan kategori
    if (pelanggan.kategori === "RT") {
      const count = await prisma.transaksi.count({
        where: { nikPelanggan: data.nikPelanggan, tanggalTransaksi: { gte: startOfDay } }
      });
      if (count >= 1) return { error: "Batas limit RT tercapai: Maksimal 1x transaksi per hari." };
    } 
    
    else if (pelanggan.kategori === "UM") {
      const count = await prisma.transaksi.count({
        where: { nikPelanggan: data.nikPelanggan, tanggalTransaksi: { gte: startOfDay } }
      });
      if (count >= 2) return { error: "Batas limit UM tercapai: Maksimal 2x transaksi per hari." };
    } 
    
    else if (pelanggan.kategori === "PENGECER") {
      const count = await prisma.transaksi.count({
        where: { nikPelanggan: data.nikPelanggan, tanggalTransaksi: { gte: startOfWeek } }
      });
      if (count >= 10) return { error: "Batas limit Pengecer tercapai: Maksimal 10x transaksi per minggu." };
    }

    // jika lolos limit, simpan transaksi ke database
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
    console.error("error proses transaksi:", error);
    return { error: "Terjadi kesalahan sistem saat memproses transaksi." };
  }
}
