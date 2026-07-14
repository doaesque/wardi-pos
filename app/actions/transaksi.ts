'use server';

import prisma from '@/app/lib/prisma';
import { revalidatePath } from 'next/cache';

// expect string 'Tunai' or 'Transfer' from client ui
type DataTransaksi = {
  nikPelanggan: string;
  jumlahTabung: number;
  totalHarga?: number;
  metodePembayaran: string;
};

export async function fetchRiwayatTransaksi() {
  try {
    const data = await prisma.transaksi.findMany({
      orderBy: { tanggalTransaksi: 'desc' },
      include: {
        status: { select: { namaStatus: true } },
        pelanggan: {
          select: {
            nama: true,
            kategori: { select: { namaKategori: true } }
          }
        }
      }
    });
    return data;
  } catch (error) {
    console.error('error fetching transactions:', error);
    return [];
  }
}

export async function prosesTransaksiServer(data: DataTransaksi) {
  try {
    // validate required fields
    if (!data.nikPelanggan || !data.jumlahTabung || data.jumlahTabung <= 0 || !data.metodePembayaran) {
      return { error: 'Data transaksi tidak lengkap atau jumlah tabung tidak valid.' };
    }

    // verify if customer exists in database, include category rules
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
        data: { namaProduk: 'LPG 3 Kg', harga: 20000 }
      });
    }

    // get payment status id based on string sent by frontend
    const statusPembayaran = await prisma.statusPembayaran.findUnique({
      where: { namaStatus: data.metodePembayaran }
    });

    if (!statusPembayaran) {
      return { error: 'Metode pembayaran tidak valid di database.' };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let usedQuota = 0;
    const maxQuota = pelanggan.kategori.batasKuota;

    // --- dynamic purchase limit logic ---
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

    // calculate dynamic price
    const hargaPerTabung = pelanggan.kategori.namaKategori === 'Rumah Tangga' ? 20000 : 19000;
    const finalTotalHarga = data.jumlahTabung * hargaPerTabung;

    // create the transaction record using foreign key
    await prisma.transaksi.create({
      data: {
        idPelanggan: pelanggan.idPelanggan,
        idProduk: produk.idProduk,
        jumlahTabung: data.jumlahTabung,
        totalHarga: finalTotalHarga,
        idStatus: statusPembayaran.idStatus,
      },
    });

    revalidatePath('/transaksi');
    return { success: true };
  } catch (error) {
    console.error('transaction error:', error);

    // type safe error parsing
    const errorMessage = error instanceof Error ? error.message : 'Kesalahan internal';
    return { error: `Transaksi ditolak oleh peladen. Detail: ${errorMessage}` };
  }
}
