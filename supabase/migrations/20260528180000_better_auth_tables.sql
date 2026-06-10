-- Better Auth core tables (PostgreSQL)
-- Run this in Supabase SQL Editor if CLI migrate is unavailable.

create table if not exists public."user" (
  id text primary key,
  name text not null,
  email text not null unique,
  "emailVerified" boolean not null default false,
  image text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public."session" (
  id text primary key,
  "userId" text not null references public."user"(id) on delete cascade,
  token text not null unique,
  "expiresAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public."account" (
  id text primary key,
  "userId" text not null references public."user"(id) on delete cascade,
  "accountId" text not null,
  "providerId" text not null,
  "accessToken" text,
  "refreshToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  scope text,
  "idToken" text,
  password text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table if not exists public."verification" (
  id text primary key,
  identifier text not null,
  value text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz default now(),
  "updatedAt" timestamptz default now()
);

create index if not exists session_userId_idx on public."session" ("userId");
create index if not exists account_userId_idx on public."account" ("userId");
create index if not exists verification_identifier_idx on public."verification" (identifier);

-- Point companies.owner_uid at Better Auth user table (not auth.users).
-- Better Auth user.id is text; older step-1 schemas used uuid → auth.users(id).
-- RLS policies must be dropped before altering owner_uid (Postgres restriction).

drop policy if exists "companies_owner_select" on public.companies;
drop policy if exists "companies_owner_insert" on public.companies;
drop policy if exists "companies_owner_update" on public.companies;
drop policy if exists "employees_company_select" on public.employees;
drop policy if exists "employees_company_insert" on public.employees;
drop policy if exists "employees_company_update" on public.employees;
drop policy if exists "employee_pins_company_select" on public.employee_pins;
drop policy if exists "employee_pins_company_insert" on public.employee_pins;
drop policy if exists "employee_pins_company_update" on public.employee_pins;
drop policy if exists "kiosk_tablets_company_select" on public.kiosk_tablets;
drop policy if exists "kiosk_tablets_company_insert" on public.kiosk_tablets;
drop policy if exists "kiosk_tablets_company_update" on public.kiosk_tablets;
drop policy if exists "attendance_company_select" on public.attendance;
drop policy if exists "attendance_company_insert" on public.attendance;
drop policy if exists "attendance_company_update" on public.attendance;
drop policy if exists "schedules_company_select" on public.schedules;
drop policy if exists "schedules_company_insert" on public.schedules;
drop policy if exists "schedules_company_update" on public.schedules;

alter table public.companies drop constraint if exists companies_owner_uid_fkey;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'companies'
      and column_name = 'owner_uid'
      and udt_name = 'uuid'
  ) then
    alter table public.companies
      alter column owner_uid type text using owner_uid::text;
  end if;
end $$;

-- Do not add FK to public."user" when Better Auth uses Turso (see 20260528200000).

-- Recreate RLS policies (owner_uid is text; cast auth.uid() for comparisons).
-- Note: these still use Supabase auth.uid() until dashboard uses Better Auth JWT + RLS.

create policy "companies_owner_select"
  on public.companies for select to authenticated
  using (owner_uid = auth.uid()::text);

create policy "companies_owner_insert"
  on public.companies for insert to authenticated
  with check (owner_uid = auth.uid()::text);

create policy "companies_owner_update"
  on public.companies for update to authenticated
  using (owner_uid = auth.uid()::text)
  with check (owner_uid = auth.uid()::text);

create policy "employees_company_select"
  on public.employees for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employees.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "employees_company_insert"
  on public.employees for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employees.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "employees_company_update"
  on public.employees for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employees.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employees.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "employee_pins_company_select"
  on public.employee_pins for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employee_pins.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "employee_pins_company_insert"
  on public.employee_pins for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employee_pins.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "employee_pins_company_update"
  on public.employee_pins for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employee_pins.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employee_pins.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "kiosk_tablets_company_select"
  on public.kiosk_tablets for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = kiosk_tablets.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "kiosk_tablets_company_insert"
  on public.kiosk_tablets for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = kiosk_tablets.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "kiosk_tablets_company_update"
  on public.kiosk_tablets for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = kiosk_tablets.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = kiosk_tablets.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "attendance_company_select"
  on public.attendance for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = attendance.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "attendance_company_insert"
  on public.attendance for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = attendance.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "attendance_company_update"
  on public.attendance for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = attendance.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = attendance.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "schedules_company_select"
  on public.schedules for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = schedules.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "schedules_company_insert"
  on public.schedules for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = schedules.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "schedules_company_update"
  on public.schedules for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = schedules.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = schedules.company_id and c.owner_uid = auth.uid()::text
    )
  );
