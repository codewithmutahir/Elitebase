-- Leave balances + company leave policy + deduction ledger for approve/cancel.

-- ---------------------------------------------------------------------------
-- Company leave policy (defaults: 6 sick + 6 paid, calendar year)
-- ---------------------------------------------------------------------------
alter table public.companies
  add column if not exists leave_sick_total_default smallint not null default 6,
  add column if not exists leave_paid_total_default smallint not null default 6,
  add column if not exists leave_year_type text not null default 'calendar',
  add column if not exists leave_prorate_mid_year boolean not null default false;

alter table public.companies
  drop constraint if exists companies_leave_sick_total_default_check;
alter table public.companies
  add constraint companies_leave_sick_total_default_check
  check (leave_sick_total_default >= 0 and leave_sick_total_default <= 366);

alter table public.companies
  drop constraint if exists companies_leave_paid_total_default_check;
alter table public.companies
  add constraint companies_leave_paid_total_default_check
  check (leave_paid_total_default >= 0 and leave_paid_total_default <= 366);

alter table public.companies
  drop constraint if exists companies_leave_year_type_check;
alter table public.companies
  add constraint companies_leave_year_type_check
  check (leave_year_type in ('calendar', 'anniversary'));

-- ---------------------------------------------------------------------------
-- Per-employee yearly balances
-- ---------------------------------------------------------------------------
create table if not exists public.leave_balances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  year integer not null,
  sick_total smallint not null default 6,
  sick_used smallint not null default 0,
  paid_total smallint not null default 6,
  paid_used smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint leave_balances_year_check check (year >= 2000 and year <= 2100),
  constraint leave_balances_sick_bounds check (
    sick_total >= 0 and sick_used >= 0 and sick_used <= sick_total
  ),
  constraint leave_balances_paid_bounds check (
    paid_total >= 0 and paid_used >= 0 and paid_used <= paid_total
  ),
  constraint leave_balances_employee_year_unique unique (employee_id, year)
);

create index if not exists leave_balances_company_year_idx
  on public.leave_balances (company_id, year);

create index if not exists leave_balances_employee_idx
  on public.leave_balances (employee_id);

-- ---------------------------------------------------------------------------
-- Manual adjustments (employer) — audit trail
-- ---------------------------------------------------------------------------
create table if not exists public.leave_balance_adjustments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  year integer not null,
  bucket text not null check (bucket in ('sick', 'paid')),
  field text not null check (field in ('total', 'used')),
  delta integer not null,
  before_total smallint not null,
  before_used smallint not null,
  after_total smallint not null,
  after_used smallint not null,
  reason text not null,
  actor_uid text not null,
  created_at timestamptz not null default now(),
  constraint leave_balance_adjustments_reason_len check (
    char_length(trim(reason)) >= 3 and char_length(reason) <= 500
  ),
  constraint leave_balance_adjustments_delta_nonzero check (delta <> 0)
);

create index if not exists leave_balance_adjustments_employee_idx
  on public.leave_balance_adjustments (employee_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Deductions applied when a leave request is approved (for restore on cancel)
-- ---------------------------------------------------------------------------
create table if not exists public.leave_balance_deductions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  request_id uuid not null references public.time_off_requests(id) on delete cascade,
  year integer not null,
  bucket text not null check (bucket in ('sick', 'paid', 'lwp')),
  days smallint not null check (days > 0),
  created_at timestamptz not null default now(),
  constraint leave_balance_deductions_request_year_bucket_unique
    unique (request_id, year, bucket)
);

create index if not exists leave_balance_deductions_request_idx
  on public.leave_balance_deductions (request_id);

-- Flag LWP days on the request for payslip / reporting.
alter table public.time_off_requests
  add column if not exists lwp_days smallint not null default 0,
  add column if not exists balance_days_charged smallint not null default 0;

alter table public.time_off_requests
  drop constraint if exists time_off_requests_lwp_days_check;
alter table public.time_off_requests
  add constraint time_off_requests_lwp_days_check check (lwp_days >= 0);

alter table public.time_off_requests
  drop constraint if exists time_off_requests_balance_days_charged_check;
alter table public.time_off_requests
  add constraint time_off_requests_balance_days_charged_check
  check (balance_days_charged >= 0);

-- ---------------------------------------------------------------------------
-- RLS (owner-scoped; app uses service role for portal/employee reads)
-- ---------------------------------------------------------------------------
alter table public.leave_balances enable row level security;
alter table public.leave_balance_adjustments enable row level security;
alter table public.leave_balance_deductions enable row level security;

drop policy if exists "leave_balances_company_select" on public.leave_balances;
create policy "leave_balances_company_select"
  on public.leave_balances for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = leave_balances.company_id and c.owner_uid = auth.uid()::text
    )
  );

drop policy if exists "leave_balances_company_insert" on public.leave_balances;
create policy "leave_balances_company_insert"
  on public.leave_balances for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = leave_balances.company_id and c.owner_uid = auth.uid()::text
    )
  );

drop policy if exists "leave_balances_company_update" on public.leave_balances;
create policy "leave_balances_company_update"
  on public.leave_balances for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = leave_balances.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = leave_balances.company_id and c.owner_uid = auth.uid()::text
    )
  );

drop policy if exists "leave_balance_adjustments_company_select" on public.leave_balance_adjustments;
create policy "leave_balance_adjustments_company_select"
  on public.leave_balance_adjustments for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = leave_balance_adjustments.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

drop policy if exists "leave_balance_adjustments_company_insert" on public.leave_balance_adjustments;
create policy "leave_balance_adjustments_company_insert"
  on public.leave_balance_adjustments for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = leave_balance_adjustments.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

drop policy if exists "leave_balance_deductions_company_select" on public.leave_balance_deductions;
create policy "leave_balance_deductions_company_select"
  on public.leave_balance_deductions for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = leave_balance_deductions.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

drop policy if exists "leave_balance_deductions_company_all" on public.leave_balance_deductions;
create policy "leave_balance_deductions_company_insert"
  on public.leave_balance_deductions for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = leave_balance_deductions.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "leave_balance_deductions_company_delete"
  on public.leave_balance_deductions for delete to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = leave_balance_deductions.company_id
        and c.owner_uid = auth.uid()::text
    )
  );
