-- Employee working days and compensation fields.

alter table public.employees
  add column if not exists working_days smallint[] not null default '{1,2,3,4,5}',
  add column if not exists pay_type text not null default 'hourly',
  add column if not exists salary_amount decimal(10,2),
  add column if not exists salary_period text not null default 'monthly';

alter table public.employees
  drop constraint if exists employees_working_days_check;

alter table public.employees
  add constraint employees_working_days_check
  check (
    cardinality(working_days) >= 1
    and working_days <@ array[1,2,3,4,5,6,7]::smallint[]
  );

alter table public.employees
  drop constraint if exists employees_pay_type_check;

alter table public.employees
  add constraint employees_pay_type_check
  check (pay_type in ('hourly', 'salary'));

alter table public.employees
  drop constraint if exists employees_salary_period_check;

alter table public.employees
  add constraint employees_salary_period_check
  check (salary_period in ('monthly'));

alter table public.employees
  drop constraint if exists employees_salary_amount_check;

alter table public.employees
  add constraint employees_salary_amount_check
  check (
    (pay_type = 'hourly')
    or (pay_type = 'salary' and salary_amount is not null and salary_amount > 0)
  );
