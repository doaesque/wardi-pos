'use server';

import { cookies } from 'next/headers';
import prisma from '@/app/lib/prisma';

export async function loginUser(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Nama pengguna dan kata sandi wajib diisi.' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { error: 'Nama pengguna tidak terdaftar di dalam sistem.' };
    }

    if (user.password !== password) {
      return { error: 'Kata sandi yang Anda masukkan tidak tepat.' };
    }

    // await cookies for next.js 15+
    const cookieStore = await cookies();
    cookieStore.set('wardi_session', JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return { success: true };
  } catch (error) {
    return { error: 'Terjadi gangguan pada peladen. Silakan coba beberapa saat lagi.' };
  }
}

export async function logoutUser() {
  // await cookies for next.js 15+
  const cookieStore = await cookies();
  cookieStore.delete('wardi_session');
  return { success: true };
}
