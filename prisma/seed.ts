import { PrismaClient, KategoriPelanggan } from '@prisma/client';
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
  let produk = await prisma.produk.findFirst();
  if (!produk) {
    produk = await prisma.produk.create({
      data: { namaProduk: 'LPG 3 Kg', harga: 20000 }
    });
    console.log('produk master (lpg 3 kg) berhasil dibuat.');
  }

  // use process.cwd() to safely navigate from root directory
  const csvPath = path.join(process.cwd(), 'prisma', 'data', 'pelanggan.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('file csv tidak ditemukan di:', csvPath);
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

    // explicitly cast the string literals to match prisma's enum structure
    let kategoriEnum: KategoriPelanggan = 'RT'; 

    if (kategoriString.includes('rumah tangga') || kategoriString === 'rt') {
      kategoriEnum = 'RT';
    } else if (kategoriString.includes('um') || kategoriString.includes('pengecer')) {
      // randomly pick between um and pengecer (50/50 chance)
      const isUm = Math.random() < 0.5;
      kategoriEnum = isUm ? 'UM' : 'PENGECER';
    }

    // insert into database using upsert to avoid errors on duplicate nik
    await prisma.pelanggan.upsert({
      where: { nik: nik },
      update: {}, 
      create: {
        nik: nik,
        nama: nama,
        kategori: kategoriEnum,
      },
    });

    console.log(`inserted: ${nama} - ${nik} as ${kategoriEnum}`);
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
