-- Worksite geofence + portal remote punch support.

alter table public.companies
  add column if not exists allow_remote_punch boolean not null default false;

alter table public.companies
  add column if not exists require_geofence boolean not null default true;

comment on column public.companies.allow_remote_punch is
  'When true, employees may clock in/out from the web portal with face + GPS.';
comment on column public.companies.require_geofence is
  'When true (and remote punch enabled), punch must be inside an active worksite radius.';

create table if not exists public.worksites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  radius_meters integer not null default 150
    check (radius_meters >= 30 and radius_meters <= 5000),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists worksites_company_id_idx
  on public.worksites (company_id)
  where is_active = true;

comment on table public.worksites is
  'Employer-defined sites for portal punch geofence checks.';

alter table public.kiosk_tablets
  add column if not exists worksite_id uuid references public.worksites(id) on delete set null;

alter table public.attendance
  add column if not exists punch_lat double precision,
  add column if not exists punch_lng double precision,
  add column if not exists punch_accuracy_m double precision,
  add column if not exists worksite_id uuid references public.worksites(id) on delete set null,
  add column if not exists within_geofence boolean,
  add column if not exists punch_source text;

alter table public.attendance
  drop constraint if exists attendance_punch_source_check;

alter table public.attendance
  add constraint attendance_punch_source_check
  check (punch_source is null or punch_source in ('kiosk', 'portal'));

alter table public.worksites enable row level security;

drop policy if exists "worksites_company_select" on public.worksites;
drop policy if exists "worksites_company_insert" on public.worksites;
drop policy if exists "worksites_company_update" on public.worksites;
drop policy if exists "worksites_company_delete" on public.worksites;

create policy "worksites_company_select"
  on public.worksites for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = worksites.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "worksites_company_insert"
  on public.worksites for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = worksites.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "worksites_company_update"
  on public.worksites for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = worksites.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = worksites.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "worksites_company_delete"
  on public.worksites for delete to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = worksites.company_id and c.owner_uid = auth.uid()::text
    )
  );
