'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, User, CreditCard, Banknote, Minus, Plus, Receipt, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { searchPelanggan } from '@/app/actions/pelanggan';
import { prosesTransaksiServer } from '@/app/actions/transaksi';
import { MetodePembayaran } from '@prisma/client';
import { toPng } from 'html-to-image';

// define types
type Pelanggan = {
  nik: string;
  nama: string;
  kategori: string;
};

export default function KasirPage() {
  const [jumlahTabung, setJumlahTabung] = useState<number>(1);
  const [metodePembayaran, setMetodePembayaran] = useState<MetodePembayaran>(MetodePembayaran.TUNAI);
  
  // customer search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Pelanggan[]>([]);
  const [selectedPelanggan, setSelectedPelanggan] = useState<Pelanggan | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const hiddenReceiptRef = useRef<HTMLDivElement>(null);

  // transaction feedback states
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const hargaPerTabung = 18000;
  const totalHarga = jumlahTabung * hargaPerTabung;

  // helper for custom toast notification
  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // debounced customer search (triggered at 1 character minimum)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        setIsSearching(true);
        const results = await searchPelanggan(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCheckout = async () => {
    if (!selectedPelanggan) {
      showNotification('Silakan pilih pelanggan terlebih dahulu untuk memproses transaksi.', 'error');
      return;
    }

    if (jumlahTabung < 1) {
      showNotification('Jumlah tabung minimal adalah 1.', 'error');
      return;
    }

    setIsProcessing(true);
    
    const data = {
      nikPelanggan: selectedPelanggan.nik,
      jumlahTabung,
      metodePembayaran,
    };

    const res = await prosesTransaksiServer(data);
    
    if (res?.error) {
      showNotification(res.error, 'error');
    } else {
      // generate and download receipt
      if (hiddenReceiptRef.current) {
        try {
          const dataUrl = await toPng(hiddenReceiptRef.current, {
            pixelRatio: 2,
            backgroundColor: '#ffffff',
          });
          const link = document.createElement("a");
          const timestamp = new Date().getTime();
          link.download = `nota-${selectedPelanggan.nik}-${timestamp}.png`;
          link.href = dataUrl;
          link.click();
        } catch (err) {
          console.error("gagal mencetak nota:", err);
        }
      }

      showNotification('Transaksi berhasil dicatat dan nota telah diunduh!', 'success');
      
      // reset pos state for next customer
      setSelectedPelanggan(null);
      setSearchQuery('');
      setJumlahTabung(1);
      setMetodePembayaran(MetodePembayaran.TUNAI);
    }
    
    setIsProcessing(false);
  };

  const currentDate = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="relative h-full flex flex-col">
      {/* custom notification toast */}
      {notification && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-900 dark:text-green-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-900 dark:text-red-300'}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {notification.message}
        </div>
      )}

      {/* header */}
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Kasir Utama</h1>

      {/* pos layout: split left (controls) and right (cart) */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* left column: inputs & products */}
        <div className="flex-1 w-full space-y-6">
          
          {/* customer selection block */}
          <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-[#52796F]" /> Identitas Pelanggan
            </h2>
            
            {!selectedPelanggan ? (
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input
                    type="text"
                    placeholder="Ketik inisial atau NIK pelanggan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:border-[#52796F] transition"
                  />
                </div>
                
                {/* search dropdown */}
                {searchQuery.length >= 1 && (
                  <div className="absolute z-10 mt-2 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                    {isSearching ? (
                      <div className="p-4 text-sm text-zinc-500 text-center">Mencari...</div>
                    ) : searchResults.length > 0 ? (
                      <ul className="max-h-60 overflow-y-auto">
                        {searchResults.map((p) => (
                          <li 
                            key={p.nik} 
                            onClick={() => { setSelectedPelanggan(p); setSearchQuery(''); setSearchResults([]); }}
                            className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 transition-colors"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-zinc-900 dark:text-white">{p.nama}</p>
                                <p className="text-xs text-zinc-500 font-mono mt-0.5">{p.nik}</p>
                              </div>
                              <span className="text-[10px] uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded font-semibold text-zinc-600 dark:text-zinc-400">{p.kategori}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-sm text-zinc-500 text-center">Pelanggan tidak ditemukan.</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#52796F]/10 border border-[#52796F]/20">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">{selectedPelanggan.nama}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-zinc-500 font-mono">{selectedPelanggan.nik}</p>
                    <span className="text-[10px] uppercase tracking-wider bg-[#52796F]/20 text-[#52796F] px-2 py-0.5 rounded font-bold">{selectedPelanggan.kategori}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedPelanggan(null)} 
                  className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-md transition-colors"
                  title="Hapus Pilihan"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>

          {/* product selection block */}
          <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Pilih Produk</h2>
            
            <div className="flex items-center justify-between p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900/30">
              <div>
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Gas LPG 3 Kg</h3>
                <p className="text-sm text-zinc-500">Tabung Melon Bersubsidi</p>
                <p className="font-semibold text-[#52796F] mt-1">Rp {hargaPerTabung.toLocaleString('id-ID')}</p>
              </div>
              
              {/* quantity adjuster */}
              <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden shadow-sm">
                <button 
                  onClick={() => setJumlahTabung(Math.max(1, jumlahTabung - 1))}
                  className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                >
                  <Minus size={16} />
                </button>
                <div className="w-12 text-center font-bold text-zinc-900 dark:text-white">
                  {jumlahTabung}
                </div>
                <button 
                  onClick={() => setJumlahTabung(jumlahTabung + 1)}
                  className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* payment method block */}
          <div className="bg-white dark:bg-zinc-950 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Metode Pembayaran</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setMetodePembayaran(MetodePembayaran.TUNAI)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${metodePembayaran === MetodePembayaran.TUNAI ? 'border-[#52796F] bg-[#52796F]/5' : 'border-zinc-200 dark:border-zinc-800 hover:border-[#52796F]/50'}`}
              >
                <Banknote size={24} className={`mb-2 ${metodePembayaran === MetodePembayaran.TUNAI ? 'text-[#52796F]' : 'text-zinc-400'}`} />
                <span className={`font-semibold text-sm ${metodePembayaran === MetodePembayaran.TUNAI ? 'text-[#52796F]' : 'text-zinc-600 dark:text-zinc-400'}`}>Uang Tunai</span>
              </button>

              <button
                onClick={() => setMetodePembayaran(MetodePembayaran.TRANSFER)}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${metodePembayaran === MetodePembayaran.TRANSFER ? 'border-[#52796F] bg-[#52796F]/5' : 'border-zinc-200 dark:border-zinc-800 hover:border-[#52796F]/50'}`}
              >
                <CreditCard size={24} className={`mb-2 ${metodePembayaran === MetodePembayaran.TRANSFER ? 'text-[#52796F]' : 'text-zinc-400'}`} />
                <span className={`font-semibold text-sm ${metodePembayaran === MetodePembayaran.TRANSFER ? 'text-[#52796F]' : 'text-zinc-600 dark:text-zinc-400'}`}>Transfer Bank</span>
              </button>
            </div>
          </div>

        </div>

        {/* right column: pos receipt/cart panel */}
        <div className="w-full lg:w-[400px] bg-white dark:bg-zinc-950 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-fit lg:sticky lg:top-8 overflow-hidden">
          
          {/* cart header */}
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
             <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
               <Receipt size={18} className="text-[#52796F]" /> Keranjang Kasir
             </h2>
             <button 
               onClick={() => {setJumlahTabung(1); setSelectedPelanggan(null);}} 
               className="text-xs text-zinc-500 hover:text-red-500 font-medium transition-colors"
             >
               Bersihkan
             </button>
          </div>
          
          {/* cart items */}
          <div className="p-5 flex-1 min-h-[200px]">
             <div className="flex justify-between items-start">
                <div className="flex gap-4">
                   <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[#52796F] text-xs">
                     {jumlahTabung}
                   </div>
                   <div>
                      <p className="font-semibold text-zinc-900 dark:text-white">LPG 3 Kg</p>
                      {selectedPelanggan ? (
                        <p className="text-xs text-zinc-500 mt-1">{selectedPelanggan.nama} ({selectedPelanggan.kategori})</p>
                      ) : (
                        <p className="text-xs text-red-400 mt-1 italic">Pelanggan belum dipilih</p>
                      )}
                   </div>
                </div>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  Rp {totalHarga.toLocaleString('id-ID')}
                </span>
             </div>
          </div>
          
          {/* cart footer & checkout */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
             <div className="p-5 pb-4 space-y-2 text-sm">
                <div className="flex justify-between text-zinc-500">
                  <span>Subtotal</span>
                  <span>Rp {totalHarga.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-zinc-500">
                  <span>Metode</span>
                  <span>{metodePembayaran === 'TUNAI' ? 'Tunai' : 'Transfer'}</span>
                </div>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-700/50">
                  <span className="font-semibold text-zinc-900 dark:text-white">Total Tagihan</span>
                  <span className="font-bold text-xl text-[#52796F]">Rp {totalHarga.toLocaleString('id-ID')}</span>
                </div>
             </div>
             
             {/* big pay button */}
             <button 
               onClick={handleCheckout} 
               disabled={isProcessing || !selectedPelanggan || jumlahTabung < 1}
               className="w-full py-5 bg-[#52796F] hover:bg-[#43645a] text-white font-bold text-lg flex justify-between items-center px-6 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <span>{isProcessing ? 'Memproses...' : 'Bayar Sekarang'}</span>
               <span>Rp {totalHarga.toLocaleString('id-ID')}</span>
             </button>
          </div>

        </div>
      </div>

      {/* off-screen receipt for image generation (fixes 0 byte download issue) */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <div ref={hiddenReceiptRef} className="bg-white text-black p-6 w-[320px] font-mono text-sm leading-relaxed">
          <div className="text-center mb-6">
            <h2 className="font-bold text-lg uppercase tracking-widest">WardiPOS</h2>
            <p className="text-xs">Pangkalan Wardi Sukardi</p>
            <p className="text-xs mt-1">{currentDate}</p>
            <div className="border-b-2 border-dashed border-gray-400 mt-4 mb-1"></div>
          </div>
          <div className="mb-4 space-y-1">
            <div className="flex justify-between"><span className="text-gray-600">Pelanggan:</span><span className="font-semibold text-right max-w-[140px] truncate">{selectedPelanggan ? selectedPelanggan.nama : "-"}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">NIK:</span><span className="text-right">{selectedPelanggan ? selectedPelanggan.nik.substring(0, 8) + "********" : "-"}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Kategori:</span><span className="text-right">{selectedPelanggan ? selectedPelanggan.kategori : "-"}</span></div>
          </div>
          <div className="border-b-2 border-dashed border-gray-400 mb-4"></div>
          <div className="mb-4">
            <div className="flex justify-between font-bold mb-2"><span>Item</span><span>Subtotal</span></div>
            <div className="flex justify-between items-start">
              <div><p>LPG 3Kg Melon</p><p className="text-xs text-gray-600">{jumlahTabung} x Rp{hargaPerTabung.toLocaleString('id-ID')}</p></div>
              <div className="font-semibold">Rp {totalHarga.toLocaleString('id-ID')}</div>
            </div>
          </div>
          <div className="border-b-2 border-dashed border-gray-400 mb-4"></div>
          <div className="space-y-1 font-bold text-base mb-6">
            <div className="flex justify-between"><span>TOTAL:</span><span>Rp {totalHarga.toLocaleString('id-ID')}</span></div>
            <div className="flex justify-between text-sm font-normal mt-2"><span className="text-gray-600">Metode:</span><span>{metodePembayaran === 'TUNAI' ? 'Tunai' : 'Transfer'}</span></div>
          </div>
          <div className="text-center text-xs text-gray-500 mt-8">
            <p>Terima kasih atas pembelian Anda!</p>
            <p>Simpan struk ini sebagai bukti.</p>
          </div>
        </div>
      </div>
      
    </div>
  );
}
