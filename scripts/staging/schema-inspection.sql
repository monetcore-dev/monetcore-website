-- PREPARED ONLY. Do not execute until the operator and staging target are approved.
-- Metadata only: no bookings/customer rows, DDL, DML or credential values are read.
-- The same database name may exist in production: verify project identity outside SQL.
BEGIN TRANSACTION READ ONLY;
SET LOCAL statement_timeout = '5s';
SET LOCAL lock_timeout = '1s';

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bookings'
ORDER BY ordinal_position;

SELECT c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced,
       r.rolname AS table_owner, r.rolbypassrls AS owner_bypasses_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_roles r ON r.oid = c.relowner
WHERE n.nspname = 'public' AND c.relname = 'bookings';

SELECT conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = to_regclass('public.bookings');

SELECT i.indisunique, i.indisvalid, pg_get_indexdef(i.indexrelid) AS definition,
       pg_get_expr(i.indpred, i.indrelid) AS predicate
FROM pg_index i
WHERE i.indrelid = to_regclass('public.bookings');

SELECT policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'bookings';

SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'bookings';

-- Catalog visibility depends on the inspecting role. No returned rows is not proof
-- that no policy/grant exists. Owner review and separate staged role probes follow.
SELECT rolname, rolbypassrls
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated', 'service_role');

ROLLBACK;
