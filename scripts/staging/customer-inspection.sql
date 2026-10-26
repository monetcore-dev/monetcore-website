-- Metadata only: no account, session, project, token, password or customer rows.
BEGIN READ ONLY;
SELECT current_database(), current_user, current_setting('server_version');
SELECT rolname,rolsuper,rolcreatedb,rolcreaterole,rolbypassrls,rolcanlogin
FROM pg_roles WHERE rolname IN ('monetcore_customer_auth','monetcore_customer_runtime');
SELECT n.nspname,c.relname,pg_get_userbyid(c.relowner) AS owner,c.relrowsecurity,c.relforcerowsecurity
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname IN ('customer','customer_auth') AND c.relkind='r' ORDER BY 1,2;
SELECT schemaname,tablename,policyname,roles,cmd,qual,with_check
FROM pg_policies WHERE schemaname IN ('customer','customer_auth') ORDER BY 1,2,3;
SELECT table_schema,table_name,grantee,privilege_type FROM information_schema.table_privileges
WHERE table_schema IN ('customer','customer_auth') ORDER BY 1,2,3,4;
SELECT table_schema,table_name,column_name,grantee,privilege_type FROM information_schema.column_privileges
WHERE table_schema IN ('customer','customer_auth') ORDER BY 1,2,3,4,5;
SELECT schemaname,tablename,indexname,indexdef FROM pg_indexes WHERE schemaname IN ('customer','customer_auth') ORDER BY 1,2,3;
SELECT conrelid::regclass AS relation,conname,pg_get_constraintdef(oid) FROM pg_constraint
WHERE connamespace IN (SELECT oid FROM pg_namespace WHERE nspname IN ('customer','customer_auth')) ORDER BY 1,2;
SELECT pg_get_userbyid(member) AS member,pg_get_userbyid(roleid) AS inherited_role FROM pg_auth_members
WHERE member IN (SELECT oid FROM pg_roles WHERE rolname IN ('monetcore_customer_auth','monetcore_customer_runtime'));
COMMIT;
