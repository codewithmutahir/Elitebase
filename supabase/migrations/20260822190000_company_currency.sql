-- Company display currency for wages and payroll formatting.

alter table public.companies
  add column if not exists currency text not null default 'USD';

alter table public.companies
  drop constraint if exists companies_currency_check;

alter table public.companies
  add constraint companies_currency_check
  check (char_length(currency) = 3 and currency = upper(currency));
