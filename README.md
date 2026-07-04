# SupplySync AI - Hyperlocal B2B Supply Chain Platform

SupplySync AI is a modern B2B supply chain platform utilizing Next.js (App Router), Node/Express backend, pgvector-enabled PostgreSQL database (hosted on Supabase), Google Gemini AI agents (for forecasting, trust scoring, group buys, and dynamic pricing), and Google Maps integration for hyperlocal merchant matching.

This repository is organized as a monorepo utilizing **pnpm workspaces**.

> **Local dev**: No containerization needed — API and AI agents run directly via `pnpm dev` scripts; database is a shared cloud Supabase instance, not a local container.

## Monorepo Layout

```text
supplysync-ai/
├── apps/
│   └── web/                   # Next.js 14 Frontend PWA
├── services/
│   ├── api/                   # Express Backend REST API
│   └── ai-agents/             # Node-based AI agents service
├── docs/
│   └── pitch-deck/            # Slide outlines and demo scripts
├── .env.example               # Template for consolidated env variables
├── package.json               # Root scripts
└── pnpm-workspace.yaml        # Monorepo workspaces definition
```

## Quick Start (Local Development)

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (`npm i -g pnpm`)

### 2. One-Time Supabase Setup (done by Person 1 / Backend Lead)
1. Create a project at [supabase.com](https://supabase.com) (region: Mumbai or Singapore for lowest latency)
2. Dashboard → **Database** → **Extensions** → enable `vector`
3. Dashboard → **Project Settings** → **Database** → copy the **pooled connection string**
4. Share that connection string with the team via the shared `.env`
5. Person 1 runs `pnpm --filter api prisma migrate dev` once to create all tables

### 3. Configure Environment
Copy the example environment file to `.env` at the root and fill in the values (get `DATABASE_URL` from Person 1):
```bash
cp .env.example .env
```

### 4. Install Dependencies
Run from the root folder:
```bash
pnpm install
```

### 5. Prisma Client Generation
Generate the Prisma client (everyone needs to do this after `pnpm install`):
```bash
cd services/api
npx prisma generate
```

> **Important**: Only Person 1 (Backend Lead) should run `prisma migrate dev` against the shared Supabase database, to avoid conflicting schema changes from multiple people at once. Everyone else only reads/writes data through the API.

### 6. Running all services
Launch all development environments concurrently:
```bash
pnpm dev
```
Or run them individually in separate terminals:
```bash
# Terminal 1
pnpm --filter api dev

# Terminal 2
pnpm --filter ai-agents dev

# Terminal 3
pnpm --filter web dev
```
This will start:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **API Backend Server**: [http://localhost:4000](http://localhost:4000)
- **AI Agents Service**: [http://localhost:5000](http://localhost:5000)

All three run as plain Node processes against the shared Supabase `DATABASE_URL` from `.env` — no container orchestration required.

## Service Details

1. **Web Frontend (`apps/web`)**: Includes Firebase Authentication (via Google Sign-In), the buyer and supplier dashboards, geocoding hooks, and custom LocationPicker components.
2. **API Backend (`services/api`)**: Responsible for data persistence, Firebase verification, routes, and triggers.
3. **AI Agents (`services/ai-agents`)**: Connects to Google Gemini API to run forecast predictions, group-buy matching, trust scoring calculations, and dynamic pricing checkers.

## Deployment

The production database uses the **same Supabase instance** used during local development — one database from day one of development through to the live demo, with no migration between environments needed.
