"use server"

import prisma from "@/app/lib/prisma";

// for cashier autocomplete
export async function searchPelanggan(query: string = "") {
  try {
    const data = await prisma.pelanggan.findMany({
      where: {
        OR: [
          { nama: { contains: query, mode: "insensitive" } },
          { nik: { contains: query } }
        ]
      },
      take: 5
    });
    return data;
  } catch (error) {
    console.error("db error:", error);
    return [];
  }
}

// for advanced data table
export async function fetchPelangganDataTable(
  query: string,
  kategori: string,
  sortKey: string,
  sortOrder: 'asc' | 'desc'
) {
  try {
    const where: any = {};
    
    if (query) {
      where.OR = [
        { nama: { contains: query, mode: "insensitive" } },
        { nik: { contains: query } }
      ];
    }
    
    if (kategori && kategori !== "ALL") {
      where.kategori = kategori;
    }

    const data = await prisma.pelanggan.findMany({
      where,
      orderBy: {
        [sortKey]: sortOrder
      }
    });
    return data;
  } catch (error) {
    console.error("db error:", error);
    return [];
  }
}

// save or update customer
export async function simpanPelanggan(data: { nik: string; nama: string; kategori: any; isEdit: boolean }) {
  try {
    if (data.isEdit) {
      await prisma.pelanggan.update({
        where: { nik: data.nik },
        data: { nama: data.nama, kategori: data.kategori }
      });
    } else {
      await prisma.pelanggan.create({
        data: { nik: data.nik, nama: data.nama, kategori: data.kategori }
      });
    }
    return { success: true };
  } catch (error: any) {
    if (error.code === 'P2002') return { error: "NIK sudah terdaftar di sistem!" };
    return { error: "Gagal menyimpan data pelanggan." };
  }
}

// delete customer (only if no transactions exist)
export async function hapusPelanggan(nik: string) {
  try {
    const txCount = await prisma.transaksi.count({ where: { nikPelanggan: nik } });
    if (txCount > 0) {
      return { error: "Pelanggan ini tidak dapat dihapus karena sudah memiliki riwayat transaksi." };
    }
    
    await prisma.pelanggan.delete({ where: { nik } });
    return { success: true };
  } catch (error) {
    console.error("db error:", error);
    return { error: "Gagal menghapus data pelanggan." };
  }
}

// fetch purchase history and stats
export async function fetchRiwayatDanStats(nik: string) {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // execute queries in parallel for speed
    const [hariIni, mingguIni, total, riwayat] = await Promise.all([
      prisma.transaksi.aggregate({
        where: { nikPelanggan: nik, tanggalTransaksi: { gte: startOfDay } },
        _sum: { jumlahTabung: true }
      }),
      prisma.transaksi.aggregate({
        where: { nikPelanggan: nik, tanggalTransaksi: { gte: startOfWeek } },
        _sum: { jumlahTabung: true }
      }),
      prisma.transaksi.aggregate({
        where: { nikPelanggan: nik },
        _sum: { jumlahTabung: true }
      }),
      prisma.transaksi.findMany({
        where: { nikPelanggan: nik },
        orderBy: { tanggalTransaksi: 'desc' },
        take: 10 // limit to last 10 transactions
      })
    ]);

    return {
      stats: {
        hariIni: hariIni._sum.jumlahTabung || 0,
        mingguIni: mingguIni._sum.jumlahTabung || 0,
        total: total._sum.jumlahTabung || 0
      },
      riwayat
    };
  } catch (error) {
    console.error("error fetch history:", error);
    return { error: "Gagal mengambil data riwayat." };
  }
}
