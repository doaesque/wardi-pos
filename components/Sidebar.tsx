'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Sidebar() {
  const router = useRouter();

  const handleLogout = () => {
    // temporary logout routing
    router.push('/login');
  };

  return (
    <aside className="w-64 bg-zinc-900 dark:bg-zinc-950 text-white flex flex-col h-screen sticky top-0 border-r border-zinc-800 transition-colors duration-300">
      
      {/* brand logo */}
      <div className="p-6 border-b border-zinc-800">
        <h1 className="text-2xl font-bold tracking-wider text-white">WardiPOS</h1>
        <p className="text-sm text-zinc-400 mt-1">Manajemen LPG 3 Kg</p>
      </div>

      {/* nav links */}
      <nav className="flex flex-col p-4 gap-2 flex-grow">
        <Link 
          href="/" 
          className="p-3 rounded-lg hover:bg-[#52796F]/30 hover:text-white transition-colors"
        >
          Kasir
        </Link>
        <Link 
          href="/pelanggan" 
          className="p-3 rounded-lg hover:bg-[#52796F]/30 hover:text-white transition-colors"
        >
          Data Pelanggan
        </Link>
        <Link 
          href="/transaksi" 
          className="p-3 rounded-lg hover:bg-[#52796F]/30 hover:text-white transition-colors"
        >
          Riwayat Transaksi
        </Link>
      </nav>

      {/* footer controls */}
      <div className="p-4 border-t border-zinc-800 flex flex-col gap-4">
        
        {/* user info & logout */}
        <div className="flex items-center justify-between bg-zinc-800/50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-zinc-100">Administrator</span>
            <span className="text-xs text-[#52796F]">admin</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 rounded-md hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
            title="Keluar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {/* theme & copyright */}
        <div className="flex items-center justify-between px-1">
          <ThemeToggle />
          <div className="text-[10px] text-zinc-500 text-right leading-tight">
            &copy; 2026<br/>Pangkalan Wardi
          </div>
        </div>

      </div>
    </aside>
  );
}
