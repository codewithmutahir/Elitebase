-- Policy-based bonus accrual: quarterly / six_monthly / annual + cycle start month.

alter table public.employees
  add column if not exists bonus_policy text not null default 'six_monthly',
  add column if not exists bonus_cycle_start_month smallint not null default 1;

alter table public.employees
  drop constraint if exists employees_bonus_policy_check;

alter table public.employees
  add constraint employees_bonus_policy_check
  check (bonus_policy in ('quarterly', 'six_monthly', 'annual'));

alter table public.employees
  drop constraint if exists employees_bonus_cycle_start_month_check;

alter table public.employees
  add constraint employees_bonus_cycle_start_month_check
  check (bonus_cycle_start_month >= 1 and bonus_cycle_start_month <= 12);

-- Prefer hire-date month as cycle anchor when known.
update public.employees
set bonus_cycle_start_month = coalesce(extract(month from hire_date)::int, 1)
where hire_date is not null;
