'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, User, CreditCard, Banknote, Minus, Plus, Receipt, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { searchPelanggan } from '@/app/actions/pelanggan';
import { prosesTransaksiServer } from '@/app/actions/transaksi';
import { toPng } from 'html-to-image';

// updated type to match 3nf relation from prisma
type Pelanggan = {
  nik: string;
  nama: string;
  idKategori: string;
  kategori: { namaKategori: string };
};

export default function KasirPage() {
  const [jumlahTabung, setJumlahTabung] = useState<number>(1);
  const [metodePembayaran, setMetodePembayaran] = useState<string>('S01'); // s01 = tunai, s02 = transfer
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Pelanggan[]>([]);
  const [selectedPelanggan, setSelectedPelanggan] = useState<Pelanggan | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const hiddenReceiptRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // set dynamic price based on category id (k01 is rumah tangga)
  let hargaPerTabung = 20000;
  if (selectedPelanggan && selectedPelanggan.idKategori !== 'K01') {
    hargaPerTabung = 19000;
  }

  const totalHarga = jumlahTabung * hargaPerTabung;

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        setIsSearching(true);
        const results = await searchPelanggan(searchQuery) as unknown as Pelanggan[];
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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
    if (!selectedPelanggan) { showNotification('Silakan pilih pelanggan terlebih dahulu.', 'error'); return; }
    if (jumlahTabung < 1) { showNotification('Jumlah tabung minimal adalah 1.', 'error'); return; }

    setIsProcessing(true);

    // send proper payload matching backend expectation
    const data = {
      nikPelanggan: selectedPelanggan.nik,
      jumlahTabung,
      idStatus: metodePembayaran
    };

    const res = await prosesTransaksiServer(data);

    if (res?.error) {
      showNotification(res.error, 'error');
    } else {
      // download receipt logic
      if (hiddenReceiptRef.current) {
        try {
          const dataUrl = await toPng(hiddenReceiptRef.current, { pixelRatio: 2, backgroundColor: '#ffffff' });
          const link = document.createElement("a");
          link.download = `nota-${selectedPelanggan.nik}-${new Date().getTime()}.png`;
          link.href = dataUrl;
          link.click();
        } catch (err) {
          console.error("gagal mencetak nota:", err);
        }
      }

      showNotification('Transaksi dicatat dan nota diunduh!', 'success');

      // clear form
      setSelectedPelanggan(null);
      setSearchQuery('');
      setJumlahTabung(1);
      setMetodePembayaran('S01');
    }
    setIsProcessing(false);
  };

  const currentDate = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="relative h-full flex flex-col">
      {notification && (
        <div className={`fixed top-20 md:top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium w-[90%] md:w-auto transition-all ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-900 dark:text-green-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-900 dark:text-red-300'}`}>
          {notification.type === 'success' ? <CheckCircle size={18} className="shrink-0" /> : <AlertTriangle size={18} className="shrink-0" />}
          <span className="leading-tight">{notification.message}</span>
        </div>
      )}

      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Kasir Utama</h1>

      <div className="flex flex-col lg:flex-row gap-6 items-start pb-36 lg:pb-0">

        {/* left column: input elements */}
        <div className="flex-1 w-full space-y-6">
          <div className="bg-white dark:bg-zinc-950 p-4 md:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-4 flex items-center gap-2"><User size={18} className="text-[#52796F]" /> Identitas Pelanggan</h2>
            {!selectedPelanggan ? (
              <div className="relative" ref={searchRef}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input type="text" placeholder="Ketik nama atau NIK..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 text-sm outline-none focus:border-[#52796F] transition" />
                </div>
                {searchQuery.length >= 1 && (
                  <div className="absolute z-10 mt-2 w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl overflow-hidden">
                    {isSearching ? <div className="p-4 text-sm text-zinc-500 text-center">Mencari...</div> : searchResults.length > 0 ? (
                      <ul className="max-h-60 overflow-y-auto">
                        {searchResults.map((p) => (
                          <li key={p.nik} onClick={() => { setSelectedPelanggan(p); setSearchQuery(''); setSearchResults([]); }} className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                            <div className="flex justify-between items-center">
                              <div><p className="font-medium text-sm md:text-base text-zinc-900 dark:text-white">{p.nama}</p><p className="text-xs text-zinc-500 font-mono mt-0.5">{p.nik}</p></div>
                              <span className="text-[10px] uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded font-semibold text-zinc-600 dark:text-zinc-400">{p.kategori.namaKategori}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : <div className="p-4 text-sm text-zinc-500 text-center">Tidak ditemukan.</div>}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-lg bg-[#52796F]/10 border border-[#52796F]/20">
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-white">{selectedPelanggan.nama}</p>
                  <div className="flex items-center gap-2 mt-1"><p className="text-xs text-zinc-500 font-mono">{selectedPelanggan.nik}</p><span className="text-[10px] uppercase tracking-wider bg-[#52796F]/20 text-[#52796F] px-2 py-0.5 rounded font-bold">{selectedPelanggan.kategori.namaKategori}</span></div>
                </div>
                <button onClick={() => setSelectedPelanggan(null)} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-md"><Trash2 size={18} /></button>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-950 p-4 md:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Pilih Produk</h2>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-4 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900/30">
              <div className="w-full text-center sm:text-left">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-white">Gas LPG 3 Kg</h3>
                <p className="text-sm text-zinc-500">Tabung Melon Bersubsidi</p>
                <p className="font-semibold text-[#52796F] mt-1">Rp {hargaPerTabung.toLocaleString('id-ID')}</p>
              </div>
              <div className="flex items-center w-full sm:w-auto justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-sm">
                <button onClick={() => setJumlahTabung(Math.max(1, jumlahTabung - 1))} className="p-3 md:p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"><Minus size={18} /></button>
                <div className="w-12 text-center font-bold text-lg text-zinc-900 dark:text-white">{jumlahTabung}</div>
                <button onClick={() => setJumlahTabung(jumlahTabung + 1)} className="p-3 md:p-4 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"><Plus size={18} /></button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 p-4 md:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Metode Pembayaran</h2>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <button onClick={() => setMetodePembayaran('S01')} className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 transition-all ${metodePembayaran === 'S01' ? 'border-[#52796F] bg-[#52796F]/5' : 'border-zinc-200 dark:border-zinc-800'}`}>
                <Banknote size={24} className={`mb-2 ${metodePembayaran === 'S01' ? 'text-[#52796F]' : 'text-zinc-400'}`} />
                <span className={`font-semibold text-sm ${metodePembayaran === 'S01' ? 'text-[#52796F]' : 'text-zinc-600 dark:text-zinc-400'}`}>Tunai</span>
              </button>
              <button onClick={() => setMetodePembayaran('S02')} className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-xl border-2 transition-all ${metodePembayaran === 'S02' ? 'border-[#52796F] bg-[#52796F]/5' : 'border-zinc-200 dark:border-zinc-800'}`}>
                <CreditCard size={24} className={`mb-2 ${metodePembayaran === 'S02' ? 'text-[#52796F]' : 'text-zinc-400'}`} />
                <span className={`font-semibold text-sm ${metodePembayaran === 'S02' ? 'text-[#52796F]' : 'text-zinc-600 dark:text-zinc-400'}`}>Transfer</span>
              </button>
            </div>
          </div>
        </div>

        {/* right column: cart panel */}
        <div className="w-full lg:w-[400px] lg:sticky lg:top-8 z-30">

          <div className="lg:bg-white lg:dark:bg-zinc-950 lg:rounded-xl lg:shadow-sm lg:border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col h-fit">

            {/* header & items (desktop only) */}
            <div className="hidden lg:block bg-white dark:bg-zinc-950">
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-between">
                <h2 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2"><Receipt size={18} className="text-[#52796F]" /> Keranjang Kasir</h2>
                <button onClick={() => {setJumlahTabung(1); setSelectedPelanggan(null);}} className="text-xs text-zinc-500 hover:text-red-500 font-medium">Bersihkan</button>
              </div>
              <div className="p-5 flex-1 min-h-[200px]">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-6 h-6 rounded bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-[#52796F] text-xs">{jumlahTabung}</div>
                    <div><p className="font-semibold text-zinc-900 dark:text-white">LPG 3 Kg</p><p className="text-xs text-zinc-500 mt-1">{selectedPelanggan ? selectedPelanggan.nama : <span className="text-red-400 italic">Belum dipilih</span>}</p></div>
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-white">Rp {totalHarga.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* mobile sticky floating bar, desktop integrated */}
            <div className="fixed bottom-0 left-0 right-0 lg:static border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 lg:bg-zinc-50 lg:dark:bg-zinc-900/50 shadow-[0_-8px_30px_-15px_rgba(0,0,0,0.3)] lg:shadow-none z-40">
              <div className="p-4 lg:p-5 lg:pb-4 space-y-1 lg:space-y-2 text-sm mb-2 lg:mb-0">
                <div className="flex justify-between text-zinc-500 lg:mb-2"><span>Metode</span><span className="font-medium text-zinc-700 dark:text-zinc-300">{metodePembayaran === 'S01' ? 'Tunai' : 'Transfer'}</span></div>
                <div className="flex justify-between items-center lg:pt-2 lg:mt-2 lg:border-t border-zinc-200 dark:border-zinc-700/50">
                  <span className="font-semibold text-zinc-900 dark:text-white">Total Tagihan</span>
                  <span className="font-bold text-xl md:text-2xl text-[#52796F]">Rp {totalHarga.toLocaleString('id-ID')}</span>
                </div>
              </div>
              <div className="px-4 pb-4 lg:p-0">
                <button onClick={handleCheckout} disabled={isProcessing || !selectedPelanggan || jumlahTabung < 1} className="w-full py-4 lg:py-5 rounded-xl lg:rounded-none bg-[#52796F] hover:bg-[#43645a] text-white font-bold text-lg flex justify-center items-center transition-colors disabled:opacity-50">
                  {isProcessing ? 'Memproses...' : 'Bayar Sekarang'}
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* hidden receipt area */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <div ref={hiddenReceiptRef} className="bg-white text-black p-6 w-[320px] font-mono text-sm leading-relaxed">
          <div className="text-center mb-6">
            <h2 className="font-bold text-lg uppercase tracking-widest">WardiPOS</h2>
            <p className="text-xs">Pangkalan Wardi Sukardi</p>
            <p className="text-xs mt-1">{currentDate}</p>
            <div className="border-b-2 border-dashed border-gray-400 mt-4 mb-1"></div>
          </div>
          <div className="mb-4 space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600">Pelanggan:</span>
              <span className="font-semibold text-right max-w-[140px] truncate">{selectedPelanggan ? selectedPelanggan.nama : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">NIK:</span>
              <span className="text-right">{selectedPelanggan ? selectedPelanggan.nik.substring(0, 8) + "********" : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Kategori:</span>
              <span className="text-right">{selectedPelanggan ? selectedPelanggan.kategori.namaKategori : "-"}</span>
            </div>
          </div>
          <div className="border-b-2 border-dashed border-gray-400 mb-4"></div>
          <div className="mb-4">
            <div className="flex justify-between font-bold mb-2">
              <span>Item</span><span>Subtotal</span>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <p>LPG 3Kg Melon</p>
                <p className="text-xs text-gray-600">{jumlahTabung} x Rp{hargaPerTabung.toLocaleString('id-ID')}</p>
              </div>
              <div className="font-semibold">Rp {totalHarga.toLocaleString('id-ID')}</div>
            </div>
          </div>
          <div className="border-b-2 border-dashed border-gray-400 mb-4"></div>
          <div className="space-y-1 font-bold text-base mb-6">
            <div className="flex justify-between">
              <span>TOTAL:</span><span>Rp {totalHarga.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-sm font-normal mt-2">
              <span className="text-gray-600">Metode:</span>
              <span>{metodePembayaran === 'S01' ? 'Tunai' : 'Transfer'}</span>
            </div>
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
