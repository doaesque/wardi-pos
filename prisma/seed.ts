import prisma from '../app/lib/prisma';
import * as fs from 'fs';
import * as path from 'path';

// helper function to convert strings to title case
function toTitleCase(str: string) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase());
}

async function main() {
  console.log('starting database seeding...');

  // seed customer categories based on report
  const katRT = await prisma.kategoriPelanggan.upsert({
    where: { idKategori: 'K01' },
    update: { batasKuota: 1, periodeKuota: 'HARI', namaKategori: 'Rumah Tangga' },
    create: { idKategori: 'K01', namaKategori: 'Rumah Tangga', batasKuota: 1, periodeKuota: 'HARI' }
  });
  const katUM = await prisma.kategoriPelanggan.upsert({
    where: { idKategori: 'K02' },
    update: { batasKuota: 2, periodeKuota: 'HARI', namaKategori: 'Usaha Mikro' },
    create: { idKategori: 'K02', namaKategori: 'Usaha Mikro', batasKuota: 2, periodeKuota: 'HARI' }
  });
  const katPengecer = await prisma.kategoriPelanggan.upsert({
    where: { idKategori: 'K03' },
    update: { batasKuota: 10, periodeKuota: 'MINGGU', namaKategori: 'Pengecer' },
    create: { idKategori: 'K03', namaKategori: 'Pengecer', batasKuota: 10, periodeKuota: 'MINGGU' }
  });
  console.log('customer categories seeded successfully.');

  // seed payment statuses
  await prisma.statusPembayaran.upsert({
    where: { idStatus: 'S01' },
    update: { namaStatus: 'Tunai' },
    create: { idStatus: 'S01', namaStatus: 'Tunai' }
  });
  await prisma.statusPembayaran.upsert({
    where: { idStatus: 'S02' },
    update: { namaStatus: 'Transfer' },
    create: { idStatus: 'S02', namaStatus: 'Transfer' }
  });
  console.log('payment statuses seeded successfully.');

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
  console.log('default cashier account created.');

  // ensure product exists for relation
  let produk = await prisma.produk.findFirst();
  if (!produk) {
    produk = await prisma.produk.create({
      data: { idProduk: 'PR001', namaProduk: 'LPG 3 Kg', harga: 20000 }
    });
    console.log('master product data created.');
  }

  // use process.cwd() to safely navigate from root directory
  const csvPath = path.join(process.cwd(), 'prisma', 'data', 'pelanggan.csv');

  if (!fs.existsSync(csvPath)) {
    console.error('csv file not found at directory:', csvPath);
    return;
  }

  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvData.split('\n').filter(line => line.trim() !== '');

  // loop through each line (skip the first line because it is the header)
  for (let i = 1; i < lines.length; i++) {
    const baris = lines[i].split(',');
    if (baris.length < 3) continue;

    // convert customer name to proper title case to prevent all caps
    const nama = toTitleCase(baris[0].trim());
    const nik = baris[1].trim();
    const kategoriString = baris[2].trim().toLowerCase();

    let idKategori = katRT.idKategori;

    // specific matching for rumah tangga, otherwise randomize between um and pengecer
    if (kategoriString.includes('rumah') || kategoriString === 'rt') {
      idKategori = katRT.idKategori;
    } else {
      // randomly pick between um and pengecer (50/50 chance)
      const isUm = Math.random() < 0.5;
      idKategori = isUm ? katUM.idKategori : katPengecer.idKategori;
    }

    // insert into database mapping the correct category foreign key
    await prisma.pelanggan.upsert({
      where: { nik: nik },
      update: { nama: nama, idKategori: idKategori },
      create: {
        nik: nik,
        nama: nama,
        idKategori: idKategori,
      },
    });

    console.log(`successfully registered customer: ${nama} - ${nik} with category id ${idKategori}`);
  }

  console.log('database seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('an error occurred while running seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
