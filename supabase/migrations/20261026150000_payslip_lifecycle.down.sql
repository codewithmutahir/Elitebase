drop policy if exists "payroll_audit_events_company_insert" on public.payroll_audit_events;
drop policy if exists "payroll_audit_events_company_select" on public.payroll_audit_events;
drop table if exists public.payroll_audit_events;

drop index if exists public.payslips_company_status_idx;
drop index if exists public.payslips_employee_period_active_uidx;

alter table public.payslips drop constraint if exists payslips_version_check;
alter table public.payslips drop constraint if exists payslips_year_check;
alter table public.payslips drop constraint if exists payslips_month_check;
alter table public.payslips drop constraint if exists payslips_status_check;

-- Restore published_at not-null default for legacy shape (best-effort).
update public.payslips set published_at = coalesce(published_at, created_at, now()) where published_at is null;
alter table public.payslips alter column published_at set default now();
alter table public.payslips alter column published_at set not null;

alter table public.payslips drop column if exists updated_at;
alter table public.payslips drop column if exists lock_version;
alter table public.payslips drop column if exists published_by_uid;
alter table public.payslips drop column if exists approved_at;
alter table public.payslips drop column if exists approved_by_name;
alter table public.payslips drop column if exists approved_by_uid;
alter table public.payslips drop column if exists reviewed_at;
alter table public.payslips drop column if exists reviewed_by_name;
alter table public.payslips drop column if exists reviewed_by_uid;
alter table public.payslips drop column if exists apply_company_stamp;
alter table public.payslips drop column if exists overrides;
alter table public.payslips drop column if exists calculated_snapshot;
alter table public.payslips drop column if exists snapshot;
alter table public.payslips drop column if exists replaced_by_id;
alter table public.payslips drop column if exists supersedes_id;
alter table public.payslips drop column if exists revision_note;
alter table public.payslips drop column if exists version;
alter table public.payslips drop column if exists month;
alter table public.payslips drop column if exists year;
alter table public.payslips drop column if exists status;
