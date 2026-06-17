'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { loginUser } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await loginUser(formData);
      
      if (result?.error) {
        setError(result.error);
      } else {
        // success, redirect to dashboard
        router.push('/');
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300">
      
      {/* theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md p-8 rounded-xl shadow-lg bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Masuk ke Sistem
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
            Pangkalan Wardi Sukardi
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          
          {/* error banner */}
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Nama Pengguna
            </label>
            <input
              type="text"
              name="username"
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
              name="password"
              required
              className="w-full px-4 py-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F] focus:border-[#52796F] outline-none transition"
              placeholder="Masukkan kata sandi"
            />
          </div>

          {/* explicit hex color to prevent black button issue */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-md text-white font-medium bg-[#52796F] hover:bg-[#43645a] transition duration-200 disabled:opacity-50"
          >
            {isPending ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

      </div>
    </div>
  );
}
