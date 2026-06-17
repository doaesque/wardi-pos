'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // temporary routing to dashboard
    router.push('/');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      {/* top right theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md p-8 rounded-xl shadow-lg bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            {isLogin ? 'Masuk ke Sistem' : 'Daftar Akun Baru'}
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Pangkalan Wardi Sukardi
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] outline-none transition"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Peran Akses
                </label>
                <select className="w-full px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F] outline-none transition">
                  <option value="KASIR">Kasir</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nama Pengguna
            </label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] outline-none transition"
              placeholder="Masukkan nama pengguna"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Kata Sandi
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] outline-none transition"
              placeholder="Masukkan kata sandi"
            />
          </div>

          {/* accent button */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-md text-white font-medium bg-[#52796F] hover:bg-[#43645a] transition duration-200"
          >
            {isLogin ? 'Masuk' : 'Daftar'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          {isLogin ? 'Belum memiliki akun? ' : 'Sudah memiliki akun? '}
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold text-[#52796F] hover:underline"
          >
            {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
          </button>
        </div>

      </div>
    </div>
  );
}
