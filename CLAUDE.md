# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ROP (Residential Operating Platform) Renewal Risk Dashboard — a full-stack app that calculates and displays which residents are at risk of not renewing their leases. Property managers use this to identify at-risk residents and trigger retention actions.

## Commands

```bash
# Start all services (db, backend, frontend, mock-rms)
docker-compose up --build

# Rebuild specific services after changes
docker-compose up --build backend frontend

# Connect to PostgreSQL directly
docker-compose exec db psql -U rop -d rop

# View mock RMS webhook logs
docker-compose logs -f mock-rms

# Tear down and reset all data
docker-compose down -v
```

There are no test scripts configured. No linter is configured. Backend uses `tsx watch` for hot-reload in dev (via Docker volume mount of `backend/src/`). Frontend uses Vite dev server with hot-reload (via Docker volume mount of `frontend/src/`).

## Architecture

**Four Docker services** orchestrated via `docker-compose.yml`:

- **PostgreSQL** (port 5432) — schema in `db/init.sql`, seed data in `db/seed.sql`. Credentials: `rop/rop/rop`. **Do not modify the schema.**
- **Backend** (port 3003) — Express + TypeScript. Entry point: `backend/src/index.ts`. DB pool: `backend/src/db.ts`. Uses `pg` library with connection string from `DATABASE_URL` env var.
- **Frontend** (port 5173) — React 19 + TypeScript + Tailwind CSS + Vite. Entry point: `frontend/src/main.tsx`. Routes defined there via React Router v7.
- **Mock RMS** (port 3001) — Simple Node.js server at `mock-rms/server.js` that logs webhook POSTs to `/webhook`.

**Key data flow:** Frontend calls `/api/*` which Vite proxies to the backend (configured in `frontend/vite.config.ts` targeting `http://backend:3003`). Backend queries PostgreSQL and can POST to mock-rms at `MOCK_RMS_URL`.

## Database Schema (db/init.sql)

Tables: `properties`, `unit_types`, `units`, `unit_pricing`, `residents`, `leases`, `resident_ledger`, `renewal_offers`, `renewal_risk_scores`. All IDs are UUIDs. The `renewal_risk_scores` table is the output table for the risk calculation endpoint.

Key relationships: properties → units → residents → leases. `unit_pricing` tracks market rent per unit. `resident_ledger` tracks financial transactions (look for `charge_code = 'late_fee'` for delinquency). `renewal_offers` links to leases.

## Risk Scoring Formula (from spec)

Four weighted signals produce a 0-100 score:
- Days to lease expiry (40%): ≤90d=100, 91-180d=50, 180+d=10
- Payment delinquency (25%): any `late_fee` in last 6 months = 100, else 0
- No renewal offer (20%): no offer on file = 100, else 0
- Rent vs market (15%): gap ≥10% = 100, 5-10% = 50, <5% = 0

Interaction bonuses (additive, cap at 100):
- Delinquent AND no renewal offer: +10
- ≤30 days AND rent gap >10%: +15
- Delinquent AND ≤60 days: +10

Tiers: high ≥70, medium ≥40, low <40.

## What Needs to Be Built

1. **Backend endpoint**: `POST /api/v1/properties/:propertyId/renewal-risk/calculate` — calculates scores, stores in `renewal_risk_scores`, returns results (see spec for response format)
2. **Frontend dashboard**: `frontend/src/pages/RenewalRiskPage.tsx` — table with resident name, unit, days to expiry, risk score, color-coded tier; loading/error states; button to trigger calculation
3. **Bonus**: Trigger renewal event endpoint `POST /api/v1/properties/:propertyId/residents/:residentId/trigger-renewal` that POSTs to mock RMS
