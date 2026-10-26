-- Empty-foundation rollback ONLY. Never silently deletes customer records.
BEGIN;
DO $$ DECLARE relation text; found boolean; BEGIN
  IF current_database()<>'monetcore_customer_staging' THEN RAISE EXCEPTION 'Wrong database'; END IF;
  FOREACH relation IN ARRAY ARRAY['customer_auth.auth_user','customer_auth.auth_session','customer_auth.auth_account','customer_auth.auth_verification','customer_auth.auth_events','customer_auth.request_limits','customer.organizations','customer.memberships','customer.platform_owners','customer.projects','customer.project_requests','customer.audit_events'] LOOP
    EXECUTE format('SELECT EXISTS(SELECT FROM %s LIMIT 1)',relation) INTO found;
    IF found THEN RAISE EXCEPTION 'Rollback refused: foundation contains records. Restore/reconcile with owner approval.'; END IF;
  END LOOP;
END $$;
DROP TABLE customer.audit_events,customer.project_requests,customer.projects,customer.platform_owners,customer.memberships,customer.organizations;
DROP TABLE customer_auth.auth_events,customer_auth.request_limits,customer_auth.auth_verification,customer_auth.auth_account,customer_auth.auth_session,customer_auth.auth_user;
DROP SCHEMA customer,customer_auth;
-- Roles are retained for explicit operator review; no credential changes.
COMMIT;
