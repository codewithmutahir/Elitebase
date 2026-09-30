-- Phase 2: attendance metadata columns, idempotency, void/review flags, atomic record_punch RPC.
-- Run via Supabase CLI / apply-migrations; do not apply manually to prod without review.

alter table public.attendance
  add column if not exists idempotency_key text,
  add column if not exists client_timestamp timestamptz,
  add column if not exists voided_at timestamptz,
  add column if not exists void_reason text,
  add column if not exists voided_by uuid,
  add column if not exists review_flag text;

alter table public.attendance
  drop constraint if exists attendance_review_flag_check;

alter table public.attendance
  add constraint attendance_review_flag_check
  check (review_flag is null or review_flag in ('auto_closed', 'needs_review'));

create unique index if not exists attendance_idempotency_unique_idx
  on public.attendance (company_id, employee_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists attendance_employee_active_latest_idx
  on public.attendance (company_id, employee_id, timestamp desc)
  where voided_at is null;

-- Mirror Web/lib/attendance/attendance-state.ts (Phase 1).
create or replace function public.attendance_derive_state(p_latest_type text)
returns text
language sql
immutable
as $$
  select case
    when p_latest_type is null or p_latest_type = 'clock_out' then 'out'
    when p_latest_type in ('clock_in', 'break_end') then 'in'
    when p_latest_type = 'break_start' then 'on_break'
    else 'out'
  end;
$$;

create or replace function public.attendance_transition_allowed(p_state text, p_action text)
returns boolean
language sql
immutable
as $$
  select case
    when p_state = 'out' and p_action = 'clock_in' then true
    when p_state = 'in' and p_action in ('clock_out', 'break_start') then true
    when p_state = 'on_break' and p_action = 'break_end' then true
    else false
  end;
$$;

create or replace function public.record_punch(
  p_company_id uuid,
  p_employee_id uuid,
  p_tablet_id uuid,
  p_type text,
  p_idempotency_key text,
  p_client_timestamp timestamptz,
  p_face_match_score double precision,
  p_attendance_status text
)
returns table (
  ok boolean,
  error_code text,
  current_state text,
  replayed boolean,
  id uuid,
  employee_id uuid,
  company_id uuid,
  tablet_id uuid,
  type text,
  "timestamp" timestamptz,
  face_match_score double precision,
  attendance_status text,
  idempotency_key text,
  client_timestamp timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_latest_type text;
  v_state text;
  v_row public.attendance%rowtype;
  v_status text;
begin
  if p_type not in ('clock_in', 'clock_out', 'break_start', 'break_end') then
    return query
    select
      false,
      'INVALID_TYPE'::text,
      null::text,
      false,
      null::uuid,
      p_employee_id,
      p_company_id,
      p_tablet_id,
      p_type,
      null::timestamptz,
      null::double precision,
      null::text,
      null::text,
      null::timestamptz;
    return;
  end if;

  v_key := nullif(btrim(p_idempotency_key), '');

  perform pg_advisory_xact_lock(hashtextextended(p_employee_id::text, 0));

  if v_key is not null then
    select a.*
    into v_row
    from public.attendance a
    where a.company_id = p_company_id
      and a.employee_id = p_employee_id
      and a.idempotency_key = v_key
    limit 1;

    if found then
      return query
      select
        true,
        null::text,
        public.attendance_derive_state(v_row.type),
        true,
        v_row.id,
        v_row.employee_id,
        v_row.company_id,
        v_row.tablet_id,
        v_row.type,
        v_row.timestamp,
        v_row.face_match_score,
        v_row.attendance_status,
        v_row.idempotency_key,
        v_row.client_timestamp;
      return;
    end if;
  end if;

  select a.type
  into v_latest_type
  from public.attendance a
  where a.company_id = p_company_id
    and a.employee_id = p_employee_id
    and a.voided_at is null
  order by a.timestamp desc, a.id desc
  limit 1;

  v_state := public.attendance_derive_state(v_latest_type);

  if not public.attendance_transition_allowed(v_state, p_type) then
    return query
    select
      false,
      'INVALID_TRANSITION'::text,
      v_state,
      false,
      null::uuid,
      p_employee_id,
      p_company_id,
      p_tablet_id,
      p_type,
      null::timestamptz,
      null::double precision,
      null::text,
      null::text,
      null::timestamptz;
    return;
  end if;

  v_status := case
    when p_type = 'clock_in' then p_attendance_status
    else null
  end;

  insert into public.attendance (
    company_id,
    employee_id,
    tablet_id,
    type,
    timestamp,
    face_match_score,
    attendance_status,
    idempotency_key,
    client_timestamp
  )
  values (
    p_company_id,
    p_employee_id,
    p_tablet_id,
    p_type,
    now(),
    p_face_match_score,
    v_status,
    v_key,
    p_client_timestamp
  )
  returning * into v_row;

  return query
  select
    true,
    null::text,
    v_state,
    false,
    v_row.id,
    v_row.employee_id,
    v_row.company_id,
    v_row.tablet_id,
    v_row.type,
    v_row.timestamp,
    v_row.face_match_score,
    v_row.attendance_status,
    v_row.idempotency_key,
    v_row.client_timestamp;
end;
$$;

revoke all on function public.record_punch(
  uuid,
  uuid,
  uuid,
  text,
  text,
  timestamptz,
  double precision,
  text
) from public;

grant execute on function public.record_punch(
  uuid,
  uuid,
  uuid,
  text,
  text,
  timestamptz,
  double precision,
  text
) to service_role;
