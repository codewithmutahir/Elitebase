-- Phase 2: flag faces enrolled before buffalo_sc switch for guided re-enrollment.
-- Switch date must stay in sync with Web/lib/kiosk/face-verify-instrumentation.ts
--   BUFFALO_SC_SWITCH_AT = '2026-07-18T00:00:00.000Z'

alter table public.employees
  add column if not exists needs_reenrollment boolean not null default false;

comment on column public.employees.needs_reenrollment is
  'True when face was enrolled under a prior InsightFace model and must be re-scanned at the kiosk.';

-- Only flag employees who still have a descriptor AND enrolled before the switch.
-- Post-switch enrollments are left alone.
update public.employees
set needs_reenrollment = true
where face_descriptor is not null
  and face_registered_at is not null
  and face_registered_at < timestamptz '2026-07-18 00:00:00+00'
  and needs_reenrollment = false;

create index if not exists employees_needs_reenrollment_idx
  on public.employees (company_id)
  where needs_reenrollment = true;
