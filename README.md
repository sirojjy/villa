<div align="center">
  <h1>🌴 Villa Management System</h1>
  <p><strong>Pengelolaan Villa Terpadu PT. Shaka Jaya Properti System (SV Villa)</strong></p>
  <p>
    Aplikasi web berbasis admin yang digunakan untuk mengelola operasional multi-villa, mencakup pemesanan, keuangan, dan manajemen unit dalam satu platform terpadu.
  </p>
</div>

---

## 🌟 Fitur Utama

- **📊 Dashboard**: Ringkasan operasional real-time, statistik pendapatan harian/bulanan, kalender ketersediaan, dan daftar tamu check-in.
- **🛎️ Front Desk**: Pengelolaan check-in dan check-out tamu secara instan, serta pemantauan status setiap unit (Tersedia, Terisi, Maintenance).
- **📅 Riwayat Pemesanan**: Arsip lengkap seluruh transaksi booking yang dapat difilter berdasarkan villa, status, dan tanggal.
- **💰 Administrasi Keuangan**: Pencatatan uang masuk (income) dan keluar (expense) per villa, beserta laporan surplus/defisit.
- **🏢 Manajemen Project & Unit**: Pengelolaan data master villa dan unit-unit kamar beserta penetapan harga per malam.
- **👥 User Management**: Pengaturan multi-role dengan hak akses spesifik per pengguna.

---

## 📸 Screenshots Aplikasi

Berikut adalah beberapa tampilan antarmuka dari aplikasi SV Villa:

### 📊 Dashboard
<img src="./frontend/src/img-readme/villa-dashboard-2026-06-05-10_33_14.png" alt="Dashboard" width="800">

### 🛎️ Front Desk (Reception)
<img src="./frontend/src/img-readme/villa-front-desk-2026-06-05-10_33_50.png" alt="Front Desk" width="800">
<br>
<img src="./frontend/src/img-readme/villa-front-desk-2026-06-05-10_34_09.png" alt="Front Desk Detail" width="800">

### 📅 Booking & Reservation
<img src="./frontend/src/img-readme/villa-bookings-2026-06-05-10_34_29.png" alt="Bookings" width="800">

### 💰 Finance & Transactions
<img src="./frontend/src/img-readme/villa-finance-2026-06-05-10_35_19.png" alt="Finance" width="800">

### 🏢 Projects & Units
<img src="./frontend/src/img-readme/villa-projects-2026-06-05-10_35_38.png" alt="Projects" width="800">

---

## 👥 Role & Hak Akses

1. 👑 **Super Admin**: Akses penuh ke seluruh fitur, semua data villa, dan manajemen pengguna.
2. 👨‍💼 **Admin Villa**: Akses operasional penuh, namun dibatasi hanya pada villa/project yang ditugaskan kepadanya.
3. 👁️ **Investor**: Akses *read-only* ke Dashboard dan Riwayat Pemesanan, khusus untuk unit/villa yang diinvestasikan.

---

## 🛠️ Tech Stack

<table align="center">
  <tr>
    <td align="center"><strong>Runtime</strong></td>
    <td align="center"><strong>Backend</strong></td>
    <td align="center"><strong>Frontend</strong></td>
    <td align="center"><strong>Database & ORM</strong></td>
  </tr>
  <tr>
    <td align="center">Bun</td>
    <td align="center">ElysiaJS</td>
    <td align="center">Next.js (App Router)<br>Tailwind CSS v4<br>Lucide React</td>
    <td align="center">MySQL (Docker)<br>Drizzle ORM</td>
  </tr>
</table>

## 📁 Project Structure

- `backend/` 🚀 : API Server dibangun dengan ElysiaJS.
- `frontend/` 💻 : Antarmuka Pengguna dibangun dengan Next.js.
- `docker-compose.yml` 🐳 : Konfigurasi kontainer untuk MySQL & phpMyAdmin.

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

Untuk menjalankan aplikasi **SV Villa** ini di lingkungan development, ikuti langkah-langkah berikut:

### 1️⃣ Persiapan Database (Docker)
Aplikasi membutuhkan database MySQL yang dapat dijalankan melalui Docker.
```bash
# Menjalankan MySQL (Port 3306) dan phpMyAdmin (Port 8080)
docker compose up -d
```

### 2️⃣ Konfigurasi Backend (`/backend`)
Backend menggunakan **Drizzle ORM** dan **ElysiaJS** yang berjalan sangat cepat dengan Bun.

1. Masuk ke folder backend dan install dependensi:
   ```bash
   cd backend
   bun install
   ```
2. Buat atau sesuaikan file `.env` dengan kredensial database:
   ```env
   DATABASE_URL="mysql://root:rootpassword@localhost:3306/sv_villa"
   JWT_SECRET="secret_key_anda"
   ```
3. Singkronisasi Skema ke Database:
   ```bash
   bun run db:push
   ```
   *(Opsional) Untuk melihat Drizzle Studio:* `bun run db:studio`
4. Jalankan Backend Server (Auto-reload):
   ```bash
   bun run dev
   ```
   *API berjalan di `http://localhost:3000`.*

### 3️⃣ Konfigurasi Frontend (`/frontend`)
Frontend menggunakan **Next.js**.

1. Masuk ke folder frontend dan install dependensi:
   ```bash
   cd frontend
   npm install
   ```
2. Jalankan Frontend Server:
   ```bash
   npm run dev
   ```
   *Frontend berjalan di `http://localhost:3001`.*

---

### 🎯 Ringkasan Perintah Menjalankan Aplikasi

1. 🐳 `docker compose up -d` (Di root direktori)
2. 🗄️ `cd backend && bun run db:push` (Saat pertama kali/ada perubahan skema)
3. 🚀 `cd backend && bun run dev` (Menjalankan API server)
4. 💻 `cd frontend && npm run dev` (Menjalankan Frontend)

Akses aplikasi melalui **[http://localhost:3001](http://localhost:3001)** ✨
