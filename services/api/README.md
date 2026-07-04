# SupplySync AI - Backend API

This is the API service for SupplySync AI.

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- Supabase `DATABASE_URL` (get from Person 1 / Backend Lead)

### Setup
1. Copy `.env.example` to `.env` and fill in your Firebase credentials and the shared `DATABASE_URL`.
2. Install dependencies:
   ```bash
   pnpm install
   ```

### Database & Migrations
The database is a shared cloud Supabase instance. No local setup needed.

1. Generate the Prisma client:
   ```bash
   npx prisma generate
   ```
2. **(Person 1 only)** Run database migrations:
   ```bash
   pnpm --filter api prisma migrate dev --name init
   ```
3. **(Person 1 only)** Seed the database with demo users and listings:
   ```bash
   npx tsx prisma/seed.ts
   ```

> **Important**: Only Person 1 (Backend Lead) should run migrations against the shared Supabase database, to avoid conflicting schema changes from multiple people at once. Everyone else only reads/writes data through the API.

### Running the API
Start the development server:
```bash
pnpm --filter api dev
# OR from within this directory:
npm run dev
```

The API will be available at `http://localhost:4000/api/health`.

### Testing Endpoints
Import `postman_collection.json` into Postman or Thunder Client to test all endpoints.
