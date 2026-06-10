-- Recurring weekly availability per employee (scheduling)

create table if not exists public.employee_availability (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  day_of_week smallint not null check (day_of_week >= 0 and day_of_week <= 6),
  is_available boolean not null default true,
  start_time time,
  end_time time,
  updated_at timestamptz not null default now(),
  unique (employee_id, day_of_week)
);

create index if not exists employee_availability_company_id_idx
  on public.employee_availability (company_id);

create index if not exists employee_availability_employee_id_idx
  on public.employee_availability (employee_id);

alter table public.employee_availability enable row level security;

create policy "employee_availability_company_select"
  on public.employee_availability
  for select
  to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employee_availability.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "employee_availability_company_insert"
  on public.employee_availability
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employee_availability.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "employee_availability_company_update"
  on public.employee_availability
  for update
  to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employee_availability.company_id
        and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employee_availability.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "employee_availability_company_delete"
  on public.employee_availability
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employee_availability.company_id
        and c.owner_uid = auth.uid()::text
    )
  );
