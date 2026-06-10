-- Team / employee profile extensions (Homebase-style roster)

alter table public.employees
  add column if not exists phone text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists emergency_contact_relation text,
  add column if not exists date_of_birth date,
  add column if not exists hourly_rate decimal(10, 2) default 0,
  add column if not exists employment_type text default 'employee',
  add column if not exists status text default 'active',
  add column if not exists terminated_at timestamptz,
  add column if not exists termination_reason text;

alter table public.employees drop constraint if exists employees_employment_type_check;
alter table public.employees
  add constraint employees_employment_type_check
  check (employment_type in ('employee', 'manager', 'contractor'));

alter table public.employees drop constraint if exists employees_status_check;
alter table public.employees
  add constraint employees_status_check
  check (status in ('active', 'terminated'));

update public.employees
set status = case when coalesce(is_active, true) then 'active' else 'terminated' end
where status is null or status = 'active' and is_active = false;

update public.employees
set employment_type = case
  when role = 'manager' then 'manager'
  else coalesce(employment_type, 'employee')
end
where employment_type is null;

create or replace function public.sync_employee_status_flags()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'terminated' then
    new.is_active := false;
    if new.terminated_at is null and (tg_op = 'INSERT' or old.status is distinct from 'terminated') then
      new.terminated_at := now();
    end if;
  elsif new.status = 'active' then
    new.is_active := true;
    new.terminated_at := null;
    new.termination_reason := null;
  end if;

  if new.employment_type in ('employee', 'manager') then
    new.role := new.employment_type;
  elsif new.employment_type = 'contractor' then
    new.role := 'employee';
  end if;

  return new;
end;
$$;

drop trigger if exists employees_sync_status_flags on public.employees;
create trigger employees_sync_status_flags
  before insert or update on public.employees
  for each row
  execute function public.sync_employee_status_flags();

-- employee_documents
create table if not exists public.employee_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  category text not null,
  name text not null,
  file_url text,
  status text not null default 'not_sent',
  versions int not null default 0,
  created_at timestamptz not null default now(),
  constraint employee_documents_category_check
    check (category in ('certificate', 'onboarding', 'other')),
  constraint employee_documents_status_check
    check (status in ('not_sent', 'sent', 'completed'))
);

create index if not exists employee_documents_employee_id_idx
  on public.employee_documents (employee_id);

create index if not exists employee_documents_company_id_idx
  on public.employee_documents (company_id);

-- employee_notes (author_id = Better Auth user id, text)
create table if not exists public.employee_notes (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  author_id text not null,
  author_name text not null default '',
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists employee_notes_employee_id_idx
  on public.employee_notes (employee_id);

-- employee_milestones
create table if not exists public.employee_milestones (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  milestone_date date not null,
  icon text not null default 'trophy',
  created_at timestamptz not null default now()
);

create index if not exists employee_milestones_employee_id_idx
  on public.employee_milestones (employee_id);

create or replace function public.seed_employee_onboarding_documents()
returns trigger
language plpgsql
as $$
begin
  insert into public.employee_documents (employee_id, company_id, category, name, status)
  values
    (new.id, new.company_id, 'onboarding', 'W-4 Form', 'not_sent'),
    (new.id, new.company_id, 'onboarding', 'I-9 Form', 'not_sent'),
    (new.id, new.company_id, 'onboarding', 'State Withholding', 'not_sent'),
    (new.id, new.company_id, 'onboarding', 'W-9 Form', 'not_sent'),
    (new.id, new.company_id, 'onboarding', 'Payment Method Form', 'not_sent');
  return new;
end;
$$;

drop trigger if exists employees_seed_onboarding_docs on public.employees;
create trigger employees_seed_onboarding_docs
  after insert on public.employees
  for each row
  execute function public.seed_employee_onboarding_documents();

create or replace function public.sync_employee_milestones()
returns trigger
language plpgsql
as $$
begin
  if new.hire_date is null then
    return new;
  end if;

  delete from public.employee_milestones
  where employee_id = new.id
    and title like '%anniversary%';

  insert into public.employee_milestones (employee_id, company_id, title, milestone_date, icon)
  values
    (new.id, new.company_id, 'Champion: 1 month anniversary', (new.hire_date + interval '1 month')::date, 'trophy'),
    (new.id, new.company_id, 'Champion: 3 month anniversary', (new.hire_date + interval '3 months')::date, 'trophy'),
    (new.id, new.company_id, 'Champion: 1 year anniversary', (new.hire_date + interval '1 year')::date, 'trophy');

  return new;
end;
$$;

drop trigger if exists employees_sync_milestones on public.employees;
create trigger employees_sync_milestones
  after insert or update of hire_date on public.employees
  for each row
  execute function public.sync_employee_milestones();

-- Backfill milestones for existing employees with hire_date
insert into public.employee_milestones (employee_id, company_id, title, milestone_date, icon)
select e.id, e.company_id, m.title, m.milestone_date, 'trophy'
from public.employees e
cross join lateral (
  values
    ('Champion: 1 month anniversary', (e.hire_date + interval '1 month')::date),
    ('Champion: 3 month anniversary', (e.hire_date + interval '3 months')::date),
    ('Champion: 1 year anniversary', (e.hire_date + interval '1 year')::date)
) as m(title, milestone_date)
where e.hire_date is not null
  and not exists (
    select 1 from public.employee_milestones em
    where em.employee_id = e.id
  );

-- Backfill onboarding docs for employees missing them
insert into public.employee_documents (employee_id, company_id, category, name, status)
select e.id, e.company_id, d.category, d.name, 'not_sent'
from public.employees e
cross join (
  values
    ('onboarding', 'W-4 Form'),
    ('onboarding', 'I-9 Form'),
    ('onboarding', 'State Withholding'),
    ('onboarding', 'W-9 Form'),
    ('onboarding', 'Payment Method Form')
) as d(category, name)
where not exists (
  select 1 from public.employee_documents ed
  where ed.employee_id = e.id and ed.name = d.name and ed.category = 'onboarding'
);

alter table public.employee_documents enable row level security;
alter table public.employee_notes enable row level security;
alter table public.employee_milestones enable row level security;

create policy "employee_documents_company_select"
  on public.employee_documents for select to authenticated
  using (exists (select 1 from public.companies c where c.id = employee_documents.company_id and c.owner_uid = auth.uid()::text));

create policy "employee_documents_company_insert"
  on public.employee_documents for insert to authenticated
  with check (exists (select 1 from public.companies c where c.id = employee_documents.company_id and c.owner_uid = auth.uid()::text));

create policy "employee_documents_company_update"
  on public.employee_documents for update to authenticated
  using (exists (select 1 from public.companies c where c.id = employee_documents.company_id and c.owner_uid = auth.uid()::text))
  with check (exists (select 1 from public.companies c where c.id = employee_documents.company_id and c.owner_uid = auth.uid()::text));

create policy "employee_documents_company_delete"
  on public.employee_documents for delete to authenticated
  using (exists (select 1 from public.companies c where c.id = employee_documents.company_id and c.owner_uid = auth.uid()::text));

create policy "employee_notes_company_select"
  on public.employee_notes for select to authenticated
  using (exists (select 1 from public.companies c where c.id = employee_notes.company_id and c.owner_uid = auth.uid()::text));

create policy "employee_notes_company_insert"
  on public.employee_notes for insert to authenticated
  with check (exists (select 1 from public.companies c where c.id = employee_notes.company_id and c.owner_uid = auth.uid()::text));

create policy "employee_notes_company_delete"
  on public.employee_notes for delete to authenticated
  using (exists (select 1 from public.companies c where c.id = employee_notes.company_id and c.owner_uid = auth.uid()::text));

create policy "employee_milestones_company_select"
  on public.employee_milestones for select to authenticated
  using (exists (select 1 from public.companies c where c.id = employee_milestones.company_id and c.owner_uid = auth.uid()::text));

create policy "employee_milestones_company_insert"
  on public.employee_milestones for insert to authenticated
  with check (exists (select 1 from public.companies c where c.id = employee_milestones.company_id and c.owner_uid = auth.uid()::text));

create policy "employee_milestones_company_update"
  on public.employee_milestones for update to authenticated
  using (exists (select 1 from public.companies c where c.id = employee_milestones.company_id and c.owner_uid = auth.uid()::text))
  with check (exists (select 1 from public.companies c where c.id = employee_milestones.company_id and c.owner_uid = auth.uid()::text));

create policy "employee_milestones_company_delete"
  on public.employee_milestones for delete to authenticated
  using (exists (select 1 from public.companies c where c.id = employee_milestones.company_id and c.owner_uid = auth.uid()::text));

-- Storage bucket for employee documents
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'employee-documents',
  'employee-documents',
  true,
  10485760,
  array['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "employee_documents_public_read" on storage.objects;
create policy "employee_documents_public_read"
  on storage.objects for select to public
  using (bucket_id = 'employee-documents');
