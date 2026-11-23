# LabLink Nexus

**Discover. Allocate. Innovate.**

A GenAI-powered campus laboratory resource-sharing platform. Students discover equipment, development kits, and workstations across departments, request slots through academic projects, and faculty approve requests. An explainable allocation engine resolves scheduling conflicts fairly, and Google Gemini assists with requirements understanding, plain-language explanations, and recommendation matching.

---

## Table of Contents
1. [Problem Statement Alignment](#1-problem-statement-alignment)
2. [Core Features](#2-core-features)
3. [Tech Stack](#3-tech-stack)
4. [Architecture & Layering](#4-architecture--layering)
5. [Important Architectural Note: Why There Is No Login](#5-important-architectural-note-why-there-is-no-login)
6. [Security & Access Control](#6-security--access-control)
7. [Efficiency & Performance](#7-efficiency--performance)
8. [Testing & Quality Assurance](#8-testing--quality-assurance)
9. [Accessibility (WCAG 2.1 AA)](#9-accessibility-wcag-21-aa)
10. [Running Locally](#10-running-locally)
11. [Environment Variables](#11-environment-variables)
12. [Deployment & Containerization](#12-deployment--containerization)

---

## 1. Problem Statement Alignment

**Hackathon Problem Statement:**
> "Create a GenAI-powered campus laboratory resource-sharing platform that helps students discover and access specialised equipment, development kits, and laboratory workstations across departments. The platform should enable equipment discovery, intelligent slot booking, project-based access requests, and faculty approvals while optimising resource utilisation. It should intelligently resolve scheduling conflicts by recommending fair and feasible equipment allocations based on project deadlines, availability, and student requirements."

### Alignment Matrix

| Requirement | Implementation in LabLink Nexus |
|---|---|
| Specialized equipment, dev kits, workstations discovery across departments | Full cross-department catalogue with category, lab filter, search, specifications modal, live status tags |
| Project-based access requests | Every booking links to a verified academic project (`projects` table / schema with title, description, requirements, deadline) |
| Intelligent slot booking | Slot engine with half-open intervals `[start, end)`, operational hours enforcement, zero-duration checks |
| Faculty approvals & review | Dedicated Faculty / Guide portal with request queues, approval/rejection actions, project context, conflict alerts |
| Fair & feasible conflict resolution | Deterministic explainable scoring engine (`scoring.engine.ts`) weighing urgency, suitability, time preference, fairness history |
| Multi-stakeholder collaboration | 6 distinct stakeholder views: Student, Faculty/Guide, Lab Technician, Lab Administrator, Department Head, College Management |
| GenAI assistance | Server-side Gemini API integration for requirement interpretation and recommendations with deterministic fallback |

---

## 2. Core Features

| Stakeholder Persona | Dedicated Capabilities & Workflows |
|---|---|
| **Student** (`Alex Kumar`) | Cross-department resource catalogue, AI project recommendations, slot selector, academic project linking, booking tracker, live status updates |
| **Faculty / Guide** (`Dr. Sarah Jenkins`) | Department-scoped pending booking review, student project briefs, one-click approve/reject actions, conflict impact summary |
| **Lab Technician** (`Rajesh Sharma`) | Real-time workstation status, check-in/handover logs, maintenance scheduling, equipment calibration toggles |
| **Lab Administrator** (`Dr. Aris Thorne`) | Cross-lab inventory management, slot configuration, maintenance overrides, utilization analytics |
| **Department Head (HOD)** (`Prof. David Kim`) | Inter-department resource sharing metrics, departmental approval overrides, capstone project priority tracking |
| **College Management** (`Dr. Eleanor Vance`) | Institution-wide asset utilization, peak-hour bottlenecks, capacity planning analytics, research output ROI |

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript (strict), Pure CSS Design Tokens |
| Backend | Next.js Server Route Handlers with isolated service layer |
| Database | PostgreSQL on Supabase with Row Level Security (RLS) & `btree_gist` GiST constraints |
| Validation | Zod schemas across all inputs and outputs |
| GenAI | Google Gemini 1.5 Flash (server-side only, validated with Zod, deterministic fallback) |
| Unit & Integration Testing | Vitest with `@vitest/coverage-v8` (Engine & Security Coverage > 85%) |
| E2E & Accessibility Testing | Playwright Chromium with `@axe-core/playwright` (0 critical/serious violations) |
| Containerization | Multi-stage Dockerfile (`node:20-alpine`, Next.js `output: 'standalone'`) for Google Cloud Run |
| CI Pipeline | GitHub Actions verifying lint, typecheck, unit tests, coverage, E2E, audit, and build |

---

## 4. Architecture & Layering

```
Browser (Next.js 15 App Router UI)
   │  HTTPS
   ▼
Route Handlers (/api/v1/*, /api/demo/session)
   │  (Zod validation + Cryptographic session verification + Rate limiting)
   ▼
Services Layer (booking, scheduling, scoring, recommendations)
   │                       │
   ▼                       ▼
Repositories            Google Gemini API Client (Server-side only)
   │                       (Validated via Zod; unknown IDs discarded)
   ▼
Supabase PostgreSQL
   (RLS Policies + GiST Exclusion Constraints + Performance Indexes)
```

**Key Architectural Invariants:**
- Route handlers contain no business logic; they validate input and delegate to services.
- The allocation scoring and interval engines are pure functions with zero I/O, ensuring deterministic and fast testability.
- Repositories are the sole database access layer.
- AI is never in the critical path for data integrity: if Gemini fails or is unconfigured, the app falls back deterministically.

---

## 5. Important Architectural Note: Why There Is No Login

**This project does not include a user sign-up or login screen. This was a deliberate decision, made on instruction from our hackathon instructor, who asked participants not to require login so that evaluators and judges can open the application and explore it immediately without friction.**

### How the Zero-Friction Persona System Works:
- Evaluators select any of the six stakeholder personas directly on the entry screen or via the persistent "Switch Role" control.
- Selecting a persona initiates a cryptographic demo session via `POST /api/demo/session`, issuing an `httpOnly`, `SameSite=Lax` cookie (`lablink_demo_session`).
- The server validates all downstream requests against this cryptographically signed session. Role elevation attempts (e.g. Student calling Faculty approval endpoints) return HTTP `403 Forbidden`.
- The demo mechanism is gated behind `DEMO_MODE=true`. When `DEMO_MODE=false`, the demo route returns `404 Not Found`.

**Production Path:** Moving to production requires zero changes to database RLS policies or business logic. Simply setting `DEMO_MODE=false` disables the demo system, allowing Supabase Auth / campus SSO to provide the JWT tokens that the service layer already consumes.

---

## 6. Security & Access Control

| Threat Vector | Mitigation Strategy |
|---|---|
| **Role Tampering from Client** | Server-side cryptographic HMAC-SHA256 demo session tokens; role is never trusted from request body |
| **Cross-Department Approvals** | Department-scoped RLS policies and server-side checks restrict faculty actions to their department |
| **Double Booking / Race Conditions** | PostgreSQL exclusion constraint (`btree_gist` + `tstzrange`) on approved bookings prevents overlapping reservations at the database level |
| **SQL Injection** | Parameterized queries exclusively via Supabase client; zero dynamic raw SQL strings |
| **Cross-Site Scripting (XSS)** | React DOM escaping, strict Content Security Policy, zero `dangerouslySetInnerHTML` |
| **AI Hallucinations / Injection** | Gemini prompt outputs validated against Zod schemas; hallucinated equipment IDs are discarded against active DB records |
| **Abuse & DoS** | IP-based rate limiting on demo session switching and AI recommendation endpoints |
| **Vulnerable Dependencies** | Clean `package-lock.json` verified with `npm audit --omit=dev` (0 vulnerabilities) |

---

## 7. Efficiency & Performance

- **Pure CSS "Living Lab" Design System:** Aurora glows, technical grid, and subtle noise grain rendered entirely via CSS gradients and radial masks. Zero JS animation runtime overhead.
- **Database Optimization:** Composite indexes on `bookings(student_id, created_at desc)`, `bookings(equipment_id, start_time, end_time)`, and partial index on `bookings(created_at desc) where status = 'pending'`.
- **Bundle Optimization:** `next.config.ts` configured with `output: 'standalone'` and code-splitting, keeping initial client bundle under 150 KB.

---

## 8. Testing & Quality Assurance

Comprehensive testing across unit, integration, E2E, and accessibility layers:

```bash
# Run Unit & Integration Tests with Coverage Report
npm run test:coverage

# Run End-to-End Tests & Axe-Core Accessibility Scan
npm run test:e2e

# Run Linter & TypeScript Strict Typecheck
npm run lint && npx tsc --noEmit
```

- **Scheduling & Allocation Engines:** 100% test coverage covering half-open intervals, boundary checks, collision detection, and tie-breaking.
- **Security & Route Handlers:** Integration tests verifying 403 Forbidden on role mismatches, rate-limiting thresholds, and Zod input validation.
- **Accessibility (axe-core):** Automated scans verifying 0 critical or serious WCAG accessibility violations.

---

## 9. Accessibility (WCAG 2.1 AA)

- Semantic HTML structure with proper landmark regions (`<header>`, `<main>`, `<nav>`, `<aside>`).
- Keyboard navigability with visible focus indicators and modal focus traps.
- `role="status"` and `aria-live` announcements for booking actions and asynchronous status updates.
- Contrast ratios >= 4.5:1 across surfaces and text.
- Full support for `prefers-reduced-motion` media queries.

---

## 10. Running Locally

```bash
# 1. Clone repository
git clone <repository-url>
cd "lab link final"

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local

# 4. Start local development server
npm run dev
```

Open `http://localhost:3000` in your browser. Choose any persona to explore the stakeholder dashboards.

### Seeded Stakeholder Personas

| Persona Name | Stakeholder Role | Department | Demo Email |
|---|---|---|---|
| **Alex Kumar** | Student | Robotics & Automation | alex.kumar@campus.edu |
| **Dr. Sarah Jenkins** | Faculty / Guide | Robotics & Automation | sarah.jenkins@campus.edu |
| **Rajesh Sharma** | Lab Technician | Electronics & VLSI | rajesh.sharma@campus.edu |
| **Dr. Aris Thorne** | Lab Administrator | Artificial Intelligence | aris.thorne@campus.edu |
| **Prof. David Kim** | Department Head (HOD) | Computer Science & Eng | david.kim@campus.edu |
| **Dr. Eleanor Vance** | College Management | Institutional Affairs | eleanor.vance@campus.edu |

---

## 11. Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DEMO_MODE` | Yes | `true` | Enables zero-login persona selection & cryptographic demo sessions |
| `PORT` | No | `3000` | Application server port (8080 on Cloud Run) |
| `DEMO_SESSION_SECRET` | No | Built-in fallback | Secret for signing demo session tokens via HMAC-SHA256 |
| `GEMINI_API_KEY` | Optional | - | Enables live Google Gemini 1.5 Flash recommendations (deterministic fallback if unset) |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | - | Supabase Postgres URL (required in full production) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | - | Supabase service role key (server-side only) |

---

## 12. Deployment & Containerization

LabLink Nexus is container-ready for **Google Cloud Run**:

```bash
# Build standalone Docker image
docker build -t lablink-nexus:latest .

# Run Docker container locally
docker run -p 8080:8080 -e DEMO_MODE=true lablink-nexus:latest
```

The multi-stage `Dockerfile` leverages Next.js `output: 'standalone'` to create an ultra-lean production container (~120 MB) running as an unprivileged `nextjs` user.
