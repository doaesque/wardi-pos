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
    // added a subtle green tint to the light background
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f0f4f3] dark:bg-zinc-950 transition-colors duration-300 px-4">

      {/* theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* added green top border accent and adjusted padding to be more compact */}
      <div className="w-full max-w-[400px] p-6 sm:p-8 rounded-xl shadow-xl bg-white dark:bg-zinc-900 border-t-4 border-t-[#52796F] border-x border-b border-zinc-100 dark:border-zinc-800/50">

        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
            Masuk ke Sistem
          </h1>
          <p className="text-sm text-[#52796F] dark:text-[#84a99f] mt-1 font-medium">
            Pangkalan Wardi Sukardi
          </p>
        </div>

        {/* reduced space between form elements */}
        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* error banner */}
          {error && (
            <div className="p-2.5 text-sm text-red-600 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-center font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Nama Pengguna
            </label>
            <input
              type="text"
              name="username"
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F]/50 focus:border-[#52796F] outline-none transition"
              placeholder="Masukkan nama pengguna"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Kata Sandi
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F]/50 focus:border-[#52796F] outline-none transition"
              placeholder="Masukkan kata sandi"
            />
          </div>

          {/* explicit hex color to prevent black button issue */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 mt-2 rounded-lg text-white text-sm font-bold bg-[#52796F] hover:bg-[#43645a] transition duration-200 disabled:opacity-50 shadow-sm"
          >
            {isPending ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

      </div>
    </div>
  );
}
