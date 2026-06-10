-- Better Auth runs on Turso; companies.owner_uid is an opaque text id (not Supabase auth.users).
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_owner_uid_fkey;
