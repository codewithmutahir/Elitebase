-- Reverse leave balances migration.

drop policy if exists "leave_balance_deductions_company_delete" on public.leave_balance_deductions;
drop policy if exists "leave_balance_deductions_company_insert" on public.leave_balance_deductions;
drop policy if exists "leave_balance_deductions_company_select" on public.leave_balance_deductions;
drop policy if exists "leave_balance_adjustments_company_insert" on public.leave_balance_adjustments;
drop policy if exists "leave_balance_adjustments_company_select" on public.leave_balance_adjustments;
drop policy if exists "leave_balances_company_update" on public.leave_balances;
drop policy if exists "leave_balances_company_insert" on public.leave_balances;
drop policy if exists "leave_balances_company_select" on public.leave_balances;

drop table if exists public.leave_balance_deductions;
drop table if exists public.leave_balance_adjustments;
drop table if exists public.leave_balances;

alter table public.time_off_requests
  drop constraint if exists time_off_requests_balance_days_charged_check;
alter table public.time_off_requests
  drop constraint if exists time_off_requests_lwp_days_check;
alter table public.time_off_requests
  drop column if exists balance_days_charged;
alter table public.time_off_requests
  drop column if exists lwp_days;

alter table public.companies
  drop constraint if exists companies_leave_year_type_check;
alter table public.companies
  drop constraint if exists companies_leave_paid_total_default_check;
alter table public.companies
  drop constraint if exists companies_leave_sick_total_default_check;
alter table public.companies
  drop column if exists leave_prorate_mid_year;
alter table public.companies
  drop column if exists leave_year_type;
alter table public.companies
  drop column if exists leave_paid_total_default;
alter table public.companies
  drop column if exists leave_sick_total_default;
