'use server';

import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { MetodePembayaran } from '@prisma/client';

// define types for incoming transaction data
type DataTransaksi = {
  nikPelanggan: string;
  jumlahTabung: number;
  totalHarga?: number; // optional, we will calculate if missing
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

    // fallback calculation: if frontend forgets to send totalHarga, calculate it here
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

    // refresh transaction history page cache
    revalidatePath('/transaksi');
    return { success: true };
  } catch (error: any) {
    console.error('transaction error:', error);
    return { error: `Transaksi ditolak oleh peladen. Detail: ${error.message || 'Kesalahan internal'}` };
  }
}
