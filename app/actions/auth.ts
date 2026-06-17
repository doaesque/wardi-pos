'use server';

import { cookies } from 'next/headers';
import prisma from '@/app/lib/prisma';

export async function loginUser(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // validate empty inputs
  if (!username || !password) {
    return { error: 'Nama pengguna dan kata sandi wajib diisi.' };
  }

  try {
    // find user in database
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return { error: 'Nama pengguna tidak terdaftar di dalam sistem.' };
    }

    // verify password
    if (user.password !== password) {
      return { error: 'Kata sandi yang Anda masukkan tidak tepat.' };
    }

    // create new work session log
    const sessionDb = await prisma.sesiKerja.create({
      data: {
        kasirId: user.id,
      },
    });

    const cookieStore = await cookies();

    // set cookie without maxAge to make it a session cookie
    // this ensures logout happens automatically when browser is closed
    cookieStore.set('wardi_session', JSON.stringify({
      id: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama,
      sesiId: sessionDb.id // save session id to close it later
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      // no maxAge property included
    });

    return { success: true };
  } catch (error) {
    return { error: 'Terjadi gangguan pada peladen. Silakan coba beberapa saat lagi.' };
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('wardi_session');

    // update work session end time if session exists
    if (sessionCookie) {
      const sessionData = JSON.parse(sessionCookie.value);

      if (sessionData.sesiId) {
        await prisma.sesiKerja.update({
          where: { id: sessionData.sesiId },
          data: { waktuSelesai: new Date() },
        });
      }
    }

    // destroy session cookie
    cookieStore.delete('wardi_session');
    return { success: true };
  } catch (error) {
    return { error: 'Terjadi gangguan saat memproses permintaan keluar.' };
  }
}
