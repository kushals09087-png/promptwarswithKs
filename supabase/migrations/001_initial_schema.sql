-- ============================================================================
-- LABLINK NEXUS: PRODUCTION POSTGRESQL SCHEMA WITH MULTI-STAKEHOLDER RLS
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

-- 1. All 6 Canonical Roles + Aliases
create type public.app_role as enum (
  'student',
  'faculty',
  'technician',
  'lab_admin',
  'admin',
  'hod',
  'management'
);

create type public.equipment_status as enum ('active', 'maintenance', 'unavailable');
create type public.booking_status as enum ('pending', 'approved', 'rejected', 'cancelled');

-- 2. Departments
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- 3. Profiles (Linked to Supabase Auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'student',
  department_id uuid references public.departments(id),
  created_at timestamptz not null default now()
);

-- 4. Equipment Catalogue
create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid not null references public.departments(id),
  description text,
  specifications jsonb not null default '{}'::jsonb,
  location text,
  status public.equipment_status not null default 'active',
  opening_time time,
  closing_time time,
  created_at timestamptz not null default now()
);

-- 5. Academic Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 3 and 120),
  description text not null,
  requirements text not null,
  deadline date not null,
  created_at timestamptz not null default now()
);

-- 6. Intelligent Bookings with GiST Exclusion Constraint to Prevent Double-Booking
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id),
  equipment_id uuid not null references public.equipment(id),
  project_id uuid not null references public.projects(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.booking_status not null default 'pending',
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint valid_booking_interval check (start_time < end_time),
  constraint no_overlapping_approved_bookings
    exclude using gist (
      equipment_id with =,
      tstzrange(start_time, end_time, '[)') with &&
    ) where (status = 'approved')
);

-- 7. Allocation Audit History
create table public.allocation_history (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  student_id uuid not null references public.profiles(id),
  equipment_id uuid not null references public.equipment(id),
  outcome text not null,
  allocation_score numeric(6,2),
  created_at timestamptz not null default now()
);

-- Performance Indexes
create index idx_equipment_department on public.equipment(department_id);
create index idx_equipment_status on public.equipment(status);
create index idx_projects_student on public.projects(student_id);
create index idx_bookings_student_created on public.bookings(student_id, created_at desc);
create index idx_bookings_equipment_time on public.bookings(equipment_id, start_time, end_time);
create index idx_bookings_pending on public.bookings(created_at desc) where status = 'pending';
create index idx_allocation_student on public.allocation_history(student_id, created_at desc);

-- Enable Row Level Security on All Tables
alter table public.departments enable row level security;
alter table public.profiles enable row level security;
alter table public.equipment enable row level security;
alter table public.projects enable row level security;
alter table public.bookings enable row level security;
alter table public.allocation_history enable row level security;

-- Department & Role Resolution Helpers (SECURITY DEFINER)
create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.current_department_id()
returns uuid
language sql stable security definer
set search_path = public
as $$
  select department_id from public.profiles where id = auth.uid()
$$;

-- RLS Policies
create policy "Authenticated users read departments"
on public.departments for select to authenticated using (true);

create policy "Users read own profile"
on public.profiles for select to authenticated using (id = auth.uid() or public.current_app_role() in ('lab_admin', 'admin', 'management', 'hod'));

create policy "Users read active equipment"
on public.equipment for select to authenticated using (status <> 'unavailable' or public.current_app_role() in ('technician', 'lab_admin', 'admin'));

create policy "Students read own projects"
on public.projects for select to authenticated using (
  student_id = auth.uid() or public.current_app_role() in ('faculty', 'hod', 'management')
);

create policy "Students create own projects"
on public.projects for insert to authenticated
with check (student_id = auth.uid());

create policy "Students read own bookings"
on public.bookings for select to authenticated using (
  student_id = auth.uid()
  or public.current_app_role() in ('lab_admin', 'admin', 'management', 'hod')
  or (
    public.current_app_role() in ('faculty', 'technician')
    and exists (
      select 1 from public.equipment e
      where e.id = equipment_id
      and e.department_id = public.current_department_id()
    )
  )
);

create policy "Students create own pending bookings"
on public.bookings for insert to authenticated
with check (
  student_id = auth.uid()
  and status = 'pending'
  and exists (
    select 1 from public.projects p
    where p.id = project_id and p.student_id = auth.uid()
  )
);

create policy "Faculty and admins decide bookings"
on public.bookings for update to authenticated
using (
  public.current_app_role() in ('lab_admin', 'admin')
  or (
    public.current_app_role() = 'faculty'
    and exists (
      select 1 from public.equipment e
      where e.id = equipment_id
      and e.department_id = public.current_department_id()
    )
  )
)
with check (
  public.current_app_role() in ('faculty', 'lab_admin', 'admin')
);

create policy "Users read allocation history"
on public.allocation_history for select to authenticated
using (
  student_id = auth.uid() or public.current_app_role() in ('faculty', 'lab_admin', 'admin', 'hod', 'management')
);
