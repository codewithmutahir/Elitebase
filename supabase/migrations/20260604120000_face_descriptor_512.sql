-- InsightFace buffalo_sc: 512-dimensional embeddings (was vector(128) for on-device TFLite)

update public.employees
set face_descriptor = null
where face_descriptor is not null;

alter table public.employees
  alter column face_descriptor type vector(512);

create or replace function public.kiosk_face_similarity(
  p_company_id uuid,
  p_employee_id uuid,
  p_probe vector(512)
)
returns double precision
language sql
stable
as $$
  select 1 - (e.face_descriptor <=> p_probe)
  from public.employees e
  where e.id = p_employee_id
    and e.company_id = p_company_id
    and e.face_descriptor is not null;
$$;
