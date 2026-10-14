-- Employee portal auth: link Better Auth users + invite tokens.

alter table public.employees
  add column if not exists user_id text;

comment on column public.employees.user_id is
  'Better Auth user.id once the employee accepts a portal invite. Null until activated.';

create unique index if not exists employees_user_id_uidx
  on public.employees (user_id)
  where user_id is not null;

create table if not exists public.employee_portal_invites (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint employee_portal_invites_token_hash_key unique (token_hash)
);

create index if not exists employee_portal_invites_employee_id_idx
  on public.employee_portal_invites (employee_id);

create index if not exists employee_portal_invites_company_id_idx
  on public.employee_portal_invites (company_id);

comment on table public.employee_portal_invites is
  'One-time portal invite tokens (hashed). Resend invalidates prior unused invites.';

alter table public.employee_portal_invites enable row level security;
