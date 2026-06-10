-- Departments & job roles (scheduling); employees.department -> department_id

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  color text not null default '#2563EB',
  created_at timestamptz not null default now(),
  unique (company_id, name)
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (company_id, department_id, name)
);

create index if not exists departments_company_id_idx on public.departments (company_id);
create index if not exists roles_company_id_idx on public.roles (company_id);
create index if not exists roles_department_id_idx on public.roles (department_id);

alter table public.employees
  add column if not exists department_id uuid references public.departments(id) on delete set null;

-- Migrate legacy text department values into departments rows
insert into public.departments (company_id, name, color)
select distinct
  e.company_id,
  trim(e.department) as name,
  '#2563EB' as color
from public.employees e
where e.department is not null
  and trim(e.department) <> ''
  and not exists (
    select 1
    from public.departments d
    where d.company_id = e.company_id
      and lower(trim(d.name)) = lower(trim(e.department))
  );

update public.employees e
set department_id = d.id
from public.departments d
where e.department_id is null
  and e.department is not null
  and trim(e.department) <> ''
  and d.company_id = e.company_id
  and lower(trim(d.name)) = lower(trim(e.department));

alter table public.employees drop column if exists department;

alter table public.departments enable row level security;
alter table public.roles enable row level security;

create policy "departments_company_select"
  on public.departments
  for select
  to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = departments.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "departments_company_insert"
  on public.departments
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = departments.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "departments_company_update"
  on public.departments
  for update
  to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = departments.company_id
        and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = departments.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "departments_company_delete"
  on public.departments
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = departments.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "roles_company_select"
  on public.roles
  for select
  to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = roles.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "roles_company_insert"
  on public.roles
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = roles.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "roles_company_update"
  on public.roles
  for update
  to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = roles.company_id
        and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = roles.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "roles_company_delete"
  on public.roles
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = roles.company_id
        and c.owner_uid = auth.uid()::text
    )
  );
