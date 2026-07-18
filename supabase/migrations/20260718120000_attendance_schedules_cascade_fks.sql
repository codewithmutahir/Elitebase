-- attendance + schedules were created without ON DELETE behavior; block company/employee deletes.

alter table public.attendance
  drop constraint if exists attendance_company_id_fkey;
alter table public.attendance
  add constraint attendance_company_id_fkey
  foreign key (company_id) references public.companies(id) on delete cascade;

alter table public.attendance
  drop constraint if exists attendance_employee_id_fkey;
alter table public.attendance
  add constraint attendance_employee_id_fkey
  foreign key (employee_id) references public.employees(id) on delete cascade;

alter table public.attendance
  drop constraint if exists attendance_tablet_id_fkey;
alter table public.attendance
  add constraint attendance_tablet_id_fkey
  foreign key (tablet_id) references public.kiosk_tablets(id) on delete set null;

alter table public.schedules
  drop constraint if exists schedules_company_id_fkey;
alter table public.schedules
  add constraint schedules_company_id_fkey
  foreign key (company_id) references public.companies(id) on delete cascade;

alter table public.schedules
  drop constraint if exists schedules_employee_id_fkey;
alter table public.schedules
  add constraint schedules_employee_id_fkey
  foreign key (employee_id) references public.employees(id) on delete cascade;
