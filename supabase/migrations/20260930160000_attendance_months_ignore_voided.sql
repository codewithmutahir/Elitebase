-- Timesheet month list ignores voided punches.
-- Requires `attendance.voided_at` (added in 20260930140000_attendance_record_punch.sql).
-- Idempotent if that migration was skipped or not yet recorded:

alter table public.attendance
  add column if not exists voided_at timestamptz;

create or replace function public.get_attendance_months(  p_company_id uuid,
  p_timezone text,
  p_limit int default 24
)
returns table (month text)
language sql
stable
as $$
  select distinct to_char(a.timestamp at time zone p_timezone, 'YYYY-MM') as month
  from public.attendance a
  where a.company_id = p_company_id
    and a.voided_at is null
  order by month desc
  limit greatest(p_limit, 1);
$$;

grant execute on function public.get_attendance_months(uuid, text, int) to service_role;
