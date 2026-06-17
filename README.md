# WardiPOS - Pangkalan Wardi Sukardi

Sistem Informasi Pencatatan Transaksi Penjualan dan Rekapitulasi Penjualan LPG 3 Kg berbasis Web. Sistem ini dibangun khusus untuk kebutuhan manajerial internal pangkalan guna mengotomatisasi pencatatan NIK, memvalidasi kuota subsidi, dan meminimalisir selisih uang setoran harian.

## Tech Stack

* **Frontend & Backend:** Next.js (App Router) + TypeScript
* **Styling:** Tailwind CSS
* **Database:** PostgreSQL
* **ORM:** Prisma

## Fitur Utama

* **Master Data Pelanggan:** Pendaftaran NIK (One-Time Registration) agar tidak perlu menginput berulang kali.
* **Validasi Kuota Otomatis:** Sistem akan mengunci transaksi jika pelanggan melampaui batas yang ditetapkan:
  * Rumah Tangga: 1 tabung/hari
  * Usaha Mikro: 2 tabung/hari
  * Pengecer: 10 tabung/minggu
* **Manajemen Pembayaran:** Pencatatan status pembayaran (Tunai/Transfer) untuk mencocokkan uang setoran kasir.
* **Cetak Nota Digital:** Pembuatan bukti transaksi yang sah.
* **Ekspor Rekapitulasi:** Menghasilkan laporan NIK yang siap disandingkan untuk input ke sistem Pertamina.

## Cara Instalasi (Local Development)

1. **Clone repository ini:**

```bash
   git clone git@github.com:doaesque/wardipos.git

```

1. **Masuk ke direktori dan install dependencies:**

```bash
   cd wardipos
   npm install

```

1. **Setup Environment Variables:**
Buat file `.env` di root folder dan masukkan string koneksi database PostgreSQL:

```env
   DATABASE_URL="postgresql://user:password@host:port/dbname"

```

1. **Sinkronisasi Prisma dengan Database:**

```bash
   npx prisma db push

```

1. **Jalankan local server:**

```bash
   npm run dev

```
