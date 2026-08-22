-- Distinct attendance months for timesheet export (company timezone).

create or replace function public.get_attendance_months(
  p_company_id uuid,
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
  order by month desc
  limit greatest(p_limit, 1);
$$;

grant execute on function public.get_attendance_months(uuid, text, int) to service_role;
