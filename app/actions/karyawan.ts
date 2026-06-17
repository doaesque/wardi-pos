'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

// add new employee
export async function addEmployee(formData: FormData) {
  const nama = formData.get('nama') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string;
  const jadwalStr = formData.get('jadwal') as string;

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

    // parse scheduled shifts
    const jadwalList = jadwalStr ? JSON.parse(jadwalStr) : [];

    // create new employee
    await prisma.user.create({
      data: {
        nama,
        username,
        password, // note: use bcrypt in production
        role,
        jadwalShift: {
          create: jadwalList.map((j: any) => ({ hari: j.hari, shift: j.shift }))
        }
      },
    });

    // refresh the page data
    revalidatePath('/karyawan');
    return { success: true };
  } catch (error) {
    return { error: 'Terjadi kesalahan saat menyimpan data karyawan pada peladen.' };
  }
}

// update existing employee
export async function editEmployee(formData: FormData) {
  const id = formData.get('id') as string;
  const nama = formData.get('nama') as string;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string; // optional
  const role = formData.get('role') as string;
  const jadwalStr = formData.get('jadwal') as string;

  if (!id || !nama || !username || !role) {
    return { error: 'Kolom nama, pengguna, dan peran wajib diisi.' };
  }

  try {
    // check username collision
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser && existingUser.id !== id) {
      return { error: 'Nama pengguna tersebut sudah dipakai oleh akun lain.' };
    }

    // parse scheduled shifts
    const jadwalList = jadwalStr ? JSON.parse(jadwalStr) : [];

    // prepare update payload
    const updateData: any = { 
      nama, 
      username, 
      role,
      jadwalShift: {
        deleteMany: {}, // clear existing shifts
        create: jadwalList.map((j: any) => ({ hari: j.hari, shift: j.shift }))
      }
    };
    
    if (password && password.trim() !== '') {
      updateData.password = password; // update password only if provided
    }

    // update in database
    await prisma.user.update({
      where: { id },
      data: updateData,
    });

    revalidatePath('/karyawan');
    return { success: true };
  } catch (error) {
    return { error: 'Terjadi kesalahan saat memperbarui data karyawan.' };
  }
}

// delete employee
export async function deleteEmployee(id: string) {
  try {
    // delete employee from database
    await prisma.user.delete({
      where: { id },
    });

    revalidatePath('/karyawan');
    return { success: true };
  } catch (error) {
    return { error: 'Terjadi kesalahan sistem saat menghapus data karyawan.' };
  }
}
