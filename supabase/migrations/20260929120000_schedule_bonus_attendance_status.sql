-- Employee schedule times (shift start/end) and bonus fields.

alter table public.employees
  add column if not exists schedule_start_time time not null default '09:00',
  add column if not exists schedule_end_time time not null default '17:00',
  add column if not exists bonus_amount decimal(10,2) not null default 0,
  add column if not exists bonus_note text;

alter table public.employees
  drop constraint if exists employees_schedule_time_check;

alter table public.employees
  add constraint employees_schedule_time_check
  check (schedule_end_time > schedule_start_time);

alter table public.employees
  drop constraint if exists employees_bonus_amount_check;

alter table public.employees
  add constraint employees_bonus_amount_check
  check (bonus_amount >= 0);

-- Attendance status: on_time / late / (null for legacy rows).
alter table public.attendance
  add column if not exists attendance_status text;

alter table public.attendance
  drop constraint if exists attendance_status_check;

alter table public.attendance
  add constraint attendance_status_check
  check (attendance_status is null or attendance_status in ('on_time', 'late'));

-- Add paid_leave to time_off_requests type check (keep existing types).
alter table public.time_off_requests
  drop constraint if exists time_off_requests_type_check;

alter table public.time_off_requests
  add constraint time_off_requests_type_check
  check (request_type in ('vacation', 'sick', 'personal', 'unpaid', 'paid_leave', 'unpaid_leave'));

-- Track who created: employer vs employee (kiosk).
alter table public.time_off_requests
  add column if not exists requested_by text not null default 'employer';

alter table public.time_off_requests
  drop constraint if exists time_off_requests_requested_by_check;

alter table public.time_off_requests
  add constraint time_off_requests_requested_by_check
  check (requested_by in ('employer', 'employee'));

-- Index for attendance status queries.
create index if not exists attendance_employee_status_idx
  on public.attendance (employee_id, timestamp desc)
  where type = 'clock_in';
