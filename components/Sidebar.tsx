'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';

export function Sidebar({ user }: { user?: any }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    // destroy session on server and redirect
    await logoutUser();
    router.push('/login');
  };

  // format role for display
  const roleName = user?.role === 'ADMIN' ? 'Administrator' : 'Petugas Kasir';

  // helper function to check active path
  const isActive = (path: string) => pathname === path;

  return (
    <aside className="w-64 bg-zinc-900 dark:bg-zinc-950 text-white flex flex-col h-screen sticky top-0 border-r border-zinc-800 transition-colors duration-300">
      
      {/* brand logo - anti highlight link */}
      <div className="p-6 border-b border-zinc-800">
        <Link 
          href="/" 
          className="text-2xl font-bold tracking-wider text-white select-none inline-block hover:text-[#52796F] transition-colors"
        >
          WardiPOS
        </Link>
        <p className="text-sm text-zinc-400 mt-1 select-none">Manajemen LPG 3 Kg</p>
      </div>

      {/* nav links */}
      <nav className="flex flex-col p-4 gap-2 grow">
        <Link 
          href="/" 
          className={`p-3 rounded-lg transition-colors ${isActive('/') ? 'bg-[#52796F] text-white' : 'hover:bg-[#52796F]/30 hover:text-white'}`}
        >
          Kasir Utama
        </Link>
        <Link 
          href="/pelanggan" 
          className={`p-3 rounded-lg transition-colors ${isActive('/pelanggan') ? 'bg-[#52796F] text-white' : 'hover:bg-[#52796F]/30 hover:text-white'}`}
        >
          Data Pelanggan
        </Link>
        <Link 
          href="/transaksi" 
          className={`p-3 rounded-lg transition-colors ${isActive('/transaksi') ? 'bg-[#52796F] text-white' : 'hover:bg-[#52796F]/30 hover:text-white'}`}
        >
          Riwayat Transaksi
        </Link>
        
        {/* admin only link */}
        {user?.role === 'ADMIN' && (
          <Link 
            href="/karyawan" 
            className={`p-3 rounded-lg transition-colors ${isActive('/karyawan') ? 'bg-[#52796F] text-white' : 'hover:bg-[#52796F]/30 hover:text-white'}`}
          >
            Data Karyawan
          </Link>
        )}
      </nav>

      {/* footer controls */}
      <div className="p-4 border-t border-zinc-800 flex flex-col gap-4">
        
        {/* user info & logout control */}
        <div className="flex items-center justify-between bg-zinc-800/50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-700/50">
          <div className="flex flex-col w-32 overflow-hidden">
            <span className="text-sm font-medium text-zinc-100 truncate">{roleName}</span>
            <span className="text-xs text-[#52796F] truncate">{user?.username || 'Belum Masuk'}</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 rounded-md hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
            title="Keluar dari sistem"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* theme toggle & copyright */}
        <div className="flex items-center justify-between px-1">
          <ThemeToggle />
          <div className="text-[10px] text-zinc-500 text-right leading-tight select-none">
            &copy; 2026<br/>Pangkalan Wardi
          </div>
        </div>

      </div>
    </aside>
  );
}
