-- Production performance indexes (Phase 1.3 / 2.2)

create index if not exists employee_pins_pin_company_id_idx
  on public.employee_pins (pin, company_id);

create index if not exists kiosk_tablets_tablet_token_idx
  on public.kiosk_tablets (tablet_token);

create index if not exists attendance_employee_timestamp_idx
  on public.attendance (employee_id, timestamp desc);

create index if not exists attendance_company_timestamp_idx
  on public.attendance (company_id, timestamp desc);

-- pgvector cosine similarity for kiosk face matching
create index if not exists employees_face_descriptor_ivfflat_idx
  on public.employees
  using ivfflat (face_descriptor vector_cosine_ops)
  with (lists = 100);
