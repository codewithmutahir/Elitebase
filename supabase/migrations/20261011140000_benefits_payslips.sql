-- Company benefits catalog, employee enrollments, and published payslips.

create table if not exists public.company_benefits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  description text,
  category text not null default 'other'
    check (category in ('health', 'dental', 'vision', 'retirement', 'pto', 'other')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists company_benefits_company_id_idx
  on public.company_benefits (company_id);

create table if not exists public.employee_benefits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  benefit_id uuid not null references public.company_benefits(id) on delete cascade,
  status text not null default 'enrolled'
    check (status in ('eligible', 'enrolled', 'waived')),
  notes text,
  enrolled_at timestamptz,
  created_at timestamptz not null default now(),
  unique (employee_id, benefit_id)
);

create index if not exists employee_benefits_employee_id_idx
  on public.employee_benefits (employee_id);

create index if not exists employee_benefits_company_id_idx
  on public.employee_benefits (company_id);

create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  period_label text,
  gross_amount numeric(12, 2),
  net_amount numeric(12, 2),
  currency text,
  file_path text,
  file_url text,
  notes text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint payslips_period_check check (period_end >= period_start)
);

create index if not exists payslips_employee_published_idx
  on public.payslips (employee_id, published_at desc);

create index if not exists payslips_company_id_idx
  on public.payslips (company_id);

alter table public.company_benefits enable row level security;
alter table public.employee_benefits enable row level security;
alter table public.payslips enable row level security;

drop policy if exists "company_benefits_company_all" on public.company_benefits;
create policy "company_benefits_company_select"
  on public.company_benefits for select to authenticated
  using (exists (select 1 from public.companies c where c.id = company_benefits.company_id and c.owner_uid = auth.uid()::text));
create policy "company_benefits_company_insert"
  on public.company_benefits for insert to authenticated
  with check (exists (select 1 from public.companies c where c.id = company_benefits.company_id and c.owner_uid = auth.uid()::text));
create policy "company_benefits_company_update"
  on public.company_benefits for update to authenticated
  using (exists (select 1 from public.companies c where c.id = company_benefits.company_id and c.owner_uid = auth.uid()::text))
  with check (exists (select 1 from public.companies c where c.id = company_benefits.company_id and c.owner_uid = auth.uid()::text));
create policy "company_benefits_company_delete"
  on public.company_benefits for delete to authenticated
  using (exists (select 1 from public.companies c where c.id = company_benefits.company_id and c.owner_uid = auth.uid()::text));

create policy "employee_benefits_company_select"
  on public.employee_benefits for select to authenticated
  using (exists (select 1 from public.companies c where c.id = employee_benefits.company_id and c.owner_uid = auth.uid()::text));
create policy "employee_benefits_company_insert"
  on public.employee_benefits for insert to authenticated
  with check (exists (select 1 from public.companies c where c.id = employee_benefits.company_id and c.owner_uid = auth.uid()::text));
create policy "employee_benefits_company_update"
  on public.employee_benefits for update to authenticated
  using (exists (select 1 from public.companies c where c.id = employee_benefits.company_id and c.owner_uid = auth.uid()::text))
  with check (exists (select 1 from public.companies c where c.id = employee_benefits.company_id and c.owner_uid = auth.uid()::text));
create policy "employee_benefits_company_delete"
  on public.employee_benefits for delete to authenticated
  using (exists (select 1 from public.companies c where c.id = employee_benefits.company_id and c.owner_uid = auth.uid()::text));

create policy "payslips_company_select"
  on public.payslips for select to authenticated
  using (exists (select 1 from public.companies c where c.id = payslips.company_id and c.owner_uid = auth.uid()::text));
create policy "payslips_company_insert"
  on public.payslips for insert to authenticated
  with check (exists (select 1 from public.companies c where c.id = payslips.company_id and c.owner_uid = auth.uid()::text));
create policy "payslips_company_update"
  on public.payslips for update to authenticated
  using (exists (select 1 from public.companies c where c.id = payslips.company_id and c.owner_uid = auth.uid()::text))
  with check (exists (select 1 from public.companies c where c.id = payslips.company_id and c.owner_uid = auth.uid()::text));
create policy "payslips_company_delete"
  on public.payslips for delete to authenticated
  using (exists (select 1 from public.companies c where c.id = payslips.company_id and c.owner_uid = auth.uid()::text));
