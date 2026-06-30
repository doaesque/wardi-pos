import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('starting database seeding...');

  // seed default admin account
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      nama: 'Admin',
      username: 'admin',
      password: 'admin123',
      role: 'ADMIN',
    },
  });
  console.log('default admin account created.');

  // seed default kasir account
  await prisma.user.upsert({
    where: { username: 'kasir' },
    update: {},
    create: {
      nama: 'Kasir',
      username: 'kasir',
      password: 'kasir123',
      role: 'KASIR',
    },
  });
  console.log('default kasir account created.');

  // ensure product exists for relation
  const lpg = await prisma.produk.upsert({
    where: { idProduk: 'PR001' },
    update: {},
    create: {
      idProduk: 'PR001',
      namaProduk: 'LPG 3 Kg',
      harga: 20000,
    }
  });
  console.log('produk master (lpg 3 kg) created.');

  // seed payment methods
  await prisma.statusPembayaran.upsert({
    where: { namaStatus: 'Tunai' },
    update: {},
    create: { namaStatus: 'Tunai' }
  });
  await prisma.statusPembayaran.upsert({
    where: { namaStatus: 'Transfer' },
    update: {},
    create: { namaStatus: 'Transfer' }
  });
  console.log('payment methods created.');

  // seed customer categories based on quota rules
  const kategoriRT = await prisma.kategoriPelanggan.upsert({
    where: { namaKategori: 'Rumah Tangga' },
    update: {},
    create: { namaKategori: 'Rumah Tangga', batasKuota: 1, periodeKuota: 'HARI' }
  });

  const kategoriUM = await prisma.kategoriPelanggan.upsert({
    where: { namaKategori: 'UM' },
    update: {},
    create: { namaKategori: 'UM', batasKuota: 2, periodeKuota: 'HARI' }
  });

  const kategoriWarung = await prisma.kategoriPelanggan.upsert({
    where: { namaKategori: 'Warung/Pengecer' },
    update: {},
    create: { namaKategori: 'Warung/Pengecer', batasKuota: 10, periodeKuota: 'MINGGU' }
  });
  console.log('customer categories and quotas created.');

  // use process.cwd() to safely navigate from root directory
  const csvPath = path.join(process.cwd(), 'prisma', 'data', 'pelanggan.csv');

  if (!fs.existsSync(csvPath)) {
    console.error('csv file not found at:', csvPath);
    return;
  }

  const csvData = fs.readFileSync(csvPath, 'utf-8');

  // split the content by new line and filter out empty lines
  const lines = csvData.split('\n').filter(line => line.trim() !== '');

  // loop through each line (skip the first line because it is the header)
  for (let i = 1; i < lines.length; i++) {
    // split the row by comma and trim whitespaces
    const baris = lines[i].split(',');

    if (baris.length < 3) continue;

    const nama = baris[0].trim();
    const nik = baris[1].trim();
    const kategoriString = baris[2].trim().toLowerCase();

    // determine category id based on string
    let targetKategoriId = kategoriRT.idKategori;

    if (kategoriString.includes('rumah tangga') || kategoriString === 'rt') {
      targetKategoriId = kategoriRT.idKategori;
    } else if (kategoriString.includes('um')) {
      targetKategoriId = kategoriUM.idKategori;
    } else if (kategoriString.includes('pengecer') || kategoriString.includes('warung')) {
      targetKategoriId = kategoriWarung.idKategori;
    }

    // insert into database using upsert to avoid errors on duplicate nik
    await prisma.pelanggan.upsert({
      where: { nik: nik },
      update: {},
      create: {
        nik: nik,
        nama: nama,
        idKategori: targetKategoriId,
      },
    });

    console.log(`inserted: ${nama} - ${nik}`);
  }

  console.log('database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    // close prisma client connection
    await prisma.$disconnect();
  });
