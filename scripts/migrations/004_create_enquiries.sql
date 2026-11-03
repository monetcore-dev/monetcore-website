-- CONTACT/QUOTATION ONLY. Apply once as approved DB owner after backup/rehearsal.
-- 003 is reserved for independent booking remediation; it is NOT a dependency.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
DO $$ BEGIN
 IF current_database()<>'monetcore_db' THEN RAISE EXCEPTION 'Wrong database'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='monetcore_enquiries' AND rolcanlogin
  AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolbypassrls AND NOT rolreplication) THEN
  RAISE EXCEPTION 'Create and verify dedicated least-privilege enquiry login first';
 END IF;
 IF EXISTS(SELECT 1 FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='monetcore_enquiries')) THEN
  RAISE EXCEPTION 'Enquiry role must not inherit other roles';
 END IF;
 IF current_user='monetcore_enquiries' THEN RAISE EXCEPTION 'Application must not own schema'; END IF;
END $$;
CREATE SCHEMA monetcore_enquiries;
REVOKE ALL ON SCHEMA monetcore_enquiries FROM PUBLIC;
CREATE TABLE monetcore_enquiries.enquiries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 request_hash text NOT NULL CHECK(request_hash ~ '^[a-f0-9]{64}$'),
 payload jsonb NOT NULL CHECK(jsonb_typeof(payload)='object'),
 notification_state text NOT NULL DEFAULT 'pending' CHECK(notification_state IN ('pending','started','accepted','uncertain','failed')),
 attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 5),
 next_attempt_at timestamptz NOT NULL DEFAULT now(), started_at timestamptz, accepted_at timestamptz,
 last_error_category text CHECK(last_error_category IN ('smtp_accepted','smtp_rejected','smtp_uncertain','smtp_pre_message','interrupted')),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX enquiry_payload_recent ON monetcore_enquiries.enquiries(request_hash,created_at DESC);
CREATE INDEX enquiry_pending ON monetcore_enquiries.enquiries(next_attempt_at,created_at) WHERE notification_state='pending';
CREATE TABLE monetcore_enquiries.request_keys (
 idempotency_key uuid PRIMARY KEY,request_hash text NOT NULL CHECK(request_hash ~ '^[a-f0-9]{64}$'),
 enquiry_id uuid NOT NULL REFERENCES monetcore_enquiries.enquiries(id) ON DELETE CASCADE,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX enquiry_keys_by_enquiry ON monetcore_enquiries.request_keys(enquiry_id);
CREATE TABLE monetcore_enquiries.rate_windows (
 bucket text NOT NULL,window_start timestamptz NOT NULL,expires_at timestamptz NOT NULL,
 count integer NOT NULL CHECK(count>0),PRIMARY KEY(bucket,window_start)
);
CREATE INDEX enquiry_rate_expiry ON monetcore_enquiries.rate_windows(expires_at);
REVOKE ALL ON ALL TABLES IN SCHEMA monetcore_enquiries FROM PUBLIC;
GRANT CONNECT ON DATABASE monetcore_db TO monetcore_enquiries;
GRANT USAGE ON SCHEMA monetcore_enquiries TO monetcore_enquiries;
GRANT SELECT,INSERT,UPDATE ON monetcore_enquiries.enquiries TO monetcore_enquiries;
GRANT SELECT,INSERT ON monetcore_enquiries.request_keys TO monetcore_enquiries;
GRANT SELECT,INSERT,UPDATE,DELETE ON monetcore_enquiries.rate_windows TO monetcore_enquiries;
COMMIT;
