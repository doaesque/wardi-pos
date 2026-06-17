"use client"

import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, User, Package, CreditCard, Search, X, AlertCircle, Printer, CheckCircle, XCircle } from 'lucide-react';
import { searchPelanggan } from '@/app/actions/pelanggan';
import { prosesTransaksiServer } from '@/app/actions/transaksi';
import { toPng } from 'html-to-image';
import Link from 'next/link';

export default function KasirPage() {
  const [query, setQuery] = useState("");
  const [hints, setHints] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // transaction & ui states
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState("TUNAI");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // custom modal state
  const [modal, setModal] = useState<{show: boolean, type: 'success'|'error', message: string}>({
    show: false, type: 'success', message: ''
  });
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const HARGA_PER_TABUNG = 16000;
  const totalHarga = quantity * HARGA_PER_TABUNG;

  // debounce search for dropdown hints
  useEffect(() => {
    const fetchHints = async () => {
      if (query.length < 2) {
        setHints([]);
        return;
      }
      setIsSearching(true);
      const results = await searchPelanggan(query);
      setHints(results);
      setIsSearching(false);
    };

    const timeoutId = setTimeout(fetchHints, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  // handle clearing the selected customer
  const clearSelection = () => {
    setSelectedCustomer(null);
    setQuery("");
    setHints([]);
  };

  // process transaction to db and export receipt
  const handleProsesTransaksi = async () => {
    if (!selectedCustomer || !receiptRef.current) return;
    setIsProcessing(true);

    try {
      // 1. check limit & save to database first
      const dbResult = await prosesTransaksiServer({
        nikPelanggan: selectedCustomer.nik,
        jumlahTabung: quantity,
        metodePembayaran: paymentMethod
      });

      if (dbResult.error) {
        setModal({ show: true, type: 'error', message: dbResult.error });
        setIsProcessing(false);
        return; // stop execution if limit reached
      }

      // 2. generate & download receipt as png
      const dataUrl = await toPng(receiptRef.current, {
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement("a");
      const timestamp = new Date().getTime();
      link.download = `nota-${selectedCustomer.nik}-${timestamp}.png`;
      link.href = dataUrl;
      link.click();

      // 3. show success popup & reset form
      setModal({ show: true, type: 'success', message: 'Transaksi berhasil disimpan dan nota telah diunduh!' });
      clearSelection();
      setQuantity(1);
      setPaymentMethod("TUNAI");

    } catch (error) {
      console.error("gagal memproses:", error);
      setModal({ show: true, type: 'error', message: 'Terjadi kesalahan saat mencetak nota.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(number);
  };

  const currentDate = new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

  return (
    // prevent full page scroll, fix height
    <div className="h-[calc(100vh-5rem)] flex flex-col space-y-6">
      
      {/* custom modal popup */}
      {modal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in duration-200">
            <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${modal.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
              {modal.type === 'success' ? <CheckCircle size={32} /> : <XCircle size={32} />}
            </div>
            <h3 className="text-xl font-bold text-center text-zinc-900 dark:text-white mb-2">
              {modal.type === 'success' ? 'Berhasil!' : 'Transaksi Ditolak'}
            </h3>
            <p className="text-center text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
              {modal.message}
            </p>
            <button
              onClick={() => setModal({ ...modal, show: false })}
              className={`w-full py-3 rounded-xl font-bold text-white transition ${modal.type === 'success' ? 'bg-[#52796F] hover:bg-[#43645a]' : 'bg-red-600 hover:bg-red-700'}`}
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* header section (fixed) */}
      <div className="flex-shrink-0">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Kasir Transaksi</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Catat penjualan LPG 3kg harian.</p>
      </div>

      {/* grid layout: scrollable form (left) & fixed receipt (right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 min-h-0">
        
        {/* left column: main form (scrollable within column) */}
        <div className="lg:col-span-8 h-full overflow-y-auto pr-2 pb-8 custom-scrollbar">
          <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* customer autocomplete */}
                <div className="space-y-2 relative md:col-span-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <User size={16} /> NIK / Nama Pelanggan
                  </label>
                  {selectedCustomer ? (
                    <div className="flex items-center justify-between p-4 rounded-lg border border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-900 dark:text-emerald-100">
                      <div>
                        <p className="font-bold text-lg">{selectedCustomer.nama}</p>
                        <p className="text-sm opacity-80 font-mono mt-1">NIK: {selectedCustomer.nik}</p>
                        <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-200 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300">
                          {selectedCustomer.kategori}
                        </span>
                      </div>
                      <button type="button" onClick={clearSelection} className="p-2 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 rounded-full transition">
                        <X size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                        <Search size={18} className="text-zinc-400" />
                      </div>
                      <input 
                        type="text" 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ketik nama atau NIK pelanggan..."
                        className="w-full pl-12 pr-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F] outline-none transition"
                      />
                      {query.length >= 2 && (
                        <div className="absolute z-10 w-full mt-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                          {isSearching ? (
                            <div className="p-4 text-sm text-zinc-500 text-center">Mencari...</div>
                          ) : hints.length > 0 ? (
                            hints.map((p) => (
                              <button key={p.nik} type="button" onClick={() => setSelectedCustomer(p)} className="w-full text-left px-5 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition border-b border-zinc-100 dark:border-zinc-700/50 last:border-0 flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{p.nama}</p>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">{p.nik}</p>
                                </div>
                                <span className="px-2 py-1 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400">{p.kategori}</span>
                              </button>
                            ))
                          ) : (
                            <div className="p-6 text-center">
                              <AlertCircle className="mx-auto text-zinc-400 mb-3" size={32} />
                              <p className="text-sm text-zinc-600 dark:text-zinc-400">Pelanggan tidak ditemukan.</p>
                              <Link href="/pelanggan" className="text-[#52796F] hover:underline text-sm font-semibold mt-2 inline-block">+ Tambah Baru</Link>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* tube quantity */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <Package size={16} /> Jumlah Tabung
                  </label>
                  <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F] outline-none text-lg font-semibold" />
                </div>

                {/* payment method */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                    <CreditCard size={16} /> Metode Pembayaran
                  </label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#52796F] outline-none text-lg">
                    <option value="TUNAI">Tunai</option>
                    <option value="TRANSFER">Transfer</option>
                  </select>
                </div>

                {/* total price */}
                <div className="space-y-2 md:col-span-2 bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                  <label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Pembayaran</label>
                  <p className="text-3xl font-bold text-zinc-900 dark:text-white mt-1">{formatRupiah(totalHarga)}</p>
                </div>
              </div>

              {/* submit action */}
              <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <button type="button" onClick={handleProsesTransaksi} disabled={!selectedCustomer || isProcessing} className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition text-lg shadow-sm ${selectedCustomer && !isProcessing ? "bg-[#52796F] hover:bg-[#43645a] text-white" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"}`}>
                  {isProcessing ? "Memproses..." : <><ShoppingCart size={20} /> Proses Transaksi & Cetak Nota</>}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* right column: receipt preview (fixed) */}
        <div className="lg:col-span-4 h-full hidden lg:flex flex-col">
          <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-3 flex items-center gap-2 uppercase tracking-wider flex-shrink-0">
            <Printer size={16} /> Pratinjau Struk
          </h3>
          
          <div className="bg-zinc-200 dark:bg-zinc-800 p-4 rounded-xl flex-1 overflow-hidden flex items-start justify-center">
            <div ref={receiptRef} className="bg-white text-black p-6 w-full max-w-[320px] shadow-sm font-mono text-sm leading-relaxed shrink-0">
              {/* receipt header */}
              <div className="text-center mb-6">
                <h2 className="font-bold text-lg uppercase tracking-widest">WardiPOS</h2>
                <p className="text-xs">Pangkalan Wardi Sukardi</p>
                <p className="text-xs mt-1">{currentDate}</p>
                <div className="border-b-2 border-dashed border-gray-400 mt-4 mb-1"></div>
              </div>

              {/* details */}
              <div className="mb-4 space-y-1">
                <div className="flex justify-between"><span className="text-gray-600">Pelanggan:</span><span className="font-semibold text-right max-w-[140px] truncate">{selectedCustomer ? selectedCustomer.nama : "-"}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">NIK:</span><span className="text-right">{selectedCustomer ? selectedCustomer.nik.substring(0, 8) + "********" : "-"}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Kategori:</span><span className="text-right">{selectedCustomer ? selectedCustomer.kategori : "-"}</span></div>
              </div>
              <div className="border-b-2 border-dashed border-gray-400 mb-4"></div>

              {/* items */}
              <div className="mb-4">
                <div className="flex justify-between font-bold mb-2"><span>Item</span><span>Subtotal</span></div>
                <div className="flex justify-between items-start">
                  <div><p>LPG 3Kg Melon</p><p className="text-xs text-gray-600">{quantity} x Rp16.000</p></div>
                  <div className="font-semibold">{formatRupiah(totalHarga)}</div>
                </div>
              </div>
              <div className="border-b-2 border-dashed border-gray-400 mb-4"></div>

              {/* total */}
              <div className="space-y-1 font-bold text-base mb-6">
                <div className="flex justify-between"><span>TOTAL:</span><span>{formatRupiah(totalHarga)}</span></div>
                <div className="flex justify-between text-sm font-normal mt-2"><span className="text-gray-600">Metode:</span><span>{paymentMethod}</span></div>
              </div>

              <div className="text-center text-xs text-gray-500 mt-8">
                <p>Terima kasih atas pembelian Anda!</p>
                <p>Simpan struk ini sebagai bukti.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
