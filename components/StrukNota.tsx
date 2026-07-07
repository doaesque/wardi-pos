'use client';

import { useEffect, useState } from 'react';

interface TransaksiData {
  id: string;
  namaPelanggan: string;
  tanggal: string;
  jumlahTabung: number;
  totalHarga: number;
  namaKasir: string;
}

interface StrukNotaProps {
  transaksi: TransaksiData | null;
  onClose?: () => void;
}

export function StrukNota({ transaksi, onClose }: StrukNotaProps) {
  const [isPrinterEnabled, setIsPrinterEnabled] = useState(false);

  // check if printer feature is enabled in .env
  useEffect(() => {
    const printerStatus = process.env.NEXT_PUBLIC_ENABLE_PRINT_STRUK === 'true';
    setIsPrinterEnabled(printerStatus);
  }, []);

  // auto-trigger print when transaction data is present and printer is enabled
  useEffect(() => {
    if (transaksi && isPrinterEnabled) {
      // slight delay to ensure dom is updated
      const timer = setTimeout(() => {
        window.print();
        if (onClose) onClose();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [transaksi, isPrinterEnabled, onClose]);

  // if printer is disabled from .env or no data, do not render anything
  if (!isPrinterEnabled || !transaksi) return null;

  return (
    <>
      {/* global css for printing specifically for this component 
        this hides everything else and only shows the receipt on thermal paper
      */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm; /* standard small thermal printer width */
            padding: 0;
            margin: 0;
            font-family: monospace;
            font-size: 12px;
            color: black;
          }
          /* hide page headers and footers injected by the browser */
          @page {
            margin: 0;
          }
        }
      `}} />

      {/* the actual receipt layout hidden from normal view */}
      <div id="print-section" className="hidden print:block w-[58mm] bg-white text-black p-2 mx-auto">
        <div className="text-center mb-4">
          <h2 className="font-bold text-lg mb-1">PANGKALAN WARDI</h2>
          <p className="text-xs">Jl. Contoh Alamat No. 123</p>
          <p className="text-xs">Telp: 08123456789</p>
        </div>
        
        <div className="border-t border-dashed border-black my-2"></div>
        
        <div className="text-xs mb-2">
          <p>Tgl: {transaksi.tanggal}</p>
          <p>ID : {transaksi.id.substring(0, 8).toUpperCase()}</p>
          <p>Ksr: {transaksi.namaKasir}</p>
          <p>Plg: {transaksi.namaPelanggan}</p>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        <div className="text-xs">
          <div className="flex justify-between mb-1">
            <span>LPG 3Kg x{transaksi.jumlahTabung}</span>
            <span>Rp {transaksi.totalHarga.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2"></div>

        <div className="text-xs font-bold">
          <div className="flex justify-between">
            <span>TOTAL</span>
            <span>Rp {transaksi.totalHarga.toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="text-center mt-6 text-xs">
          <p>Terima Kasih</p>
          <p>Barang yang sudah dibeli</p>
          <p>tidak dapat ditukar</p>
        </div>
      </div>
    </>
  );
}
