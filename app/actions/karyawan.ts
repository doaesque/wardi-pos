'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function addEmployee(formData: FormData) {
  const nama = formData.get('nama') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;

  // validate empty inputs
  if (!nama || !username || !password || !role) {
    return { error: 'Semua kolom formulir wajib diisi.' };
  }

  try {
    // check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return { error: 'Nama pengguna tersebut sudah terdaftar di dalam sistem.' };
    }

    // create new employee
    await prisma.user.create({
      data: {
        nama,
        username,
        password, // note: use bcrypt in production
        role,
      },
    });

    // refresh the page data
    revalidatePath('/karyawan');
    return { success: true };
  } catch (error) {
    return { error: 'Terjadi kesalahan saat menyimpan data karyawan pada peladen.' };
  }
}

export async function deleteEmployee(id: string) {
  try {
    // delete employee from database
    await prisma.user.delete({
      where: { id },
    });

    revalidatePath('/karyawan');
    return { success: true };
  } catch (error) {
    return { error: 'Terjadi kesalahan saat menghapus data karyawan. Pastikan karyawan ini tidak memiliki riwayat transaksi aktif.' };
  }
}
