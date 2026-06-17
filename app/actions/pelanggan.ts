'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { KategoriPelanggan } from '@prisma/client';

// add new customer
export async function addCustomer(formData: FormData) {
  const nik = formData.get('nik') as string;
  const nama = formData.get('nama') as string;
  const kategori = formData.get('kategori') as KategoriPelanggan;

  if (!nik || !nama || !kategori) {
    return { error: 'Semua data pelanggan wajib diisi.' };
  }

  if (nik.length !== 16) {
    return { error: 'Nomor Induk Kependudukan (NIK) harus berjumlah tepat 16 angka.' };
  }

  try {
    const existingCustomer = await prisma.pelanggan.findUnique({ where: { nik } });
    if (existingCustomer) return { error: 'NIK tersebut sudah terdaftar di dalam sistem.' };

    await prisma.pelanggan.create({
      data: { nik, nama, kategori },
    });

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

  if (!nik || !nama || !kategori) {
    return { error: 'Semua data pelanggan wajib diisi.' };
  }

  try {
    await prisma.pelanggan.update({
      where: { nik },
      data: { nama, kategori },
    });

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
    return { error: 'Data pelanggan gagal dihapus. Pastikan pelanggan ini tidak terikat dengan riwayat transaksi aktif.' };
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
