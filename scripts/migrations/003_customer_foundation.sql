-- Review-only proposal. Apply manually ONLY to a new isolated staging database.
-- Never run against monetcore_db. Does not reference or modify bookings.
BEGIN;
DO $$ BEGIN
  IF current_database() <> 'monetcore_customer_staging' THEN RAISE EXCEPTION 'Wrong database'; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='monetcore_customer_auth') THEN CREATE ROLE monetcore_customer_auth NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='monetcore_customer_runtime') THEN CREATE ROLE monetcore_customer_runtime NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS; END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname IN ('monetcore_customer_auth','monetcore_customer_runtime') AND (rolsuper OR rolcreatedb OR rolcreaterole OR rolbypassrls)) OR
    EXISTS (SELECT FROM pg_auth_members WHERE member IN (SELECT oid FROM pg_roles WHERE rolname IN ('monetcore_customer_auth','monetcore_customer_runtime'))) THEN RAISE EXCEPTION 'Unsafe runtime roles'; END IF;
END $$;
CREATE SCHEMA customer_auth;
CREATE SCHEMA customer;
REVOKE ALL ON SCHEMA customer_auth,customer FROM PUBLIC;
-- Better Auth 1.7.13 core models. Camel-case column names match the library adapter.
CREATE TABLE customer_auth.auth_user (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text, name text NOT NULL CHECK(length(name) BETWEEN 1 AND 160),
  email text NOT NULL UNIQUE, "emailVerified" boolean NOT NULL DEFAULT false,
  image text, active boolean NOT NULL DEFAULT true,
  "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX customer_email_case_unique ON customer_auth.auth_user(lower(email));
CREATE TABLE customer_auth.auth_session (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text, "expiresAt" timestamptz NOT NULL,
  token text NOT NULL UNIQUE, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  "ipAddress" text, "userAgent" text,
  "userId" text NOT NULL REFERENCES customer_auth.auth_user(id) ON DELETE CASCADE
);
CREATE INDEX customer_session_user_idx ON customer_auth.auth_session("userId");
CREATE INDEX customer_session_expiry_idx ON customer_auth.auth_session("expiresAt");
CREATE TABLE customer_auth.auth_account (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text, "accountId" text NOT NULL, "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES customer_auth.auth_user(id) ON DELETE CASCADE,
  "accessToken" text, "refreshToken" text, "idToken" text,
  "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz,
  scope text, password text, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now(),
  UNIQUE("providerId","accountId")
);
CREATE INDEX customer_account_user_idx ON customer_auth.auth_account("userId");
CREATE TABLE customer_auth.auth_verification (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text, identifier text NOT NULL, value text NOT NULL,
  "expiresAt" timestamptz NOT NULL, "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_verification_identifier_idx ON customer_auth.auth_verification(identifier);
CREATE INDEX customer_verification_expiry_idx ON customer_auth.auth_verification("expiresAt");
CREATE TABLE customer_auth.request_limits (key text PRIMARY KEY, count integer NOT NULL CHECK(count>0), expires_at timestamptz NOT NULL);
CREATE INDEX customer_request_limits_expiry_idx ON customer_auth.request_limits(expires_at);
CREATE TABLE customer_auth.auth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id text,
  event text NOT NULL CHECK(event IN ('account_registered','email_verified','session_created','session_revoked','account_deactivated','auth_attempt','auth_rejected','auth_accepted')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX customer_auth_events_time_idx ON customer_auth.auth_events(created_at);

CREATE TABLE customer.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(name) BETWEEN 1 AND 160),
  active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE customer.memberships (
  organization_id uuid NOT NULL REFERENCES customer.organizations(id) ON DELETE RESTRICT,
  user_id text NOT NULL REFERENCES customer_auth.auth_user(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK(role IN ('organization_admin','organization_member')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(organization_id,user_id)
);
CREATE INDEX customer_membership_user_idx ON customer.memberships(user_id) WHERE active;
-- No runtime grants: internal ownership is separate from customer memberships.
CREATE TABLE customer.platform_owners (
  user_id text PRIMARY KEY REFERENCES customer_auth.auth_user(id) ON DELETE RESTRICT,
  authorized_at timestamptz NOT NULL DEFAULT now(), authorized_by text NOT NULL
);
CREATE TABLE customer.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES customer.organizations(id) ON DELETE RESTRICT,
  title text NOT NULL CHECK(length(title) BETWEEN 3 AND 160),
  status text NOT NULL DEFAULT 'discovery' CHECK(status IN ('discovery','scoping','in_progress','review','completed','on_hold')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(organization_id,id)
);
CREATE INDEX customer_projects_org_idx ON customer.projects(organization_id,updated_at DESC);
CREATE TABLE customer.project_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES customer.organizations(id) ON DELETE RESTRICT,
  submitted_by text NOT NULL, idempotency_key uuid NOT NULL, payload_hash text NOT NULL CHECK(payload_hash ~ '^[0-9a-f]{64}$'),
  title text NOT NULL CHECK(length(title) BETWEEN 3 AND 160),
  category text NOT NULL CHECK(category IN ('Custom software','Web application / SaaS','Mobile application','AI automation','Business integration','Website / e-commerce','Other')),
  objectives text NOT NULL CHECK(length(objectives) BETWEEN 20 AND 2000), requirements text NOT NULL CHECK(length(requirements) BETWEEN 20 AND 5000),
  budget text NOT NULL CHECK(budget IN ('Not yet decided','Below ₦500,000','₦500,000–₦1,000,000','₦1,000,000–₦5,000,000','Above ₦5,000,000')),
  timeline text NOT NULL CHECK(timeline IN ('To be discussed','Within 1 month','1–3 months','3–6 months','More than 6 months')),
  notes text NOT NULL DEFAULT '' CHECK(length(notes)<=2000),
  status text NOT NULL DEFAULT 'submitted' CHECK(status IN ('submitted','under_review','clarification_requested','quoted','closed')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(organization_id,submitted_by) REFERENCES customer.memberships(organization_id,user_id) ON DELETE RESTRICT,
  UNIQUE(organization_id,submitted_by,idempotency_key), UNIQUE(organization_id,id)
);
CREATE INDEX customer_requests_org_idx ON customer.project_requests(organization_id,created_at DESC);
CREATE TABLE customer.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL REFERENCES customer.organizations(id) ON DELETE RESTRICT,
  actor_id text NOT NULL, event text NOT NULL CHECK(event='project_request_submitted'), resource_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(organization_id,actor_id) REFERENCES customer.memberships(organization_id,user_id) ON DELETE RESTRICT,
  FOREIGN KEY(organization_id,resource_id) REFERENCES customer.project_requests(organization_id,id) ON DELETE RESTRICT
);
CREATE INDEX customer_audit_org_idx ON customer.audit_events(organization_id,created_at DESC);

ALTER TABLE customer.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer.organizations FORCE ROW LEVEL SECURITY;
ALTER TABLE customer.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer.memberships FORCE ROW LEVEL SECURITY;
ALTER TABLE customer.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer.projects FORCE ROW LEVEL SECURITY;
ALTER TABLE customer.project_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer.project_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE customer.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer.audit_events FORCE ROW LEVEL SECURITY;
ALTER TABLE customer.platform_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer.platform_owners FORCE ROW LEVEL SECURITY;
CREATE POLICY membership_self ON customer.memberships FOR SELECT TO monetcore_customer_runtime
  USING(active AND user_id=current_setting('app.customer_user_id',true));
CREATE POLICY organization_member ON customer.organizations FOR SELECT TO monetcore_customer_runtime
  USING(active AND EXISTS(SELECT FROM customer.memberships m WHERE m.organization_id=id AND m.user_id=current_setting('app.customer_user_id',true)));
CREATE POLICY project_member ON customer.projects FOR SELECT TO monetcore_customer_runtime
  USING(EXISTS(SELECT FROM customer.memberships m WHERE m.organization_id=projects.organization_id AND m.user_id=current_setting('app.customer_user_id',true)));
CREATE POLICY request_member_read ON customer.project_requests FOR SELECT TO monetcore_customer_runtime
  USING(EXISTS(SELECT FROM customer.memberships m WHERE m.organization_id=project_requests.organization_id AND m.user_id=current_setting('app.customer_user_id',true)));
CREATE POLICY request_member_insert ON customer.project_requests FOR INSERT TO monetcore_customer_runtime
  WITH CHECK(submitted_by=current_setting('app.customer_user_id',true) AND EXISTS(SELECT FROM customer.memberships m WHERE m.organization_id=project_requests.organization_id AND m.user_id=current_setting('app.customer_user_id',true)));
CREATE POLICY audit_member_read ON customer.audit_events FOR SELECT TO monetcore_customer_runtime
  USING(EXISTS(SELECT FROM customer.memberships m WHERE m.organization_id=audit_events.organization_id AND m.user_id=current_setting('app.customer_user_id',true)));
CREATE POLICY audit_member_insert ON customer.audit_events FOR INSERT TO monetcore_customer_runtime
  WITH CHECK(actor_id=current_setting('app.customer_user_id',true) AND EXISTS(SELECT FROM customer.memberships m WHERE m.organization_id=audit_events.organization_id AND m.user_id=current_setting('app.customer_user_id',true)));

REVOKE ALL ON ALL TABLES IN SCHEMA customer,customer_auth FROM PUBLIC;
GRANT CONNECT ON DATABASE monetcore_customer_staging TO monetcore_customer_auth,monetcore_customer_runtime;
GRANT USAGE ON SCHEMA customer_auth TO monetcore_customer_auth;
GRANT SELECT,INSERT,UPDATE,DELETE ON customer_auth.auth_user,customer_auth.auth_session,customer_auth.auth_account,customer_auth.auth_verification TO monetcore_customer_auth;
GRANT SELECT,INSERT,UPDATE ON customer_auth.request_limits TO monetcore_customer_auth;
GRANT INSERT(event,actor_id) ON customer_auth.auth_events TO monetcore_customer_auth;
GRANT USAGE ON SCHEMA customer TO monetcore_customer_runtime;
GRANT SELECT ON customer.organizations,customer.memberships,customer.projects,customer.project_requests,customer.audit_events TO monetcore_customer_runtime;
GRANT INSERT(organization_id,submitted_by,idempotency_key,payload_hash,title,category,objectives,requirements,budget,timeline,notes) ON customer.project_requests TO monetcore_customer_runtime;
GRANT INSERT(organization_id,actor_id,event,resource_id) ON customer.audit_events TO monetcore_customer_runtime;
-- No CREATE, DELETE, UPDATE or platform_owners privileges for customer runtime.
-- No customer schema grants for monetcore_app or the authentication runtime.
COMMIT;
