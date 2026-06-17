'use server';

import prisma from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { MetodePembayaran } from '@prisma/client';

// define types for incoming transaction data
type DataTransaksi = {
  nikPelanggan: string;
  jumlahTabung: number;
  totalHarga: number;
  metodePembayaran: MetodePembayaran;
};

export async function prosesTransaksiServer(data: DataTransaksi) {
  try {
    // get active cashier from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('wardi_session');

    if (!sessionCookie) {
      return { error: 'Sesi Anda telah berakhir. Silakan masuk kembali ke dalam sistem.' };
    }

    const sessionData = JSON.parse(sessionCookie.value);

    if (!sessionData.id) {
      return { error: 'Data identitas kasir tidak ditemukan. Silakan masuk ulang ke dalam sistem.' };
    }

    // create the transaction record in database
    // this is where the fix is applied: kasirId is now included
    await prisma.transaksi.create({
      data: {
        nikPelanggan: data.nikPelanggan,
        jumlahTabung: data.jumlahTabung,
        totalHarga: data.totalHarga,
        metodePembayaran: data.metodePembayaran,
        kasirId: sessionData.id, // required field
        sesiId: sessionData.sesiId || null,
      },
    });

    // refresh transaction history page cache
    revalidatePath('/transaksi');
    return { success: true };
  } catch (error) {
    console.error('transaction error:', error);
    return { error: 'Terjadi gangguan pada peladen saat memproses transaksi.' };
  }
}
