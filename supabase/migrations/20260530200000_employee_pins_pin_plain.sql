-- Retrievable kiosk PIN for admin UI; `pin` remains bcrypt hash for kiosk verification.
alter table public.employee_pins
  add column if not exists pin_plain text;
