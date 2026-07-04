# SupplySync AI - AI Agents Service Integration Guide

This guide is designed for the Integration Lead (Person 5) and their AI assistant to understand, configure, and wire the **AI Agents Service** (`services/ai-agents/`) into the main monorepo.

---

## 1. Overview
The AI Agents service is a standalone Express HTTP service running on port `5000`. It interfaces with the Google Gemini API (using the `@google/generative-ai` SDK) and reads directly from the shared PostgreSQL database (via Prisma Client). It exposes four internal endpoints which are invoked by the main backend API server (Person 1's service).

---

## 2. Directory Structure of Files Created
All files reside in `services/ai-agents/`:
```text
services/ai-agents/
├── prisma/
│   └── schema.prisma              # Shared database schema with pgvector support
├── src/
│   ├── agents/
│   │   ├── forecast.agent.ts      # Demand Forecast Agent logic (POST /forecasts/run)
│   │   ├── trust.agent.ts         # Trust & Verification Agent logic (POST /trust/recompute)
│   │   ├── groupBuy.agent.ts      # Group-Buy Matchmaking Agent logic (POST /group-buys/match)
│   │   └── pricing.agent.ts       # Dynamic Pricing Agent logic (POST /pricing/check)
│   ├── lib/
│   │   ├── db.ts                  # Shared Prisma client instantiation instance
│   │   └── gemini.ts              # Gemini API wrapper with exponential backoff & parsing
│   ├── routes.ts                  # Routing bindings for Express
│   ├── index.ts                   # Service bootstrap file (port 5000)
│   └── test-agents.ts             # Mock-based unit test runner (22 assertions)
├── .env.example                   # Local configuration template
├── package.json                   # Dependencies, scripts, and package versionings
└── tsconfig.json                  # Compiler settings
```

---

## 3. Prerequisites
- **Node.js**: `v20` or higher (we used `v26.4.0` in development).
- **PostgreSQL**: `v16` or higher with the **pgvector** extension installed.
  - Make sure `CREATE EXTENSION IF NOT EXISTS vector;` is executed on your database before running migrations.
- **Package Manager**: Workspaces configured with `pnpm` or `npm`.
- **TypeScript & Dev Runner**: Compilation uses `typescript`. Development utilizes `tsx` (TypeScript Execute) for fast live-reloads.

---

## 4. Required Environment Variables (`.env`)
The service relies on the following configurations:
```env
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db_name>?schema=public
GEMINI_API_KEY=your_google_gemini_api_key
API_BASE_URL=http://localhost:4000/api
```
* **Note on `GEMINI_API_KEY`**: If this variable is missing or set to `mock_key`, the service automatically degrades to **Mock Fallback Mode**, returning static, mock predictions and embeddings so that testing and basic UI workflows do not crash the pipeline.

---

## 5. Shared Prisma Schema (`prisma/schema.prisma`)
The schema matches the Master Contract database schema, correcting the `NOOLEAN` typo to `Boolean`.
It supports the `pgvector` vector type using the Prisma `Unsupported` property definition:
```prisma
model Listing {
  id            String                      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  ...
  embedding     Unsupported("vector(768)")?
}
```
Queries for vector similarity are written using raw SQL (`$queryRawUnsafe`) to bypass Prisma client limitations:
```sql
SELECT id, price_per_unit, material_name FROM listings
ORDER BY embedding <=> $1::vector LIMIT 10
```
*If pgvector is not initialized or fails, the code automatically falls back to text-based matching (using `contains` and `insensitive` mode).*

---

## 6. Exposing API Endpoints (The API Contract)

All endpoints return a uniform standard envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### 1. Demand Forecast Agent
- **Endpoint**: `POST /forecasts/run`
- **Body**: `{ "buyerId": "string" }`
- **Logic**: Analyzes past order history. For any material with `>= 2` orders, it calculates average order intervals and quantities, queries Gemini for natural-language reasoning/confidence, and inserts a prediction row into the `forecasts` table.

### 2. Trust & Verification Agent
- **Endpoint**: `POST /trust/recompute`
- **Body**: `{ "supplierId": "string" }`
- **Logic**: Computes a deterministic trust score:
  - Base starting score: `50.00`.
  - On-time delivery event: `+2.0` (capped at maximum `+30.0` points contribution).
  - Late delivery event: `-3.0`.
  - Review rating: `(rating - 3) * 1.5` for each review.
  - Price consistency: `+2.0` if no listings are flagged high; `-2.0` if any listing exceeds fair pricing limits.
  - Total score is clamped to `[0, 100]`.
  Queries Gemini to write a qualitative change summary and updates the supplier's `users.trust_score` via calling `PATCH ${API_BASE_URL}/users/${supplierId}` (with direct DB fallback).

### 3. Group-Buy Matchmaking Agent
- **Endpoint**: `POST /group-buys/match`
- **Body**: `{ "material": "string", "buyerId": "string", "quantity": number, "lat": number, "lng": number }`
- **Logic**: Embedding similarity matching identifies matching listings. Geographic filtering (Haversine formula within a 50km radius) finds other buyers with matching demand.
  - Joins an existing open group buy (calls `POST ${API_BASE_URL}/group-buys/:id/join` or direct write fallback).
  - If no open group buy is available and `>= 2` buyers have matching demand, it creates a new `group_buys` entry with an unlock price (applying a volume-based discount of `8-15%`) and registers the buyers.

### 4. Dynamic Pricing Agent
- **Endpoint**: `POST /pricing/check`
- **Body**: `{ "material": "string", "price": number, "supplierId": "string", "listing_id": "string" (optional) }`
- **Logic**: Locates comparable listings. If `>= 3` listings exist, it computes a statistical price range (median +/- 1 standard deviation). If `< 3` exist, it falls back to Gemini-estimated bounds. It flags the quote as `isFlaggedHigh = true` if the quote is above the range. If `listing_id` is supplied, it updates the database row.

---

## 7. How to Install, Generate, and Run

### Run Local Installs
Run this inside `services/ai-agents/` (or via your root workspace manager):
```bash
npm install
```

### Generate Prisma Clients
Build the database bindings:
```bash
npx prisma generate
```

### Run Dev Server
Launch the compiler and listener (runs on port 5000):
```bash
npm run dev
```

### Compile to JS
Build production files into the `/dist` directory:
```bash
npm run build
```

---

## 8. Running Verification Tests
We have integrated a mock-based test suite that asserts math logic, fallback routines, geo-clustering, and API envelope contracts.
To run tests locally:
```bash
npx tsx src/test-agents.ts
```
*(All 22 test assertions should show `[PASS]` and complete with exit code 0).*
