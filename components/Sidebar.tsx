'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogOut, Menu, X } from 'lucide-react';
import { logoutUser } from '@/app/actions/auth';

export function Sidebar({ user }: { user?: any }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  // automatically close sidebar when changing pages on mobile
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await logoutUser();
    router.push('/login');
  };

  const roleName = user?.role === 'ADMIN' ? 'Administrator' : 'Petugas Kasir';
  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* mobile top navbar (only appears on mobile) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-[#52796F] dark:bg-[#1a2622] text-white z-40 flex items-center justify-between px-4 shadow-sm border-b border-white/5">
        <Link href="/" className="text-lg font-black tracking-widest drop-shadow-sm text-white select-none inline-block">
          WARDI<span className="text-[#a1cbbc] dark:text-[#52796F]">POS</span>
        </Link>
        <button onClick={() => setIsOpen(true)} className="p-1.5 -mr-1.5 text-white/90 hover:text-white transition-colors">
          <Menu size={22} />
        </button>
      </div>

      {/* transparent black backdrop for mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* main sidebar (drawer on mobile, fixed on desktop) */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 h-[100dvh] w-64 bg-[#52796F] dark:bg-[#1a2622] text-white flex flex-col transition-transform duration-300 shadow-2xl md:shadow-lg border-r border-black/10 dark:border-white/5 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* close button specifically for mobile */}
        <button 
          onClick={() => setIsOpen(false)} 
          className="md:hidden absolute top-3 right-3 p-1.5 bg-black/10 rounded-md text-white/80 hover:text-white hover:bg-black/20 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="p-5 border-b border-white/10 mt-1 md:mt-0">
          <Link href="/" className="text-2xl font-black tracking-widest drop-shadow-sm text-white select-none inline-block hover:opacity-80 transition-opacity hidden md:block">
            WARDI<span className="text-[#a1cbbc] dark:text-[#52796F]">POS</span>
          </Link>
          <div className="md:hidden text-xl font-black tracking-widest drop-shadow-sm text-white select-none">
            MENU <span className="text-[#a1cbbc] dark:text-[#52796F]">SISTEM</span>
          </div>
          <p className="text-xs text-white/70 mt-1 select-none font-medium">Manajemen LPG 3 Kg</p>
        </div>

        <nav className="flex flex-col p-3 gap-1.5 grow overflow-y-auto">
          <Link href="/" className={`px-3 py-2.5 text-sm rounded-lg transition-all duration-200 font-medium ${isActive('/') ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>Kasir Utama</Link>
          <Link href="/pelanggan" className={`px-3 py-2.5 text-sm rounded-lg transition-all duration-200 font-medium ${isActive('/pelanggan') ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>Data Pelanggan</Link>
          <Link href="/transaksi" className={`px-3 py-2.5 text-sm rounded-lg transition-all duration-200 font-medium ${isActive('/transaksi') ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>Riwayat Transaksi</Link>
          {user?.role === 'ADMIN' && (
            <Link href="/karyawan" className={`px-3 py-2.5 text-sm rounded-lg transition-all duration-200 font-medium ${isActive('/karyawan') ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>Data Karyawan</Link>
          )}
        </nav>

        <div className="p-3 border-t border-white/10 flex flex-col gap-3 bg-black/5 dark:bg-black/20">
          <div className="flex items-center justify-between bg-black/10 dark:bg-black/30 p-2.5 rounded-lg border border-white/10">
            <div className="flex flex-col overflow-hidden px-1">
              <span className="text-xs font-bold text-white truncate">{roleName}</span>
              <span className="text-[11px] text-white/70 truncate">{user?.username || 'Belum Masuk'}</span>
            </div>
            <button onClick={handleLogout} className="p-1.5 rounded-md bg-white/5 hover:bg-red-500/90 text-white/90 hover:text-white transition-all duration-200" title="Keluar">
              <LogOut size={16} />
            </button>
          </div>
          <div className="flex items-center justify-between px-1">
            <div className="bg-white/10 rounded-full p-0.5"><ThemeToggle /></div>
            <div className="text-[10px] text-white/50 text-right leading-tight select-none font-medium">
              &copy; 2026 WardiPOS
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
