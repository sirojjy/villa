# SV Villa Management System

Villa Management System adalah aplikasi web berbasis admin yang digunakan oleh PT. Shaka Jaya Properti untuk mengelola operasional multi-villa, mencakup pemesanan, keuangan, dan manajemen unit dalam satu platform terpadu.

## Tech Stack

- **Runtime**: Bun
- **Backend**: ElysiaJS
- **ORM**: Drizzle ORM
- **Database**: MySQL
- **Frontend**: Next.js (App Router)
- **Styling**: Tailwind CSS

## Project Structure

- `backend/`: ElysiaJS application.
- `frontend/`: Next.js application.
- `docker-compose.yml`: Database and development tools configuration.

## Development

### Prerequisites
- Docker & Docker Desktop
- Bun

### Setup
1. Clone the repository.
2. Run `docker compose up -d` to start the database.
3. Configure `.env` files (see `.env.example` if available).
4. Run `bun install` in both `backend/` and `frontend/`.
5. Run `bun dev` to start the development servers.

---
&copy; 2026 PT. Shaka Jaya Properti


<!-- FIRST RUN APP -->

Untuk menjalankan aplikasi **SV Villa** ini dengan lancar, berikut adalah daftar perintah yang perlu Anda gunakan untuk Backend (menggunakan Bun) dan Frontend (menggunakan Next.js):

### 1. Persiapan Database (Folder: `backend`)
Aplikasi ini menggunakan **Drizzle ORM**. Sebelum menjalankan server, pastikan tabel-tabel di database sudah terbuat:

*   **Instalasi Dependensi**:
    ```bash
    bun install
    ```
*   **Singkronisasi Skema ke Database** (Cara tercepat untuk development):
    ```bash
    bun run db:push
    ```
    *Gunakan perintah ini jika Anda mengubah `schema.ts` dan ingin database langsung mengikuti perubahan tersebut.*
*   **Melihat Data via Browser** (GUI):
    ```bash
    bun run db:studio
    ```
    *Ini akan membuka browser di `localhost:4983` untuk melihat/mengedit isi tabel secara visual.*

---

### 2. Menjalankan Backend (Folder: `backend`)
Backend menggunakan **ElysiaJS** yang berjalan sangat cepat dengan Bun:

*   **Mode Development** (dengan auto-reload):
    ```bash
    bun run dev
    ```
    *Secara default berjalan di `http://localhost:3000`.*

---

### 3. Menjalankan Frontend (Folder: `frontend`)
Frontend menggunakan **Next.js** (App Router):

*   **Instalasi Dependensi**:
    ```bash
    npm install
    ```
*   **Mode Development**:
    ```bash
    npm run dev
    ```
    *Secara default berjalan di `http://localhost:3001`.*
*   **Build untuk Produksi**:
    ```bash
    npm run build
    ```

---

### Ringkasan Urutan Menjalankan Aplikasi
1.  Buka terminal di folder `backend`, jalankan `bun run db:push` (hanya jika ada perubahan skema).
2.  Di terminal backend, jalankan `bun run dev`.
3.  Buka terminal baru di folder `frontend`, jalankan `npm run dev`.
4.  Akses aplikasi di browser pada alamat `http://localhost:3001`.

**Catatan Penting**: 
Pastikan file `.env` di folder `backend` sudah terisi dengan kredensial database MySQL Anda agar `bun run db:push` dan server bisa terhubung ke database.