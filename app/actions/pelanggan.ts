'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';
import { KategoriPelanggan } from '@prisma/client';

// add new customer
export async function addCustomer(formData: FormData) {
  const nik = formData.get('nik') as string;
  const nama = formData.get('nama') as string;
  const kategori = formData.get('kategori') as KategoriPelanggan;

  // validate empty inputs
  if (!nik || !nama || !kategori) {
    return { error: 'Semua data pelanggan wajib diisi.' };
  }

  // validate nik length (must be 16 digits)
  if (nik.length !== 16) {
    return { error: 'Nomor Induk Kependudukan (NIK) harus berjumlah tepat 16 angka.' };
  }

  try {
    // check if nik already exists
    const existingCustomer = await prisma.pelanggan.findUnique({
      where: { nik },
    });

    if (existingCustomer) {
      return { error: 'NIK tersebut sudah terdaftar di dalam sistem.' };
    }

    // create new customer
    await prisma.pelanggan.create({
      data: { nik, nama, kategori },
    });

    // refresh the data cache for the page
    revalidatePath('/pelanggan');
    return { success: true };
  } catch (error) {
    return { error: 'Terjadi kesalahan pada peladen saat menyimpan data.' };
  }
}

// delete customer
export async function deleteCustomer(nik: string) {
  try {
    // delete customer from database
    await prisma.pelanggan.delete({
      where: { nik },
    });

    revalidatePath('/pelanggan');
    return { success: true };
  } catch (error) {
    return { error: 'Data pelanggan gagal dihapus. Pastikan pelanggan ini tidak terikat dengan riwayat transaksi aktif.' };
  }
}

// search customer by nik or name for cashier interface
export async function searchPelanggan(query: string) {
  if (!query || query.trim() === '') {
    return [];
  }

  try {
    // search using logical or for nik or name
    const results = await prisma.pelanggan.findMany({
      where: {
        OR: [
          { nik: { contains: query } },
          { nama: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5, // limit results to prevent UI lag
    });

    return results;
  } catch (error) {
    console.error('error searching customer:', error);
    return [];
  }
}
