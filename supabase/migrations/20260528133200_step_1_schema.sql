create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  owner_uid text not null,
  timezone text default 'America/New_York',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  full_name text not null,
  email text,
  role text default 'employee',
  department text,
  position text,
  hire_date date,
  face_descriptor vector(128),
  face_registered_at timestamptz,
  face_consent boolean default false,
  face_consent_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.employee_pins (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  pin text not null,
  created_at timestamptz default now(),
  unique (employee_id, company_id)
);

create table if not exists public.kiosk_tablets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id) on delete cascade,
  location_name text default 'Main Location',
  setup_code text unique,
  tablet_token text unique,
  is_active boolean default true,
  last_seen_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id),
  company_id uuid references public.companies(id),
  tablet_id uuid references public.kiosk_tablets(id),
  type text check (type in ('clock_in', 'clock_out', 'break_start', 'break_end')),
  timestamp timestamptz default now(),
  face_match_score float,
  created_at timestamptz default now()
);

create table if not exists public.schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies(id),
  employee_id uuid references public.employees(id),
  shift_date date not null,
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now()
);

alter table public.companies enable row level security;
alter table public.employees enable row level security;
alter table public.employee_pins enable row level security;
alter table public.kiosk_tablets enable row level security;
alter table public.attendance enable row level security;
alter table public.schedules enable row level security;

create policy "companies_owner_select"
  on public.companies
  for select
  to authenticated
  using (owner_uid = auth.uid()::text);

create policy "companies_owner_insert"
  on public.companies
  for insert
  to authenticated
  with check (owner_uid = auth.uid()::text);

create policy "companies_owner_update"
  on public.companies
  for update
  to authenticated
  using (owner_uid = auth.uid()::text)
  with check (owner_uid = auth.uid()::text);

create policy "employees_company_select"
  on public.employees
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.companies c
      where c.id = employees.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "employees_company_insert"
  on public.employees
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.companies c
      where c.id = employees.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "employees_company_update"
  on public.employees
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.companies c
      where c.id = employees.company_id
        and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1
      from public.companies c
      where c.id = employees.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "employee_pins_company_select"
  on public.employee_pins
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.companies c
      where c.id = employee_pins.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "employee_pins_company_insert"
  on public.employee_pins
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.companies c
      where c.id = employee_pins.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "employee_pins_company_update"
  on public.employee_pins
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.companies c
      where c.id = employee_pins.company_id
        and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1
      from public.companies c
      where c.id = employee_pins.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "kiosk_tablets_company_select"
  on public.kiosk_tablets
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.companies c
      where c.id = kiosk_tablets.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "kiosk_tablets_company_insert"
  on public.kiosk_tablets
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.companies c
      where c.id = kiosk_tablets.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "kiosk_tablets_company_update"
  on public.kiosk_tablets
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.companies c
      where c.id = kiosk_tablets.company_id
        and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1
      from public.companies c
      where c.id = kiosk_tablets.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "attendance_company_select"
  on public.attendance
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.companies c
      where c.id = attendance.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "attendance_company_insert"
  on public.attendance
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.companies c
      where c.id = attendance.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "attendance_company_update"
  on public.attendance
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.companies c
      where c.id = attendance.company_id
        and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1
      from public.companies c
      where c.id = attendance.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "schedules_company_select"
  on public.schedules
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.companies c
      where c.id = schedules.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "schedules_company_insert"
  on public.schedules
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.companies c
      where c.id = schedules.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "schedules_company_update"
  on public.schedules
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.companies c
      where c.id = schedules.company_id
        and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1
      from public.companies c
      where c.id = schedules.company_id
        and c.owner_uid = auth.uid()::text
    )
  );
