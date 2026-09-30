-- Rollback for 20260930140000_attendance_record_punch.sql
-- WARNING: drops record_punch and new attendance columns (data in those columns is lost).

revoke all on function public.record_punch(
  uuid,
  uuid,
  uuid,
  text,
  text,
  timestamptz,
  double precision,
  text
) from service_role;

drop function if exists public.record_punch(
  uuid,
  uuid,
  uuid,
  text,
  text,
  timestamptz,
  double precision,
  text
);

drop function if exists public.attendance_transition_allowed(text, text);
drop function if exists public.attendance_derive_state(text);

drop index if exists public.attendance_employee_active_latest_idx;
drop index if exists public.attendance_idempotency_unique_idx;

alter table public.attendance
  drop constraint if exists attendance_review_flag_check;

alter table public.attendance
  drop column if exists review_flag,
  drop column if exists voided_by,
  drop column if exists void_reason,
  drop column if exists voided_at,
  drop column if exists client_timestamp,
  drop column if exists idempotency_key;
