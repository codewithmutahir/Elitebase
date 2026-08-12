-- Face verify attempt instrumentation (Phase 1). No effect on match behavior.

create table if not exists public.face_verify_attempts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  tablet_id uuid references public.kiosk_tablets(id) on delete set null,
  verified boolean not null default false,
  similarity_score double precision,
  threshold_used double precision,
  failure_reason text
    check (
      failure_reason is null
      or failure_reason in (
        'NO_FACE_DETECTED',
        'LOCAL_LOW_CONFIDENCE',
        'API_NO_MATCH',
        'API_ERROR',
        'TIMEOUT'
      )
    ),
  service_reason text,
  source text not null default 'api'
    check (source in ('api', 'client')),
  created_at timestamptz not null default now()
);

create index if not exists face_verify_attempts_employee_created_idx
  on public.face_verify_attempts (employee_id, created_at desc);

create index if not exists face_verify_attempts_company_created_idx
  on public.face_verify_attempts (company_id, created_at desc);

create index if not exists face_verify_attempts_failure_reason_idx
  on public.face_verify_attempts (failure_reason)
  where failure_reason is not null;

alter table public.face_verify_attempts enable row level security;
