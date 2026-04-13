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
