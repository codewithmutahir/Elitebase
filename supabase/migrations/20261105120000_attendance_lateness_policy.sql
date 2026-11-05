-- Attendance & punctuality policy
--
-- Adds company-wide and per-employee late grace (clock-in margin), so the
-- 15-minute threshold hardcoded in Web/lib/attendance/status.ts can become a
-- configurable value. See AGENTS.md → "Attendance & punctuality policy".
--
-- Resolution order at every call site:
--   employees.late_grace_minutes  (override, nullable)
--   ?? companies.late_grace_minutes
--   ?? 15
--
-- The "3 lates = 1 off" conversion is unchanged — it already uses
-- companies.lates_per_day_deduction (migration 20261026140000).

-- ---------------------------------------------------------------------------
-- Company-wide default
-- ---------------------------------------------------------------------------
alter table public.companies
  add column if not exists late_grace_minutes smallint not null default 15;

alter table public.companies
  drop constraint if exists companies_late_grace_minutes_check;
alter table public.companies
  add constraint companies_late_grace_minutes_check
  check (late_grace_minutes >= 0 and late_grace_minutes <= 120);

comment on column public.companies.late_grace_minutes is
  'Minutes after scheduled start that a clock-in still counts as on_time. 0-120. Default 15.';

-- ---------------------------------------------------------------------------
-- Per-employee override (null = use company default)
-- ---------------------------------------------------------------------------
alter table public.employees
  add column if not exists late_grace_minutes smallint null;

alter table public.employees
  drop constraint if exists employees_late_grace_minutes_check;
alter table public.employees
  add constraint employees_late_grace_minutes_check
  check (
    late_grace_minutes is null
    or (late_grace_minutes >= 0 and late_grace_minutes <= 120)
  );

comment on column public.employees.late_grace_minutes is
  'Per-employee override of companies.late_grace_minutes. NULL = inherit company default.';
