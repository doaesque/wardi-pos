'use server';

import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { MetodePembayaran } from '@prisma/client';

// define types for incoming transaction data
type DataTransaksi = {
  nikPelanggan: string;
  jumlahTabung: number;
  totalHarga?: number; 
  metodePembayaran: MetodePembayaran;
};

export async function prosesTransaksiServer(data: DataTransaksi) {
  try {
    // get active user from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('wardi_session');

    if (!sessionCookie) {
      return { error: 'Sesi Anda telah berakhir. Silakan masuk kembali ke dalam sistem.' };
    }

    const sessionData = JSON.parse(sessionCookie.value);
    
    if (!sessionData.id) {
      return { error: 'Data identitas pengguna tidak ditemukan. Silakan masuk ulang ke dalam sistem.' };
    }

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

    // --- purchase limit logic ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let usedQuota = 0;

    if (pelanggan.kategori === 'RT' || pelanggan.kategori === 'UM') {
      // daily limits: rt(1) and um(2)
      const maxQuota = pelanggan.kategori === 'RT' ? 1 : 2;
      
      const dailyTransactions = await prisma.transaksi.findMany({
        where: {
          nikPelanggan: data.nikPelanggan,
          tanggalTransaksi: { gte: today }
        }
      });
      
      usedQuota = dailyTransactions.reduce((acc, curr) => acc + curr.jumlahTabung, 0);

      if (usedQuota >= maxQuota) {
        return { error: `Batas pembelian harian telah habis untuk kategori ${pelanggan.kategori}.` };
      } else if (usedQuota + data.jumlahTabung > maxQuota) {
        return { error: `Jumlah pesanan melebihi batas. Sisa kuota kategori ${pelanggan.kategori} hari ini adalah ${maxQuota - usedQuota} tabung.` };
      }
      
    } else if (pelanggan.kategori === 'PENGECER') {
      // weekly limit: pengecer(10)
      const maxQuota = 10;
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const weeklyTransactions = await prisma.transaksi.findMany({
        where: {
          nikPelanggan: data.nikPelanggan,
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
    // --- end of purchase limit logic ---

    // fallback calculation if frontend omits totalHarga
    const finalTotalHarga = data.totalHarga ? data.totalHarga : (data.jumlahTabung * 18000);

    // create the transaction record in database
    await prisma.transaksi.create({
      data: {
        nikPelanggan: data.nikPelanggan,
        jumlahTabung: data.jumlahTabung,
        totalHarga: finalTotalHarga,
        metodePembayaran: data.metodePembayaran,
        kasirId: sessionData.id,
        sesiId: sessionData.sesiId || null,
      },
    });

    revalidatePath('/transaksi');
    return { success: true };
  } catch (error: any) {
    console.error('transaction error:', error);
    return { error: `Transaksi ditolak oleh peladen. Detail: ${error.message || 'Kesalahan internal'}` };
  }
}
