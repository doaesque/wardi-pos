'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { MetodePembayaran, KategoriPelanggan } from '@prisma/client';

type DataTransaksi = {
  nikPelanggan: string;
  jumlahTabung: number;
  totalHarga?: number; 
  metodePembayaran: MetodePembayaran | string;
};

export async function fetchRiwayatTransaksi() {
  try {
    const data = await prisma.transaksi.findMany({
      orderBy: { tanggalTransaksi: 'desc' },
      include: {
        pelanggan: { select: { nama: true, kategori: true } }
      }
    });
    return data;
  } catch (error) {
    console.error('error fetching transactions:', error);
    return [];
  }
}

export async function prosesTransaksiServer(data: DataTransaksi) {
  try {
    // validate required fields
    if (!data.nikPelanggan || !data.jumlahTabung || data.jumlahTabung <= 0) {
      return { error: 'Data transaksi tidak lengkap atau jumlah tabung tidak valid.' };
    }

    // verify if customer exists in database
    const pelanggan = await prisma.pelanggan.findUnique({
      where: { nik: data.nikPelanggan }
    });

    if (!pelanggan) {
      return { error: 'Pelanggan dengan NIK tersebut tidak ditemukan di basis data. Silakan daftarkan pelanggan terlebih dahulu.' };
    }

    // ensure product exists for relation
    let produk = await prisma.produk.findFirst();
    if (!produk) {
      // auto-create if product is missing
      produk = await prisma.produk.create({
        data: { namaProduk: 'LPG 3 Kg', harga: 20000 }
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let usedQuota = 0;

    // --- purchase limit logic ---
    if (pelanggan.kategori === KategoriPelanggan.RT || pelanggan.kategori === KategoriPelanggan.UM) {
      const maxQuota = pelanggan.kategori === KategoriPelanggan.RT ? 1 : 2;
      
      const dailyTransactions = await prisma.transaksi.findMany({
        where: {
          idPelanggan: pelanggan.idPelanggan,
          tanggalTransaksi: { gte: today }
        }
      });
      
      usedQuota = dailyTransactions.reduce((acc, curr) => acc + curr.jumlahTabung, 0);

      if (usedQuota >= maxQuota) {
        return { error: `Batas pembelian harian telah habis untuk kategori ${pelanggan.kategori}.` };
      } else if (usedQuota + data.jumlahTabung > maxQuota) {
        return { error: `Jumlah pesanan melebihi batas. Sisa kuota kategori ${pelanggan.kategori} hari ini adalah ${maxQuota - usedQuota} tabung.` };
      }
      
    } else if (pelanggan.kategori === KategoriPelanggan.PENGECER) {
      const maxQuota = 10;
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const weeklyTransactions = await prisma.transaksi.findMany({
        where: {
          idPelanggan: pelanggan.idPelanggan,
          tanggalTransaksi: { gte: sevenDaysAgo }
        }
      });
      
      usedQuota = weeklyTransactions.reduce((acc, curr) => acc + curr.jumlahTabung, 0);

      if (usedQuota >= maxQuota) {
        return { error: `Batas pembelian mingguan telah habis untuk kategori PENGECER.` };
      } else if (usedQuota + data.jumlahTabung > maxQuota) {
        return { error: `Jumlah pesanan melebihi batas. Sisa kuota kategori PENGECER minggu ini adalah ${maxQuota - usedQuota} tabung.` };
      }
    }

    // calculate dynamic price
    const hargaPerTabung = pelanggan.kategori === KategoriPelanggan.RT ? 20000 : 19000;
    const finalTotalHarga = data.jumlahTabung * hargaPerTabung;

    // create the transaction record
    await prisma.transaksi.create({
      data: {
        idPelanggan: pelanggan.idPelanggan,
        idProduk: produk.idProduk,
        jumlahTabung: data.jumlahTabung,
        totalHarga: finalTotalHarga,
        metodePembayaran: data.metodePembayaran as MetodePembayaran,
      },
    });

    revalidatePath('/transaksi');
    return { success: true };
  } catch (error: any) {
    console.error('transaction error:', error);
    return { error: `Transaksi ditolak oleh peladen. Detail: ${error.message || 'Kesalahan internal'}` };
  }
}
