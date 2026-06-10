-- Run this in Supabase SQL Editor if 20260528180000 failed on owner_uid type change.
-- Safe to re-run: drops policies first, then alters column, then restores FK + policies.

drop policy if exists "companies_owner_select" on public.companies;
drop policy if exists "companies_owner_insert" on public.companies;
drop policy if exists "companies_owner_update" on public.companies;
drop policy if exists "employees_company_select" on public.employees;
drop policy if exists "employees_company_insert" on public.employees;
drop policy if exists "employees_company_update" on public.employees;
drop policy if exists "employee_pins_company_select" on public.employee_pins;
drop policy if exists "employee_pins_company_insert" on public.employee_pins;
drop policy if exists "employee_pins_company_update" on public.employee_pins;
drop policy if exists "kiosk_tablets_company_select" on public.kiosk_tablets;
drop policy if exists "kiosk_tablets_company_insert" on public.kiosk_tablets;
drop policy if exists "kiosk_tablets_company_update" on public.kiosk_tablets;
drop policy if exists "attendance_company_select" on public.attendance;
drop policy if exists "attendance_company_insert" on public.attendance;
drop policy if exists "attendance_company_update" on public.attendance;
drop policy if exists "schedules_company_select" on public.schedules;
drop policy if exists "schedules_company_insert" on public.schedules;
drop policy if exists "schedules_company_update" on public.schedules;

alter table public.companies drop constraint if exists companies_owner_uid_fkey;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'companies'
      and column_name = 'owner_uid'
      and udt_name = 'uuid'
  ) then
    alter table public.companies
      alter column owner_uid type text using owner_uid::text;
  end if;
end $$;

-- No FK to public."user" — auth users live in Turso.

create policy "companies_owner_select"
  on public.companies for select to authenticated
  using (owner_uid = auth.uid()::text);

create policy "companies_owner_insert"
  on public.companies for insert to authenticated
  with check (owner_uid = auth.uid()::text);

create policy "companies_owner_update"
  on public.companies for update to authenticated
  using (owner_uid = auth.uid()::text)
  with check (owner_uid = auth.uid()::text);

create policy "employees_company_select"
  on public.employees for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employees.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "employees_company_insert"
  on public.employees for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employees.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "employees_company_update"
  on public.employees for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employees.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employees.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "employee_pins_company_select"
  on public.employee_pins for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employee_pins.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "employee_pins_company_insert"
  on public.employee_pins for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employee_pins.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "employee_pins_company_update"
  on public.employee_pins for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = employee_pins.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = employee_pins.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "kiosk_tablets_company_select"
  on public.kiosk_tablets for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = kiosk_tablets.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "kiosk_tablets_company_insert"
  on public.kiosk_tablets for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = kiosk_tablets.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "kiosk_tablets_company_update"
  on public.kiosk_tablets for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = kiosk_tablets.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = kiosk_tablets.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "attendance_company_select"
  on public.attendance for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = attendance.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "attendance_company_insert"
  on public.attendance for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = attendance.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "attendance_company_update"
  on public.attendance for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = attendance.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = attendance.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "schedules_company_select"
  on public.schedules for select to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = schedules.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "schedules_company_insert"
  on public.schedules for insert to authenticated
  with check (
    exists (
      select 1 from public.companies c
      where c.id = schedules.company_id and c.owner_uid = auth.uid()::text
    )
  );

create policy "schedules_company_update"
  on public.schedules for update to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = schedules.company_id and c.owner_uid = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from public.companies c
      where c.id = schedules.company_id and c.owner_uid = auth.uid()::text
    )
  );
