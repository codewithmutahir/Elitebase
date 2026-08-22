-- Time-off requests for PTO / sick / personal leave.

create table if not exists public.time_off_requests (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  request_type text not null default 'vacation',
  status text not null default 'pending',
  reason text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint time_off_requests_date_range check (end_date >= start_date),
  constraint time_off_requests_type_check
    check (request_type in ('vacation', 'sick', 'personal', 'unpaid')),
  constraint time_off_requests_status_check
    check (status in ('pending', 'approved', 'denied', 'cancelled'))
);

create index if not exists time_off_requests_company_status_idx
  on public.time_off_requests (company_id, status, start_date desc);

create index if not exists time_off_requests_employee_dates_idx
  on public.time_off_requests (employee_id, start_date, end_date)
  where status = 'approved';

alter table public.time_off_requests enable row level security;

drop policy if exists "time_off_requests_company_select" on public.time_off_requests;
drop policy if exists "time_off_requests_company_insert" on public.time_off_requests;
drop policy if exists "time_off_requests_company_update" on public.time_off_requests;

create policy "time_off_requests_company_select"
  on public.time_off_requests for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = time_off_requests.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "time_off_requests_company_insert"
  on public.time_off_requests for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = time_off_requests.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "time_off_requests_company_update"
  on public.time_off_requests for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = time_off_requests.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = time_off_requests.company_id and c.owner_uid = auth.uid()::text
    )
  );
