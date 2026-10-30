-- PROPOSAL ONLY: review and test on isolated PostgreSQL before any application.
-- Requires the existing bookings table and unique_active_booking_slot contract.
-- Preserves existing booking rows and slot index; proposes server-role grants
-- and RLS policies. Apply with an authorized
-- migration owner, not a browser/API key. Production execution is NOT approved.
BEGIN;
CREATE TABLE public.booking_requests (
  idempotency_key UUID PRIMARY KEY,
  request_hash TEXT NOT NULL CHECK (request_hash ~ '^[0-9a-f]{64}$'),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  calendar_state TEXT NOT NULL DEFAULT 'pending' CHECK (calendar_state IN ('pending','started','accepted','uncertain')),
  customer_state TEXT NOT NULL DEFAULT 'pending' CHECK (customer_state IN ('pending','started','accepted','uncertain')),
  admin_state TEXT NOT NULL DEFAULT 'pending' CHECK (admin_state IN ('pending','started','accepted','uncertain')),
  reconciliation_required BOOLEAN NOT NULL DEFAULT false,
  last_error_category TEXT CHECK (last_error_category IN ('calendar','customer','admin','tracking')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_requests FROM PUBLIC;
-- Only pre-existing trusted server roles receive access. No role is created.
DO $permissions$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON public.booking_requests FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON public.booking_requests FROM authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'monetcore_app') THEN
    GRANT USAGE ON SCHEMA public TO monetcore_app;
    GRANT SELECT, INSERT, UPDATE ON public.booking_requests TO monetcore_app;
    GRANT SELECT, INSERT ON public.bookings TO monetcore_app;
    GRANT UPDATE (google_calendar_event_id,google_calendar_event_created_at,confirmation_sent_at,admin_notification_sent_at,updated_at) ON public.bookings TO monetcore_app;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND policyname='booking_server_access') THEN
      CREATE POLICY booking_server_access ON public.bookings TO monetcore_app USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='booking_requests' AND policyname='booking_server_access') THEN
      CREATE POLICY booking_server_access ON public.booking_requests TO monetcore_app USING (true) WITH CHECK (true);
    END IF;
  END IF;
END
$permissions$;
-- A remote Supabase deployment needs an owner-approved least-privilege login
-- role and matching RLS policy/grants for this table AND existing bookings.
-- Do not grant to postgres/service_role or add PUBLIC policies to make tests pass.
-- Versioned, apply ONCE. A rerun refuses the existing table and rolls back;
-- do not replace it or drop existing data to force the migration through.
COMMIT;
