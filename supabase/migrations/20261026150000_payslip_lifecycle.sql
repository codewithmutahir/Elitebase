-- Payslip lifecycle: draft → reviewed → approved → published + snapshot/revisions.

alter table public.payslips
  add column if not exists status text not null default 'published',
  add column if not exists year integer,
  add column if not exists month smallint,
  add column if not exists version integer not null default 1,
  add column if not exists revision_note text,
  add column if not exists supersedes_id uuid references public.payslips(id) on delete set null,
  add column if not exists replaced_by_id uuid references public.payslips(id) on delete set null,
  add column if not exists snapshot jsonb,
  add column if not exists calculated_snapshot jsonb,
  add column if not exists overrides jsonb not null default '{}'::jsonb,
  add column if not exists apply_company_stamp boolean not null default false,
  add column if not exists reviewed_by_uid text,
  add column if not exists reviewed_by_name text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists approved_by_uid text,
  add column if not exists approved_by_name text,
  add column if not exists approved_at timestamptz,
  add column if not exists published_by_uid text,
  add column if not exists lock_version integer not null default 1,
  add column if not exists updated_at timestamptz not null default now();

-- Backfill year/month from period_start for legacy rows.
update public.payslips
set
  year = extract(year from period_start)::integer,
  month = extract(month from period_start)::integer
where year is null or month is null;

alter table public.payslips
  alter column year set not null,
  alter column month set not null;

alter table public.payslips
  drop constraint if exists payslips_status_check;
alter table public.payslips
  add constraint payslips_status_check
  check (status in ('draft', 'reviewed', 'approved', 'published'));

alter table public.payslips
  drop constraint if exists payslips_month_check;
alter table public.payslips
  add constraint payslips_month_check check (month >= 1 and month <= 12);

alter table public.payslips
  drop constraint if exists payslips_year_check;
alter table public.payslips
  add constraint payslips_year_check check (year >= 2000 and year <= 2100);

alter table public.payslips
  drop constraint if exists payslips_version_check;
alter table public.payslips
  add constraint payslips_version_check check (version >= 1);

-- One current payslip per employee/month/year (revisions set replaced_by_id on the old row).
create unique index if not exists payslips_employee_period_active_uidx
  on public.payslips (employee_id, year, month)
  where replaced_by_id is null;

create index if not exists payslips_company_status_idx
  on public.payslips (company_id, status, year desc, month desc);

-- Soften published_at default for new drafts (nullable until publish).
alter table public.payslips
  alter column published_at drop not null;
alter table public.payslips
  alter column published_at drop default;

-- Existing rows stay published with published_at set.
update public.payslips
set status = 'published'
where published_at is not null and status is distinct from 'published';

-- Audit events for payslip + leave balance (lightweight shared table).
create table if not exists public.payroll_audit_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_uid text not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  employee_id uuid references public.employees(id) on delete set null,
  before_json jsonb,
  after_json jsonb,
  created_at timestamptz not null default now(),
  constraint payroll_audit_events_action_len check (char_length(action) <= 80),
  constraint payroll_audit_events_entity_type_len check (char_length(entity_type) <= 40)
);

create index if not exists payroll_audit_events_company_idx
  on public.payroll_audit_events (company_id, created_at desc);

alter table public.payroll_audit_events enable row level security;

create policy "payroll_audit_events_company_select"
  on public.payroll_audit_events for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = payroll_audit_events.company_id
        and c.owner_uid = auth.uid()::text
    )
  );

create policy "payroll_audit_events_company_insert"
  on public.payroll_audit_events for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = payroll_audit_events.company_id
        and c.owner_uid = auth.uid()::text
    )
  );
