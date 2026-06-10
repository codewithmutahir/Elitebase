-- pgvector cosine similarity for kiosk face verify (1 - distance = similarity)
create or replace function public.kiosk_face_similarity(
  p_company_id uuid,
  p_employee_id uuid,
  p_probe vector(128)
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
