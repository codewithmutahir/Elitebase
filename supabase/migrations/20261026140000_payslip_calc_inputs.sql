-- Inputs for payslip calculation: allowances, loans, late policy.
-- Does not change payslip lifecycle yet (Phase 3).

-- ---------------------------------------------------------------------------
-- Company late / payslip policy knobs
-- ---------------------------------------------------------------------------
alter table public.companies
  add column if not exists lates_per_day_deduction smallint not null default 3,
  add column if not exists late_remainder_carry_month boolean not null default false,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists phone_primary text,
  add column if not exists phone_secondary text;

alter table public.companies
  drop constraint if exists companies_lates_per_day_deduction_check;
alter table public.companies
  add constraint companies_lates_per_day_deduction_check
  check (lates_per_day_deduction >= 1 and lates_per_day_deduction <= 30);

-- ---------------------------------------------------------------------------
-- Employee allowances (multiple line items)
-- ---------------------------------------------------------------------------
create table if not exists public.employee_allowances (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  label text not null,
  amount_cents bigint not null check (amount_cents >= 0),
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_allowances_label_len check (
    char_length(trim(label)) >= 1 and char_length(label) <= 120
  )
);

create index if not exists employee_allowances_employee_idx
  on public.employee_allowances (employee_id, is_active, sort_order);

-- ---------------------------------------------------------------------------
-- Employee loans (supports multiple; payslip clamps installment to remaining)
-- ---------------------------------------------------------------------------
create table if not exists public.employee_loans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  label text not null default 'Loan',
  balance_cents bigint not null check (balance_cents >= 0),
  installment_cents bigint not null check (installment_cents >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_loans_label_len check (
    char_length(trim(label)) >= 1 and char_length(label) <= 120
  )
);

create index if not exists employee_loans_employee_idx
  on public.employee_loans (employee_id, is_active);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.employee_allowances enable row level security;
alter table public.employee_loans enable row level security;

create policy "employee_allowances_company_select"
  on public.employee_allowances for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employee_allowances.company_id and c.owner_uid = auth.uid()::text
    )
  );
create policy "employee_allowances_company_insert"
  on public.employee_allowances for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employee_allowances.company_id and c.owner_uid = auth.uid()::text
    )
  );
create policy "employee_allowances_company_update"
  on public.employee_allowances for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employee_allowances.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employee_allowances.company_id and c.owner_uid = auth.uid()::text
    )
  );
create policy "employee_allowances_company_delete"
  on public.employee_allowances for delete to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employee_allowances.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "employee_loans_company_select"
  on public.employee_loans for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employee_loans.company_id and c.owner_uid = auth.uid()::text
    )
  );
create policy "employee_loans_company_insert"
  on public.employee_loans for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employee_loans.company_id and c.owner_uid = auth.uid()::text
    )
  );
create policy "employee_loans_company_update"
  on public.employee_loans for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employee_loans.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employee_loans.company_id and c.owner_uid = auth.uid()::text
    )
  );
create policy "employee_loans_company_delete"
  on public.employee_loans for delete to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employee_loans.company_id and c.owner_uid = auth.uid()::text
    )
  );
