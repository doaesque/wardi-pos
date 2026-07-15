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

  // automatically close sidebar on page change in mobile
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
      {/* mobile top navbar (only visible on mobile) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#52796F] dark:bg-[#1a2622] text-white z-40 flex items-center justify-between px-4 shadow-md">
        <Link href="/" className="text-xl font-black tracking-widest drop-shadow-md text-white select-none inline-block">
          WARDI<span className="text-[#a1cbbc] dark:text-[#52796F]">POS</span>
        </Link>
        <button onClick={() => setIsOpen(true)} className="p-2 -mr-2 text-white/90 hover:text-white transition-colors">
          <Menu size={24} />
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
      <aside className={`fixed md:sticky top-0 left-0 z-50 h-[100dvh] w-72 md:w-64 bg-[#52796F] dark:bg-[#1a2622] text-white flex flex-col transition-transform duration-300 shadow-2xl md:shadow-xl ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>

        {/* mobile close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden absolute top-4 right-4 p-2 bg-black/10 rounded-full text-white/80 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6 border-b border-white/10 mt-2 md:mt-0">
          <Link href="/" className="text-3xl font-black tracking-widest drop-shadow-md text-white select-none inline-block hover:opacity-80 transition-opacity hidden md:block">
            WARDI<span className="text-[#a1cbbc] dark:text-[#52796F]">POS</span>
          </Link>
          <div className="md:hidden text-2xl font-black tracking-widest drop-shadow-md text-white select-none">
            MENU <span className="text-[#a1cbbc] dark:text-[#52796F]">SISTEM</span>
          </div>
          <p className="text-sm text-white/70 mt-1 select-none font-medium">Manajemen LPG 3 Kg</p>
        </div>

        <nav className="flex flex-col p-4 gap-2 grow overflow-y-auto">
          <Link href="/" className={`p-3 rounded-lg transition-all duration-200 font-medium ${isActive('/') ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>Kasir Utama</Link>
          <Link href="/pelanggan" className={`p-3 rounded-lg transition-all duration-200 font-medium ${isActive('/pelanggan') ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>Data Pelanggan</Link>
          {user?.role === 'ADMIN' && (
            <>
              <Link href="/transaksi" className={`p-3 rounded-lg transition-all duration-200 font-medium ${isActive('/transaksi') ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>Riwayat Transaksi</Link>
              <Link href="/karyawan" className={`p-3 rounded-lg transition-all duration-200 font-medium ${isActive('/karyawan') ? 'bg-white/20 text-white shadow-inner' : 'text-white/80 hover:bg-white/10 hover:text-white'}`}>Data Karyawan</Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 flex flex-col gap-4 bg-black/5 dark:bg-black/20">
          <div className="flex items-center justify-between bg-black/10 dark:bg-black/30 p-3 rounded-lg border border-white/10">
            <div className="flex flex-col w-32 overflow-hidden">
              <span className="text-sm font-bold text-white truncate">{roleName}</span>
              <span className="text-xs text-white/70 truncate">{user?.username || 'Belum Masuk'}</span>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-md bg-white/5 hover:bg-red-500 text-white/90 hover:text-white transition-all duration-200" title="Keluar">
              <LogOut size={18} />
            </button>
          </div>
          <div className="flex items-center justify-between px-1">
            <div className="bg-white/10 rounded-full p-0.5"><ThemeToggle /></div>
            <div className="text-[10px] text-white/50 text-right leading-tight select-none font-medium">&copy; 2026<br/>Pangkalan Wardi</div>
          </div>
        </div>
      </aside>
    </>
  );
}
