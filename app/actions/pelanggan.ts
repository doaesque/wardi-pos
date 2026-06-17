'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { KategoriPelanggan } from '@prisma/client';

// add new customer
export async function addCustomer(formData: FormData) {
  const nik = formData.get('nik') as string;
  const nama = formData.get('nama') as string;
  const kategori = formData.get('kategori') as KategoriPelanggan;

  if (!nik || !nama || !kategori) return { error: 'Semua data pelanggan wajib diisi.' };
  if (nik.length !== 16) return { error: 'Nomor Induk Kependudukan (NIK) harus berjumlah tepat 16 angka.' };

  try {
    const existingCustomer = await prisma.pelanggan.findUnique({ where: { nik } });
    if (existingCustomer) return { error: 'NIK tersebut sudah terdaftar di dalam sistem.' };

    await prisma.pelanggan.create({ data: { nik, nama, kategori } });
    revalidatePath('/pelanggan');
    return { success: true };
  } catch (error) {
    return { error: 'Terjadi kesalahan pada peladen saat menyimpan data.' };
  }
}

// update existing customer
export async function editCustomer(formData: FormData) {
  const nik = formData.get('nik') as string;
  const nama = formData.get('nama') as string;
  const kategori = formData.get('kategori') as KategoriPelanggan;

  if (!nik || !nama || !kategori) return { error: 'Semua data pelanggan wajib diisi.' };

  try {
    await prisma.pelanggan.update({ where: { nik }, data: { nama, kategori } });
    revalidatePath('/pelanggan');
    return { success: true };
  } catch (error) {
    return { error: 'Gagal memperbarui data pelanggan. Pastikan data yang dimasukkan valid.' };
  }
}

// delete customer
export async function deleteCustomer(nik: string) {
  try {
    await prisma.pelanggan.delete({ where: { nik } });
    revalidatePath('/pelanggan');
    return { success: true };
  } catch (error) {
    return { error: 'Data pelanggan gagal dihapus karena terjadi kesalahan sistem.' };
  }
}

// search customer by nik or name for cashier interface
export async function searchPelanggan(query: string) {
  if (!query || query.trim() === '') return [];

  try {
    const results = await prisma.pelanggan.findMany({
      where: {
        OR: [
          { nik: { contains: query } },
          { nama: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
    });
    return results;
  } catch (error) {
    console.error('error searching customer:', error);
    return [];
  }
}

// fetch detail and purchase history of customer for modals
export async function getDetailRiwayatPelanggan(nik: string, monthOffset: number) {
  const now = new Date();
  
  // boundaries
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // start of week
  weekStart.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // target month for history list
  const targetMonthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
  const targetMonthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0, 23, 59, 59, 999);

  try {
    // get transactions up to the earliest needed point (2 months ago minimum)
    const earliestDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    
    const allTrx = await prisma.transaksi.findMany({
      where: { 
        nikPelanggan: nik, 
        tanggalTransaksi: { gte: earliestDate } 
      },
      orderBy: { tanggalTransaksi: 'desc' },
      include: { kasir: true }
    });

    let totalHariIni = 0;
    let totalMingguIni = 0;
    let totalBulanIni = 0;
    const listRiwayat = [];

    for (const trx of allTrx) {
      const d = new Date(trx.tanggalTransaksi);
      
      // aggregations
      if (d >= todayStart) totalHariIni += trx.jumlahTabung;
      if (d >= weekStart) totalMingguIni += trx.jumlahTabung;
      if (d >= monthStart) totalBulanIni += trx.jumlahTabung;

      // isolate history list
      if (d >= targetMonthStart && d <= targetMonthEnd) {
        listRiwayat.push({
          id: trx.id,
          tanggal: trx.tanggalTransaksi,
          jumlah: trx.jumlahTabung,
          kasir: trx.kasir?.nama || '-'
        });
      }
    }

    return {
      success: true,
      data: {
        totalHariIni,
        totalMingguIni,
        totalBulanIni,
        listRiwayat
      }
    };
  } catch (error) {
    return { error: 'Gagal memuat riwayat pembelian.' };
  }
}
