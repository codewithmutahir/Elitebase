-- Security hardening: private employee docs, clear pin_plain, leave-request support notes.
-- Apply after prior portal/benefits migrations.

-- 1) Stop persisting cleartext kiosk PINs (hashes remain in pin).
update public.employee_pins set pin_plain = null where pin_plain is not null;

-- 2) employee-documents: private bucket + drop world-readable SELECT.
update storage.buckets
set public = false
where id = 'employee-documents';

drop policy if exists "employee_documents_public_read" on storage.objects;

-- Authenticated reads still go through service role / signed URLs from the app.
-- Keep insert/update/delete restricted to service role (no public write policies).

-- 3) Store object path for signed URL generation (payslips already have file_path).
alter table public.employee_documents
  add column if not exists file_path text;
