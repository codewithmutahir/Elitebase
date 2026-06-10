-- Shift scheduling fields on schedules

alter table public.schedules
  add column if not exists is_open_shift boolean not null default false,
  add column if not exists notes text,
  add column if not exists status text not null default 'draft',
  add column if not exists color text not null default '#2563EB',
  add column if not exists department_id uuid references public.departments(id) on delete set null,
  add column if not exists role_id uuid references public.roles(id) on delete set null;

alter table public.schedules drop constraint if exists schedules_status_check;
alter table public.schedules
  add constraint schedules_status_check check (status in ('draft', 'published'));

create index if not exists schedules_company_shift_date_idx
  on public.schedules (company_id, shift_date);

create policy "schedules_company_delete"
  on public.schedules
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.companies c
      where c.id = schedules.company_id
        and c.owner_uid = auth.uid()::text
    )
  );
