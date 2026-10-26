-- Employee salary / wage increment history (tracks raises over time).

create table if not exists public.employee_salary_increments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  effective_date date not null,
  pay_type text not null
    check (pay_type in ('hourly', 'salary')),
  previous_amount numeric(12, 2) not null
    check (previous_amount >= 0),
  new_amount numeric(12, 2) not null
    check (new_amount > 0),
  increment_amount numeric(12, 2) generated always as (new_amount - previous_amount) stored,
  kind text not null default 'raise'
    check (kind in ('raise', 'adjustment', 'promotion', 'correction')),
  reason text,
  created_by text,
  created_by_name text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists employee_salary_increments_employee_date_idx
  on public.employee_salary_increments (employee_id, effective_date desc, created_at desc);

create index if not exists employee_salary_increments_company_id_idx
  on public.employee_salary_increments (company_id);

alter table public.employee_salary_increments enable row level security;

create policy "employee_salary_increments_company_select"
  on public.employee_salary_increments for select to authenticated
  using (exists (
    select 1 from public.companies c
    where c.id = employee_salary_increments.company_id
      and c.owner_uid = auth.uid()::text
  ));

create policy "employee_salary_increments_company_insert"
  on public.employee_salary_increments for insert to authenticated
  with check (exists (
    select 1 from public.companies c
    where c.id = employee_salary_increments.company_id
      and c.owner_uid = auth.uid()::text
  ));

create policy "employee_salary_increments_company_update"
  on public.employee_salary_increments for update to authenticated
  using (exists (
    select 1 from public.companies c
    where c.id = employee_salary_increments.company_id
      and c.owner_uid = auth.uid()::text
  ))
  with check (exists (
    select 1 from public.companies c
    where c.id = employee_salary_increments.company_id
      and c.owner_uid = auth.uid()::text
  ));

create policy "employee_salary_increments_company_delete"
  on public.employee_salary_increments for delete to authenticated
  using (exists (
    select 1 from public.companies c
    where c.id = employee_salary_increments.company_id
      and c.owner_uid = auth.uid()::text
  ));
