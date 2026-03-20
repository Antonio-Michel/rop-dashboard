# ROP Renewal Risk Dashboard

## Getting Started

```bash
docker-compose up --build
```

Confirm everything is running:

1. **Backend health:** http://localhost:3003/api/health
2. **Frontend:** http://localhost:5173 — click "Park Meadows Apartments" to open the dashboard

## How to Use

1. Open http://localhost:5173 and click the property
2. The dashboard auto-triggers a risk calculation on load and displays all 12 residents
3. Use the **filter buttons** (All / High / Medium / Low) to narrow by risk tier
4. Click **Resident** or **Risk Score** column headers to sort (toggles ascending/descending)
5. Click any **row** to expand and see the signal breakdown (delinquency, renewal offer, rent gap, days to expiry)
6. Click **"Trigger Renewal"** on any row to send a webhook event to the mock RMS — verify with `docker-compose logs -f mock-rms`
7. Click **"Recalculate Scores"** to re-run the scoring
8. Use the **theme toggle** (slider in the top right) to switch between light and dark mode

## What I Built

### Backend

- **`POST /api/v1/properties/:propertyId/renewal-risk/calculate`** — Calculates risk scores for all active residents using 4 weighted signals (days to expiry, delinquency, renewal offer status, rent vs. market) with interaction bonuses. Stores results in `renewal_risk_scores` and returns them in the spec's JSON format.
- **`POST /api/v1/properties/:propertyId/residents/:residentId/trigger-renewal`** — (Bonus) Sends a `renewal.risk_flagged` webhook event to the mock RMS with the resident's latest risk data.

### Frontend

Component structure under `frontend/src/pages/RenewalRisk/`:

| Component | Purpose |
|-----------|---------|
| `index.tsx` | Page container — state management, API calls, filtering, sorting |
| `RiskSummaryBar` | Resident count, tier breakdown badges, recalculate button |
| `RiskFilterBar` | Tier filter buttons (All/High/Medium/Low) |
| `RiskTable` | Table wrapper with sortable column headers |
| `RiskTableRow` | Single resident row with tier badge, trigger renewal button, expandable |
| `SignalBreakdown` | Expandable detail panel showing individual signal values |
| `types.ts` | Shared TypeScript interfaces |

Additional: `ThemeContext` + `ThemeToggle` for dark mode support.

## Decisions and Assumptions

- **Moved RenewalRiskPage.tsx into its own feature directory (`pages/RenewalRisk/`).** The original single-file component was replaced with a folder containing `index.tsx` and co-located sub-components (RiskTable, RiskFilterBar, etc.). This keeps all dashboard-related code together and makes the feature easier to navigate as it grows.
- **Priya Patel scores High (90), not Medium as the seed data comment suggests.** The spec's scoring formula produces this result: she's delinquent (25pts) + ≤90 days (40pts) + 12% rent gap (15pts) = 80 base, plus the "delinquent AND ≤60 days" interaction bonus (+10) = 90. I followed the formula rather than the approximate labels in the seed data.
- **SQL query strategy:** Used 4 focused queries instead of one large JOIN — easier to read, debug, and explain.
- **Auto-calculate on page load** rather than requiring a manual button click first, so the property manager sees data immediately.
- **Sorting defaults to risk score descending** (highest risk first) since that's the most actionable view for a property manager.
- **Dark mode** added as a quality-of-life feature for property managers who may work long hours at their desk of who simply prefer the darker themes to reduce eye strain.

## What I'd Improve With More Time

- Add unit tests for the scoring logic (extract it into a pure function for easy testing)
- Add a search/filter by resident name
- Add pagination or virtual scrolling for properties with many residents
- Show a diff when recalculating (highlight score changes)
- Add confirmation dialog before triggering renewal events
- Persist dark mode preference to localStorage or just use 

## AI Assistance

This project was built with the help of **Claude Code** (Claude Opus). AI assisted with:

- Scaffolding the backend endpoint structure and SQL queries
- Generating the React component tree and Tailwind styling
- Implementing dark mode across all components
- Debugging the Tailwind dark mode configuration (system preference vs. class strategy)

All scoring logic, architectural decisions, and component design were reviewed and validated by me. The risk scoring formula was manually verified against the seed data scenarios.
