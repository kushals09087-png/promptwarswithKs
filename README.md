# LabLink Nexus

**Discover. Allocate. Innovate.**

A GenAI-assisted, cross-department laboratory resource-sharing platform. This starter is configured with a **public, no-login evaluator experience**: the home page opens directly into an interactive demo workspace with sample catalogue data.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

No Supabase account, environment variables, or login is required to explore the demo UI.

## Demo experience

- Dashboard overview and campus resource metrics
- Search and filter for instruments, development kits, and workstations
- Resource details
- Simulated booking request flow with success confirmation
- AI project-discovery interaction (front-end demonstration state)
- Faculty, project, booking, and utilisation navigation states

**Important:** The catalogue and metrics on the public demo screen are illustrative sample data. The booking flow is simulated and does not persist a real reservation. The AI discovery interaction is a UI demonstration until a server-side Gemini endpoint is connected.

## Production integration

The repository retains the Supabase schema, booking/allocation helpers, and API foundations from the starter. Before using real student data or real laboratory equipment, implement and verify:
- Production authentication and role provisioning (can be enabled behind a separate protected route after evaluation)
- Server-side role checks and strict Row Level Security on every table
- Real booking persistence and transaction-safe approval
- Gemini integration with structured output validation and rate limiting
- Real notifications and dashboard queries
- Integration, E2E, accessibility, and concurrency tests

Do not expose service-role keys in the browser. Never treat the public demo UI as an access-control boundary.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

## Tech stack

Next.js App Router, React, TypeScript, CSS, Supabase/PostgreSQL foundations, Zod, Vitest, and Gemini integration foundations.
# promptwarswithK
# promptwarswithK
# promptwarswithK
# promptwarswithK
# promptwarswithKs
# promptwarswithKs
# promptwarswithKs
# promptwarswithKs
