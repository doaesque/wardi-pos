'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-9 h-9" />; // placeholder

  // get actual theme state
  const currentTheme = theme === 'system' ? resolvedTheme : theme;

  return (
    <button
      onClick={() => setTheme(currentTheme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
      aria-label="Ubah Tema"
    >
      {currentTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
