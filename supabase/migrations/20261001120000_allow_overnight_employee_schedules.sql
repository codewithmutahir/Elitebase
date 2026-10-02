-- Allow overnight employee default schedules (end time before start = next calendar day).
-- Timesheet backfill already treats endHm <= startHm as overnight.

alter table public.employees
  drop constraint if exists employees_schedule_time_check;

alter table public.employees
  add constraint employees_schedule_time_check
  check (schedule_start_time <> schedule_end_time);
