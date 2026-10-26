drop policy if exists "employee_loans_company_delete" on public.employee_loans;
drop policy if exists "employee_loans_company_update" on public.employee_loans;
drop policy if exists "employee_loans_company_insert" on public.employee_loans;
drop policy if exists "employee_loans_company_select" on public.employee_loans;
drop policy if exists "employee_allowances_company_delete" on public.employee_allowances;
drop policy if exists "employee_allowances_company_update" on public.employee_allowances;
drop policy if exists "employee_allowances_company_insert" on public.employee_allowances;
drop policy if exists "employee_allowances_company_select" on public.employee_allowances;

drop table if exists public.employee_loans;
drop table if exists public.employee_allowances;

alter table public.companies
  drop constraint if exists companies_lates_per_day_deduction_check;
alter table public.companies
  drop column if exists phone_secondary;
alter table public.companies
  drop column if exists phone_primary;
alter table public.companies
  drop column if exists address_line2;
alter table public.companies
  drop column if exists address_line1;
alter table public.companies
  drop column if exists late_remainder_carry_month;
alter table public.companies
  drop column if exists lates_per_day_deduction;
