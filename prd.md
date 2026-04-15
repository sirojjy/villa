# Product Requirements Document
# Villa Management System — SV Villa
**PT. Shaka Jaya Properti**

| Field | Detail |
|---|---|
| Versi | 1.1.0 |
| Tanggal | April 2026 |
| Status | Draft |
| Tech Stack | Bun · ElysiaJS · Drizzle · MySQL · Next.js · Tailwind CSS |
| Target Perangkat | Desktop / Laptop · Tablet · Mobile |

---

## Daftar Isi

1. [Overview Sistem](#overview-sistem)
2. [Responsive UI](#responsive-ui)
3. [Modul 01 — Auth / Login](#modul-01--auth--login)
4. [Modul 02 — Dashboard](#modul-02--dashboard)
5. [Modul 03 — Front Desk](#modul-03--front-desk)
6. [Modul 04 — Riwayat Pemesanan](#modul-04--riwayat-pemesanan)
7. [Modul 05 — Administrasi Keuangan](#modul-05--administrasi-keuangan)
8. [Modul 06 — Project & Unit](#modul-06--project--unit)
9. [Modul 07 — User Management](#modul-07--user-management)
10. [Appendix](#appendix)

---

## Overview Sistem

Villa Management System adalah aplikasi web berbasis admin yang digunakan oleh PT. Shaka Jaya Properti untuk mengelola operasional multi-villa, mencakup pemesanan, keuangan, dan manajemen unit dalam satu platform terpadu.

### Tujuan Produk

- Memudahkan pengelolaan checkin dan checkout tamu secara manual oleh admin villa
- Menyediakan dashboard finansial yang ringkas untuk admin dan investor
- Mendukung manajemen multi-villa dalam satu platform
- Membatasi akses data berdasarkan peran pengguna

### Role & Hak Akses

| Role | Deskripsi | Akses |
|---|---|---|
| Super Admin | Administrator utama sistem | Semua modul + manajemen user & villa |
| Admin Villa | Staff operasional villa | Semua modul, tetapi data yang dikelola dibatasi pada area (project/villa) yang ditugaskan |
| Investor | Pemilik unit | Hanya bisa mengakses menu Dashboard & Riwayat Pemesanan. Data dibatasi khusus pada unit yang dimilikinya. Data keuangan disembunyikan. |

### Modul yang Dibangun

| No | Modul | Keterangan |
|---|---|---|
| 1 | Auth / Login | Autentikasi pengguna |
| 2 | Dashboard | Ringkasan data per villa |
| 3 | Front Desk | Kartu unit villa & status kamar |
| 4 | Riwayat Pemesanan | List semua transaksi booking |
| 5 | Administrasi Keuangan | Laporan uang masuk & keluar |
| 6 | Project & Unit | Manajemen villa dan unit kamar |
| 7 | User Management | Manajemen akun pengguna |

### Tech Stack

| Layer | Teknologi |
|---|---|
| Runtime | Bun |
| Backend Framework | ElysiaJS |
| ORM | Drizzle ORM |
| Database | MySQL |
| API Docs | Swagger (built-in ElysiaJS) |
| API Testing | Postman |
| Frontend | Next.js (App Router) |
| Styling | Tailwind CSS |

---

---

## Responsive UI

### Breakpoint yang Digunakan (Tailwind Default)

| Breakpoint | Lebar | Target Perangkat |
|---|---|---|
| `sm` | ≥ 640px | Mobile landscape |
| `md` | ≥ 768px | Tablet portrait |
| `lg` | ≥ 1024px | Tablet landscape / Laptop kecil |
| `xl` | ≥ 1280px | Desktop |

### Prioritas Responsive per Role

| Role | Mobile | Tablet | Desktop |
|---|---|---|---|
| Super Admin | Fungsional | Penuh | Penuh |
| Admin Villa | Fungsional | Penuh | Penuh |
| Investor | **Wajib optimal** | Penuh | Penuh |

> Investor paling sering akses via mobile untuk melihat dashboard. Halaman dashboard harus mobile-first untuk role ini.

### Aturan Layout Global

**Sidebar Navigasi:**
- Desktop (`lg` ke atas): sidebar tampil permanen di sisi kiri, lebar tetap (misal `w-64`)
- Tablet (`md`): sidebar tersembunyi, dibuka via hamburger icon sebagai overlay di atas konten
- Mobile: sidebar tersembunyi, hamburger icon di header, drawer slide dari kiri

**Header:**
- Sticky di atas di semua ukuran layar
- Mobile: hanya tampilkan logo + hamburger + avatar (sembunyikan tanggal & label panjang)

**Konten Utama:**
- Desktop: padding kiri untuk mengakomodasi sidebar
- Mobile/Tablet saat sidebar tertutup: konten full width

### Responsive per Modul

#### Login
- Form login di tengah layar, lebar maksimal `max-w-sm` di semua ukuran
- Background foto villa tetap tampil di semua ukuran
- Input dan tombol full width di dalam card

#### Dashboard

| Komponen | Desktop | Tablet | Mobile |
|---|---|---|---|
| Stat Cards | 3 kolom sejajar | 2 kolom | 1 kolom stack |
| Bar Chart Pendapatan | Full width | Full width | Full width, scroll horizontal jika perlu |
| Today Booking List | Tabel biasa | Scroll horizontal | Card list per baris |
| Pie Chart + Review | 2 kolom sejajar | 2 kolom | 1 kolom stack |
| Kalender | Full width, semua view | Full width | Default ke view `list` |

#### Front Desk

| Komponen | Desktop | Tablet | Mobile |
|---|---|---|---|
| Grid villa | 3 kolom | 2 kolom | 1 kolom |
| Tabel unit | Tabel biasa | Scroll horizontal | Card list per unit |
| Form Check-In | Modal di tengah | Modal di tengah | Full screen modal |

#### Riwayat Pemesanan

| Komponen | Desktop | Tablet | Mobile |
|---|---|---|---|
| Tabel riwayat | Tabel biasa | Scroll horizontal | Card list per pemesanan |
| Filter | Inline di atas tabel | Inline di atas tabel | Collapsible filter panel |
| Detail booking | Modal | Modal | Full screen modal |

#### Administrasi Keuangan

| Komponen | Desktop | Tablet | Mobile |
|---|---|---|---|
| Ringkasan (Income/Expense/Net) | 3 kolom sejajar | 3 kolom | 1 kolom stack |
| Form input | 2 kolom | 2 kolom | 1 kolom full width |
| Tabel transaksi | Tabel biasa | Scroll horizontal | Card list |

#### Project & Unit

| Komponen | Desktop | Tablet | Mobile |
|---|---|---|---|
| Tabel project | Tabel biasa | Scroll horizontal | Card list per project |
| Section unit (inline) | Di bawah tabel project | Di bawah tabel | Accordion / tab terpisah |
| Form tambah/edit | Modal | Modal | Full screen modal |

#### User Management

| Komponen | Desktop | Tablet | Mobile |
|---|---|---|---|
| Tabel user | Tabel biasa | Scroll horizontal | Card list per user |
| Form tambah user | Modal | Modal | Full screen modal |

### Pola Komponen Responsive

**Tabel → Card List di Mobile:**
Semua tabel dengan banyak kolom wajib dikonversi menjadi card list di mobile. Setiap card menampilkan data penting (nama, status, tanggal) dengan tombol aksi di bawah card.

**Modal → Full Screen di Mobile:**
Semua modal form di desktop wajib tampil sebagai full screen page atau bottom drawer di mobile agar field input tidak terpotong keyboard virtual.

**Tombol Aksi:**
- Desktop: tombol dengan teks lengkap (misal: "Tambah Data", "Check-In")
- Mobile: ukuran touch target minimal `44x44px`, label tetap singkat dan jelas

**Input & Select:**
- Gunakan native `<select>` atau komponen yang mobile-friendly
- Hindari dropdown custom yang sulit di-tap di layar kecil
- Date picker: gunakan native `type="date"` agar kompatibel keyboard mobile

### Pola Tailwind yang Dipakai Konsisten

```
// Grid responsif
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Sidebar
className="hidden lg:block"         // sidebar desktop
className="block lg:hidden"         // hamburger icon mobile/tablet

// Tabel vs Card list
className="hidden md:block"         // tabel hanya di tablet ke atas
className="block md:hidden"         // card list hanya di mobile

// Modal
className="w-full md:max-w-lg md:rounded-xl"  // full screen mobile, modal di tablet+

// Padding konten utama
className="p-4 md:p-6 lg:p-8"
```

## Modul 01 — Auth / Login

### Deskripsi

Menangani proses login pengguna ke sistem. Tidak ada fitur registrasi publik — semua akun dibuat oleh Super Admin. Setelah login berhasil, sistem mengarahkan pengguna ke halaman sesuai role-nya.

### Halaman: Login

**Elemen UI:**
- Logo dan nama aplikasi
- Field: Username
- Field: Password (masked)
- Tombol: Login
- Background: foto villa (dekoratif)
- Pesan error jika kredensial salah

**Alur Login:**
1. User mengisi username dan password
2. Sistem memvalidasi kredensial ke API
3. Jika valid: simpan token (JWT) di cookie, redirect sesuai role
4. Jika tidak valid: tampilkan pesan error

**Redirect Berdasarkan Role:**

| Role | Redirect Setelah Login |
|---|---|
| Super Admin | `/dashboard` |
| Admin Villa | `/dashboard` |
| Investor | `/dashboard` (hanya villa yang diinvestasikan) |

### API Endpoint

| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/auth/login` | Login dengan username & password, return JWT token |
| POST | `/api/auth/logout` | Invalidate session / token |
| GET | `/api/auth/me` | Get data user yang sedang login |

### Catatan Teknis

- Gunakan JWT untuk autentikasi stateless
- Token disimpan di HttpOnly cookie untuk keamanan
- Middleware Next.js untuk proteksi route berdasarkan role
- Session expired otomatis setelah 8 jam

---

## Modul 02 — Dashboard

### Deskripsi

Halaman utama setelah login. Menampilkan ringkasan data real-time meliputi status kamar, pendapatan, daftar tamu hari ini, metode booking, review tamu, dan kalender ketersediaan unit.

Super Admin dan Admin Villa dapat memilih villa melalui dropdown filter. Investor hanya melihat villa yang mereka investasikan.

### Komponen Dashboard

#### 1. Header & Filter
- Dropdown filter: pilih villa (All Project / per villa)
- Info tanggal hari ini
- Avatar dan nama user yang login

#### 2. Stat Cards (Ringkasan Hari Ini)

| Card | Data yang Ditampilkan |
|---|---|
| Today Check-in | Jumlah tamu yang checkin hari ini |
| Today Check-out | Jumlah tamu yang checkout hari ini |
| Room Available | Jumlah unit tersedia (total, Luxury, Middle, Low) |

#### 3. Total Pendapatan
- Pendapatan minggu ini (+ persentase vs minggu lalu)
- Pendapatan bulan ini (+ persentase vs bulan lalu)
- Pendapatan tahun ini (+ persentase vs tahun lalu)

#### 4. Grafik Pendapatan Per Bulan
- Bar chart: sumbu X = bulan (Jan–Des), sumbu Y = nilai (Rp)
- Data dari semua booking pada villa yang dipilih

#### 5. Today's Expenses
- Total pengeluaran hari ini (diambil dari modul Keuangan)

#### 6. Today Booking List
- Tabel: Nama tamu, Check-in, Check-out, No Kamar, Metode Bayar, Total Bayar
- Hanya menampilkan booking dengan tanggal checkin = hari ini

#### 7. Metode Booking (Pie Chart)
- Distribusi persentase berdasarkan platform: Tiket.com, Traveloka, Agoda, WhatsApp, On the Spot, Criips, Lainnya

#### 8. Review Tamu (CRM Display)
- Menampilkan review tamu terbaru: foto profil, nomor unit, rating bintang, komentar
- Read-only, tidak ada fitur input dari halaman ini

#### 9. Kalender Ketersediaan
- Kalender bulanan menampilkan jumlah unit tersedia per hari
- Navigasi: prev/next bulan, tombol Today
- View mode: Month / Week / Day / List

### Hak Akses

| Role | Yang Bisa Dilihat |
|---|---|
| Super Admin | Semua villa, semua data |
| Admin Villa | Hanya villa yang dikelola |
| Investor | Hanya villa yang diinvestasikan, filter tidak bisa diubah |

### API Endpoint

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/dashboard/summary` | Stat cards: checkin, checkout, available rooms |
| GET | `/api/dashboard/revenue` | Data pendapatan (weekly/monthly/yearly) |
| GET | `/api/dashboard/revenue/chart` | Data per bulan untuk bar chart |
| GET | `/api/dashboard/expenses/today` | Total pengeluaran hari ini |
| GET | `/api/dashboard/bookings/today` | List booking hari ini |
| GET | `/api/dashboard/booking-methods` | Distribusi metode booking untuk pie chart |
| GET | `/api/dashboard/reviews` | Review tamu terbaru |
| GET | `/api/dashboard/calendar` | Data ketersediaan unit per hari dalam bulan |

> Semua endpoint menerima query param `?project_id=` untuk filter villa.

---

## Modul 03 — Front Desk

### Deskripsi

Halaman operasional utama admin villa. Menampilkan daftar semua villa dalam format card grid. Setiap kartu villa menampilkan jumlah unit Tersedia, Terisi, dan Maintenance. Admin dapat masuk ke detail unit villa untuk melakukan checkin atau checkout tamu.

### Halaman: Daftar Villa (Overview)

**Tampilan:**
- Layout: grid kartu (3 kolom)
- Setiap kartu menampilkan: foto villa, nama villa, tombol "Data Pemesanan Unit", counter Tersedia / Terisi / Maintenance
- Progress bar visual untuk menggambarkan rasio hunian

**Aksi:**
- Klik tombol "Data Pemesanan Unit" → masuk ke halaman detail unit villa tersebut

### Halaman: Detail Unit Villa

**Tampilan:**
- Judul halaman: `Front Desk [Nama Villa]`
- Tombol "Unit Check-In" di kanan atas
- Tabel unit: No Unit, Tipe Unit, Check In, Check Out, Nama Tamu, Status
- Status badge berwarna: Tersedia (hijau), Terisi (oranye), Maintenance (abu)
- Fitur search dan pagination

**Aksi — Unit Check-In:**

Form/modal yang muncul saat tombol "Unit Check-In" diklik:

| Field | Tipe |
|---|---|
| Pilih Unit | Dropdown (hanya unit berstatus Tersedia) |
| Metode Booking | Dropdown (Tiket.com, Traveloka, Agoda, WhatsApp, On the Spot, Criips, Lainnya) |
| Nama Tamu | Text input |
| Nomor Kontak | Text input |
| Tanggal Check-In | Date picker (default hari ini) |
| Tanggal Check-Out | Date picker |
| Total Bayar | Number input (Rp) |

**Aksi — Check-Out:**
- Setiap baris unit yang berstatus Terisi memiliki tombol Check-Out
- Konfirmasi dialog muncul sebelum proses checkout
- Setelah checkout: status unit kembali jadi Tersedia, data checkout diperbarui

### Hak Akses

| Role | Akses |
|---|---|
| Super Admin | Lihat semua villa, bisa checkin/checkout di semua villa |
| Admin Villa | Hanya akses villa yang dikelola |
| Investor | Tidak ada akses |

### API Endpoint

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/projects` | Daftar semua villa (dengan counter unit) |
| GET | `/api/projects/:id/units` | Daftar unit dalam satu villa |
| POST | `/api/bookings/checkin` | Proses checkin tamu baru |
| PUT | `/api/bookings/:id/checkout` | Proses checkout tamu |

---

## Modul 04 — Riwayat Pemesanan

### Deskripsi

Menampilkan semua data pemesanan yang pernah terjadi di sistem, mencakup semua villa. Admin dapat mencari, memfilter, dan melihat detail setiap pemesanan.

### Tampilan Halaman

**Tabel Riwayat:**
- Kolom: No, Villa, Pemesan, Contact Person, Check In, Check Out, Unit, Status
- Status badge: Checkout (merah), Checked-In (hijau), Upcoming (biru)
- Fitur search (berdasarkan nama pemesan atau unit)
- Pagination dengan pilihan entries per halaman (10, 25, 50, 100)
- Klik nama pemesan → tampilkan detail booking dalam modal

**Filter:**
- Berdasarkan villa (dropdown)
- Berdasarkan status (Semua / Checked-In / Checkout / Upcoming)
- Berdasarkan rentang tanggal

**Detail Booking (Modal):**
- Nama tamu, nomor kontak
- Villa & nomor unit
- Tanggal check-in dan check-out
- Durasi menginap (dihitung otomatis)
- Metode booking
- Total bayar
- Status saat ini

### Hak Akses

| Role | Akses |
|---|---|
| Super Admin | Lihat semua riwayat semua villa |
| Admin Villa | Lihat riwayat villa yang dikelola saja |
| Investor | Tidak ada akses |

### API Endpoint

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/bookings` | List semua booking (query: `search`, `status`, `project_id`, `date_from`, `date_to`, `page`, `limit`) |
| GET | `/api/bookings/:id` | Detail satu booking |

---

## Modul 05 — Administrasi Keuangan

### Deskripsi

Mencatat dan menampilkan aliran uang masuk (income) dan uang keluar (expense) per villa. Uang masuk tidak hanya dari booking kamar tetapi juga dari layanan lain. Laporan bersifat informatif — tidak ada fitur akuntansi mendalam.

### Uang Masuk (Income)

**Sumber Income:**
- Booking kamar (otomatis masuk dari proses checkin)
- Kitchen / F&B
- Showcase / toko
- Layanan lainnya (input manual dengan keterangan bebas)

**Form Input Uang Masuk:**

| Field | Tipe |
|---|---|
| Villa | Dropdown |
| Kategori | Dropdown (Booking, Kitchen, Showcase, Lainnya) |
| Keterangan / Deskripsi | Text input |
| Nominal | Number input (Rp) |
| Tanggal Transaksi | Date picker |

### Uang Keluar (Expense)

**Kategori Pengeluaran:**
- Pembelian perlengkapan hotel
- Cleaning / kebersihan
- Laundry
- Alat maintenance
- Lainnya (input bebas)

**Form Input Uang Keluar:**

| Field | Tipe |
|---|---|
| Villa | Dropdown |
| Kategori | Dropdown (sesuai daftar di atas) |
| Keterangan / Deskripsi | Text input |
| Nominal | Number input (Rp) |
| Tanggal Transaksi | Date picker |

### Laporan Keuangan

**Tampilan:**
- Filter: pilih villa + rentang tanggal (bulan/tahun)
- Ringkasan: Total Income, Total Expense, Net (selisih)
- Tabel income: tanggal, kategori, keterangan, nominal
- Tabel expense: tanggal, kategori, keterangan, nominal
- Nilai net: warna hijau jika positif, merah jika negatif

### Hak Akses

| Role | Akses |
|---|---|
| Super Admin | Lihat & input semua villa |
| Admin Villa | Lihat & input villa yang dikelola saja |
| Investor | Lihat laporan villa yang diinvestasikan (read only) |

### API Endpoint

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/finance/summary` | Ringkasan income, expense, net (query: `project_id`, `date_from`, `date_to`) |
| GET | `/api/finance/income` | List transaksi income |
| POST | `/api/finance/income` | Tambah income manual |
| GET | `/api/finance/expense` | List transaksi expense |
| POST | `/api/finance/expense` | Tambah expense |

---

## Modul 06 — Project & Unit

### Deskripsi

Mengelola data villa (project) dan unit-unit di dalamnya. Ditampilkan dalam satu halaman: daftar villa di bagian atas, saat salah satu villa dipilih maka tabel unit villa tersebut muncul di bawah secara inline (tanpa pindah halaman).

### Halaman: Daftar Project (Villa)

**Tabel Project:**
- Kolom: No, Nama Project, Harga Dasar, Status, Alamat, Foto, Fasilitas, Aksi
- Status: Ready / Coming Soon
- Tombol aksi per baris: Edit, Hapus, Update Harga, View
- Tombol "Tambah Data" di kanan atas

**Form Tambah / Edit Project:**

| Field | Tipe |
|---|---|
| Nama Villa | Text input |
| Alamat | Text area |
| Status | Dropdown (Ready / Coming Soon) |
| Foto Villa | File upload |
| Fasilitas | Text area atau tag input |
| Harga Dasar | Number input (Rp) |

### Section: Manajemen Unit

Saat user mengklik "View" pada baris project, bagian bawah halaman menampilkan tabel unit milik project tersebut.

**Tabel Unit:**
- Kolom: No, Villa, Nama Unit, Harga per Malam, Tipe Unit, Status, Aksi
- Tipe Unit: Luxury / Middle / Low
- Status: Ready / Terisi / Maintenance
- Tombol aksi: Hapus
- Tombol "Tambah Data" untuk tambah unit baru ke villa yang dipilih

**Form Tambah Unit:**

| Field | Tipe |
|---|---|
| Villa | Dropdown (otomatis terisi dari villa yang dipilih) |
| Nama Unit | Text input (misal: A1, B2, C3) |
| Tipe Unit | Dropdown (Luxury / Middle / Low) |
| Harga per Malam | Number input (Rp) |
| Status Awal | Dropdown (Ready / Maintenance) |

**Update Harga (Bulk):**
- Tombol "Update Harga" pada baris project membuka modal
- Bisa update harga per tipe unit (Luxury / Middle / Low) sekaligus
- Berlaku untuk semua unit dalam tipe tersebut di villa yang dipilih

### Hak Akses

| Role | Akses |
|---|---|
| Super Admin | CRUD penuh: villa dan unit semua villa |
| Admin Villa | Tidak ada akses ke modul ini |
| Investor | Tidak ada akses ke modul ini |

### API Endpoint

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/projects` | Daftar semua villa |
| POST | `/api/projects` | Tambah villa baru |
| PUT | `/api/projects/:id` | Edit data villa |
| DELETE | `/api/projects/:id` | Hapus villa |
| GET | `/api/projects/:id/units` | Daftar unit dalam villa |
| POST | `/api/projects/:id/units` | Tambah unit baru |
| DELETE | `/api/units/:id` | Hapus unit |
| PUT | `/api/projects/:id/bulk-price` | Update harga bulk per tipe unit |

---

## Modul 07 — User Management

### Deskripsi

Hanya dapat diakses oleh Super Admin. Digunakan untuk membuat, mengelola, dan menghapus akun pengguna, serta mengatur role dan asosiasi villa per user.

### Tampilan Halaman

**Tabel Data User:**
- Kolom: No, Nama, Username, Role, Last Login, Aksi
- Role ditampilkan sebagai teks: Super Admin / Admin Villa / Investor
- Last Login: tanggal terakhir login atau `-` jika belum pernah
- Tombol aksi per baris: Edit, Hapus
- Tombol "Tambah Data" di kanan atas
- Fitur search dan pagination

### Form Tambah / Edit User

| Field | Tipe |
|---|---|
| Nama Lengkap | Text input |
| Username | Text input (unik, tanpa spasi) |
| Password | Password input |
| Konfirmasi Password | Password input |
| Role | Dropdown (Super Admin / Admin Villa / Investor) |
| Villa | Multi-select (muncul jika role bukan Super Admin) |

### Logika Asosiasi Villa per User

| Role | Asosiasi |
|---|---|
| Super Admin | Tidak perlu dipilih — otomatis akses ke semua data |
| Admin Villa | Pilih satu atau lebih villa (project) yang dikelola |
| Investor | Pilih satu atau lebih unit secara spesifik yang diinvestasikan |

### Fitur Tambahan

- **Reset Password:** Super Admin bisa reset password user lain (set password baru)
- **Hapus User:** konfirmasi dialog sebelum hapus permanen
- **Edit User:** update nama, role, dan asosiasi villa (username tidak bisa diubah)

### Hak Akses

| Role | Akses |
|---|---|
| Super Admin | Full CRUD user management |
| Admin Villa | Tidak ada akses |
| Investor | Tidak ada akses |

### API Endpoint

| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/users` | Daftar semua user (query: `search`, `role`, `page`, `limit`) |
| POST | `/api/users` | Buat user baru |
| PUT | `/api/users/:id` | Edit user (nama, role, villa) |
| DELETE | `/api/users/:id` | Hapus user |
| PUT | `/api/users/:id/reset-password` | Reset password user |

---

## Appendix

### Gambaran Struktur Database

| Tabel | Kolom Utama |
|---|---|
| `users` | id, name, username, password_hash, role, created_at, last_login |
| `projects` | id, name, address, status, photo_url, facilities, base_price |
| `user_projects` | user_id, project_id (relasi many-to-many untuk Admin Villa) |
| `units` | id, project_id, name, type (luxury/middle/low), price_per_night, status |
| `user_units` | user_id, unit_id (relasi many-to-many untuk kepemilikan unit Investor) |
| `bookings` | id, unit_id, guest_name, contact, check_in, check_out, method, total, status |
| `finances` | id, project_id, type (income/expense), category, description, amount, date |
| `reviews` | id, booking_id, rating, comment |

### Konvensi API

- Base URL: `/api`
- Format response sukses: `{ success: true, data: any, message: string }`
- Format response error: `{ success: false, error: string, statusCode: number }`
- Autentikasi: Bearer token di header `Authorization` atau HttpOnly cookie
- Semua endpoint kecuali `/api/auth/login` membutuhkan autentikasi
- Role guard diimplementasikan di middleware ElysiaJS

### Catatan Frontend Next.js

- Gunakan App Router (Next.js 14+)
- Halaman admin di folder `/app/(admin)/` dengan layout sidebar tersendiri
- Semua halaman admin menggunakan `"use client"` kecuali ada kebutuhan SSR spesifik
- State management: React `useState` / `useContext` cukup untuk MVP
- Gunakan SWR atau React Query untuk data fetching dan caching
- Sidebar navigasi menyembunyikan menu yang tidak bisa diakses berdasarkan role

### Saran Prioritas Pengembangan

| Fase | Modul | Alasan |
|---|---|---|
| Fase 1 | Auth + Project & Unit + User Management | Fondasi: data master dan akses |
| Fase 2 | Front Desk + Riwayat Pemesanan | Core operasional harian |
| Fase 3 | Dashboard + Administrasi Keuangan | Reporting & analytics |