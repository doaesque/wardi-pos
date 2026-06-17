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
    <aside className="w-64 bg-[#52796F] dark:bg-[#1a2622] text-white flex flex-col h-screen sticky top-0 transition-colors duration-300 shadow-xl">
      
      {/* brand logo - anti highlight link */}
      <div className="p-6 border-b border-white/10">
        <Link 
          href="/" 
          className="text-3xl font-black tracking-widest drop-shadow-md text-white select-none inline-block hover:opacity-80 transition-opacity"
        >
          WARDI<span className="text-[#a1cbbc] dark:text-[#52796F]">POS</span>
        </Link>
        <p className="text-sm text-white/70 mt-1 select-none font-medium">Manajemen LPG 3 Kg</p>
      </div>

      {/* nav links */}
      <nav className="flex flex-col p-4 gap-2 grow">
        <Link 
          href="/" 
          className={`p-3 rounded-lg transition-all duration-200 font-medium ${isActive('/') ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
        >
          Kasir Utama
        </Link>
        <Link 
          href="/pelanggan" 
          className={`p-3 rounded-lg transition-all duration-200 font-medium ${isActive('/pelanggan') ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
        >
          Data Pelanggan
        </Link>
        <Link 
          href="/transaksi" 
          className={`p-3 rounded-lg transition-all duration-200 font-medium ${isActive('/transaksi') ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
        >
          Riwayat Transaksi
        </Link>
        
        {/* admin only link */}
        {user?.role === 'ADMIN' && (
          <Link 
            href="/karyawan" 
            className={`p-3 rounded-lg transition-all duration-200 font-medium ${isActive('/karyawan') ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}
          >
            Data Karyawan
          </Link>
        )}
      </nav>

      {/* footer controls */}
      <div className="p-4 border-t border-white/10 flex flex-col gap-4 bg-black/5 dark:bg-black/20">
        
        {/* user info & logout control */}
        <div className="flex items-center justify-between bg-black/10 dark:bg-black/30 p-3 rounded-lg border border-white/10">
          <div className="flex flex-col w-32 overflow-hidden">
            <span className="text-sm font-bold text-white truncate">{roleName}</span>
            {/* adjusted color to contrast with the green background */}
            <span className="text-xs text-white/70 truncate">{user?.username || 'Belum Masuk'}</span>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 rounded-md bg-white/5 hover:bg-red-500 text-white/90 hover:text-white transition-all duration-200"
            title="Keluar dari sistem"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* theme toggle & copyright */}
        <div className="flex items-center justify-between px-1">
          <div className="bg-white/10 rounded-full p-0.5">
            <ThemeToggle />
          </div>
          <div className="text-[10px] text-white/50 text-right leading-tight select-none font-medium">
            &copy; 2026<br/>Pangkalan Wardi
          </div>
        </div>

      </div>
    </aside>
  );
}
