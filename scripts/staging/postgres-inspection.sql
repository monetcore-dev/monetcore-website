-- READ ONLY; metadata only, no booking rows or password hashes.
BEGIN TRANSACTION READ ONLY;
SELECT current_database(), current_user, current_setting('server_version') AS version,
 current_setting('listen_addresses') AS listen_addresses, current_setting('TimeZone') AS timezone;
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole, rolbypassrls
 FROM pg_roles WHERE rolname IN ('monetcore_app',current_user);
SELECT n.nspname,c.relname,pg_get_userbyid(c.relowner) AS owner,c.relrowsecurity,c.relforcerowsecurity
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE c.oid=to_regclass('public.bookings');
SELECT column_name,data_type,is_nullable,column_default,character_maximum_length
 FROM information_schema.columns WHERE table_schema='public' AND table_name='bookings' ORDER BY ordinal_position;
SELECT conname,contype,pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid=to_regclass('public.bookings');
SELECT c.relname,i.indisunique,i.indisvalid,i.indisready,pg_get_indexdef(i.indexrelid),pg_get_expr(i.indpred,i.indrelid)
 FROM pg_index i JOIN pg_class c ON c.oid=i.indexrelid WHERE i.indrelid=to_regclass('public.bookings');
SELECT grantee,privilege_type FROM information_schema.table_privileges WHERE table_schema='public' AND table_name='bookings';
SELECT grantee,column_name,privilege_type FROM information_schema.column_privileges WHERE table_schema='public' AND table_name='bookings';
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check FROM pg_policies WHERE schemaname='public' AND tablename='bookings';
SELECT pg_get_userbyid(roleid) AS inherited_role FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='monetcore_app');
SELECT has_database_privilege('monetcore_app',current_database(),'CONNECT') AS can_connect,
 has_schema_privilege('monetcore_app','public','CREATE') AS can_create,
 has_table_privilege('monetcore_app','public.bookings','DELETE') AS can_delete,
 has_table_privilege('monetcore_app','public.bookings','TRUNCATE') AS can_truncate;
COMMIT;
