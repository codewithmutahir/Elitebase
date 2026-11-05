-- Reverse of 20261105120000_attendance_lateness_policy.sql

alter table public.employees
  drop constraint if exists employees_late_grace_minutes_check;
alter table public.employees
  drop column if exists late_grace_minutes;

alter table public.companies
  drop constraint if exists companies_late_grace_minutes_check;
alter table public.companies
  drop column if exists late_grace_minutes;
