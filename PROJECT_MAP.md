# Project map

- `src/app/page.tsx`: live equipment catalogue landing page.
- `src/app/api/v1/equipment`: authenticated equipment discovery.
- `src/app/api/v1/projects`: project creation with ownership.
- `src/app/api/v1/bookings`: student booking request endpoint.
- `src/app/api/v1/faculty`: faculty request review and approval.
- `src/app/api/v1/ai`: Gemini-backed requirement interpretation with fallback.
- `src/features/booking`: booking validation and interval conflict helpers.
- `src/features/allocation`: deterministic weighted scoring.
- `supabase/migrations`: PostgreSQL schema, constraints, indexes and starter RLS.
- `supabase/seed.sql`: sample departments and equipment.
- `tests`: add integration and Playwright coverage here.
