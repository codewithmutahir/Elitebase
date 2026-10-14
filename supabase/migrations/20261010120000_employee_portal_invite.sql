-- Portal invite tracking for future employee web portal.
-- Invite / Resend on the roster updates this timestamp; email delivery comes later.

alter table public.employees
  add column if not exists portal_invited_at timestamptz;

comment on column public.employees.portal_invited_at is
  'When an employer last sent (or stubbed) an employee portal invite. Null means never invited.';
