# WardiPOS - Sistem Manajemen Pangkalan LPG 3kg

WardiPOS adalah sistem manajemen berbasis *web* yang dirancang khusus untuk pangkalan LPG 3kg untuk mempermudah pencatatan transaksi, pengelolaan data pelanggan, dan monitoring performa karyawan dengan antarmuka yang responsif.

## Fitur Utama

- **Sistem Kasir Modern:** Antarmuka kasir yang interaktif, mendukung *checkout* cepat, dan otomatis mengunduh nota transaksi dalam format gambar.
- **Batasan Pembelian Otomatis:** Sistem proteksi kuota harian untuk pelanggan Rumah Tangga/Usaha Mikro dan kuota mingguan untuk Pengecer.
- **Manajemen Pelanggan:** Registrasi pelanggan dengan kategorisasi (RT, UM, Pengecer) yang dilengkapi fitur riwayat pembelian historis.
- **Filter Transaksi Lanjutan:** Fitur pencarian transaksi yang fleksibel berdasarkan ID, nama pelanggan, bulan, tahun, hingga tanggal spesifik.
- **Monitoring Performa Karyawan:** Pemantauan sesi kerja staf, durasi login, dan jumlah transaksi yang ditangani oleh tiap karyawan.
- **Responsif (Mobile-First):** Desain yang dioptimalkan untuk penggunaan di *smartphone* maupun desktop, dengan fitur *floating cart* pada perangkat seluler.

## Teknologi

- **Framework:** [Next.js 16](https://nextjs.org/) (Turbopack)
- **Database:** [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)

## Instalasi

1. **Clone repositori:**

```bash
git clone [https://github.com/doaesque/wardi-pos.git](https://github.com/doaesque/wardi-pos.git)

```

2. **Instal dependensi:**

```bash
npm install

```

3. **Konfigurasi Environment:**

Buat berkas `.env` dan tambahkan URL basis data Anda:

```env
DATABASE_URL="your_supabase_database_url"

```

4. **Jalankan Prisma Generate:**

```bash
npx prisma generate

```

5. **Jalankan Aplikasi:**

```bash
npm run dev

```
