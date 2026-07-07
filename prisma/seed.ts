import prisma from '../app/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('starting database seeding...');

  // seed customer categories based on report
  const katRT = await prisma.kategoriPelanggan.upsert({
    where: { idKategori: 'K01' },
    update: {},
    create: { idKategori: 'K01', namaKategori: 'Rumah Tangga', batasKuota: 1, periodeKuota: 'HARI' }
  });
  const katUM = await prisma.kategoriPelanggan.upsert({
    where: { idKategori: 'K02' },
    update: {},
    create: { idKategori: 'K02', namaKategori: 'UM', batasKuota: 2, periodeKuota: 'HARI' }
  });
  const katPengecer = await prisma.kategoriPelanggan.upsert({
    where: { idKategori: 'K03' },
    update: {},
    create: { idKategori: 'K03', namaKategori: 'Pengecer', batasKuota: 10, periodeKuota: 'MINGGU' }
  });
  console.log('categories seeded.');

  // seed payment statuses
  await prisma.statusPembayaran.upsert({
    where: { idStatus: 'S01' },
    update: {},
    create: { idStatus: 'S01', namaStatus: 'Tunai' }
  });
  await prisma.statusPembayaran.upsert({
    where: { idStatus: 'S02' },
    update: {},
    create: { idStatus: 'S02', namaStatus: 'Transfer' }
  });
  console.log('payment statuses seeded.');

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
  let produk = await prisma.produk.findFirst();
  if (!produk) {
    produk = await prisma.produk.create({
      data: { idProduk: 'PR001', namaProduk: 'LPG 3 Kg', harga: 20000 }
    });
    console.log('product master seeded.');
  }

  // use process.cwd() to safely navigate from root directory
  const csvPath = path.join(process.cwd(), 'prisma', 'data', 'pelanggan.csv');

  if (!fs.existsSync(csvPath)) {
    console.error('csv file not found at:', csvPath);
    return;
  }

  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvData.split('\n').filter(line => line.trim() !== '');

  // loop through each line (skip the first line because it is the header)
  for (let i = 1; i < lines.length; i++) {
    const baris = lines[i].split(',');
    if (baris.length < 3) continue;

    const nama = baris[0].trim();
    const nik = baris[1].trim();
    const kategoriString = baris[2].trim().toLowerCase();

    let idKategori = katRT.idKategori;

    if (kategoriString.includes('um') || kategoriString.includes('pengecer')) {
      // randomly pick between um and pengecer (50/50 chance)
      const isUm = Math.random() < 0.5;
      idKategori = isUm ? katUM.idKategori : katPengecer.idKategori;
    }

    // insert into database mapping the correct category foreign key
    await prisma.pelanggan.upsert({
      where: { nik: nik },
      update: {},
      create: {
        nik: nik,
        nama: nama,
        idKategori: idKategori,
      },
    });

    console.log(`inserted: ${nama} - ${nik} with category ID ${idKategori}`);
  }

  console.log('database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
