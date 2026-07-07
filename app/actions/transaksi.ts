'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

type DataTransaksi = {
  nikPelanggan: string;
  jumlahTabung: number;
  idStatus: string;
};

export async function fetchRiwayatTransaksi() {
  try {
    const data = await prisma.transaksi.findMany({
      orderBy: { tanggalTransaksi: 'desc' },
      include: {
        pelanggan: {
          include: {
            kategori: true
          }
        },
        status: true
      }
    });
    return data;
  } catch (error) {
    console.error('terjadi kesalahan saat memuat data transaksi:', error);
    return [];
  }
}

export async function prosesTransaksiServer(data: DataTransaksi) {
  try {
    // validate required fields
    if (!data.nikPelanggan || !data.jumlahTabung || data.jumlahTabung <= 0 || !data.idStatus) {
      return { error: 'Data transaksi tidak lengkap atau jumlah tabung tidak valid.' };
    }

    // verify if customer exists in database
    const pelanggan = await prisma.pelanggan.findUnique({
      where: { nik: data.nikPelanggan },
      include: { kategori: true }
    });

    if (!pelanggan) {
      return { error: 'Pelanggan dengan NIK tersebut tidak ditemukan di basis data. Silakan daftarkan pelanggan terlebih dahulu.' };
    }

    // ensure product exists for relation
    let produk = await prisma.produk.findFirst();
    if (!produk) {
      // auto-create if product is missing
      produk = await prisma.produk.create({
        data: { idProduk: 'PR001', namaProduk: 'LPG 3 Kg', harga: 20000 }
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let usedQuota = 0;
    const maxQuota = pelanggan.kategori.batasKuota;

    // purchase limit logic based on 3nf schema attributes
    if (pelanggan.kategori.periodeKuota === 'HARI') {
      const dailyTransactions = await prisma.transaksi.findMany({
        where: {
          idPelanggan: pelanggan.idPelanggan,
          tanggalTransaksi: { gte: today }
        }
      });

      usedQuota = dailyTransactions.reduce((acc, curr) => acc + curr.jumlahTabung, 0);

      if (usedQuota >= maxQuota) {
        return { error: `Batas pembelian harian telah habis untuk kategori ${pelanggan.kategori.namaKategori}.` };
      } else if (usedQuota + data.jumlahTabung > maxQuota) {
        return { error: `Jumlah pesanan melebihi batas. Sisa kuota kategori ${pelanggan.kategori.namaKategori} hari ini adalah ${maxQuota - usedQuota} tabung.` };
      }
    } else if (pelanggan.kategori.periodeKuota === 'MINGGU') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 7);

      const weeklyTransactions = await prisma.transaksi.findMany({
        where: {
          idPelanggan: pelanggan.idPelanggan,
          tanggalTransaksi: { gte: sevenDaysAgo }
        }
      });

      usedQuota = weeklyTransactions.reduce((acc, curr) => acc + curr.jumlahTabung, 0);

      if (usedQuota >= maxQuota) {
        return { error: `Batas pembelian mingguan telah habis untuk kategori ${pelanggan.kategori.namaKategori}.` };
      } else if (usedQuota + data.jumlahTabung > maxQuota) {
        return { error: `Jumlah pesanan melebihi batas. Sisa kuota kategori ${pelanggan.kategori.namaKategori} minggu ini adalah ${maxQuota - usedQuota} tabung.` };
      }
    }

    // calculate dynamic price (harga per tabung)
    const hargaPerTabung = pelanggan.idKategori === 'K01' ? 20000 : 19000;
    const finalTotalHarga = data.jumlahTabung * hargaPerTabung;

    // create the transaction record
    await prisma.transaksi.create({
      data: {
        idPelanggan: pelanggan.idPelanggan,
        idProduk: produk.idProduk,
        idStatus: data.idStatus,
        jumlahTabung: data.jumlahTabung,
        totalHarga: finalTotalHarga,
      },
    });

    revalidatePath('/transaksi');
    return { success: true };
  } catch (error: any) {
    console.error('terjadi kesalahan sistem saat memproses transaksi:', error);
    return { error: `Transaksi ditolak oleh peladen. Detail: ${error.message || 'Kesalahan internal'}` };
  }
}
