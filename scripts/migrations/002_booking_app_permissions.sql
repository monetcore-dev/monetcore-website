-- REVIEW ONLY: apply manually as a database owner after metadata inspection.
-- No rows, indexes, table definitions or role passwords are changed.
BEGIN;
DO $$
BEGIN
  IF current_database() <> 'monetcore_db' THEN RAISE EXCEPTION 'Wrong database'; END IF;
  IF to_regclass('public.bookings') IS NULL THEN RAISE EXCEPTION 'Missing bookings table'; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='monetcore_app' AND NOT rolsuper
    AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolbypassrls) THEN
    RAISE EXCEPTION 'Application role missing or privileged';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_class WHERE oid='public.bookings'::regclass
    AND relowner=(SELECT oid FROM pg_roles WHERE rolname='monetcore_app')) THEN
    RAISE EXCEPTION 'Application must not own the bookings table';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_auth_members WHERE member=(SELECT oid FROM pg_roles WHERE rolname='monetcore_app')) THEN
    RAISE EXCEPTION 'Review inherited application-role memberships first';
  END IF;
END $$;
REVOKE ALL ON public.bookings FROM PUBLIC, monetcore_app;
REVOKE ALL (id, consultation_type, booking_date, booking_time, timezone, name, email,
 phone, company, service, message, status, google_calendar_event_id,
 google_calendar_event_created_at, confirmation_sent_at, admin_notification_sent_at,
 created_at, updated_at) ON public.bookings FROM monetcore_app;
GRANT CONNECT ON DATABASE monetcore_db TO monetcore_app;
GRANT USAGE ON SCHEMA public TO monetcore_app;
REVOKE CREATE ON SCHEMA public FROM PUBLIC, monetcore_app;
GRANT SELECT (id, consultation_type, booking_date, booking_time, status)
 ON public.bookings TO monetcore_app;
GRANT INSERT (consultation_type, booking_date, booking_time, timezone, name, email,
 phone, company, service, message, status) ON public.bookings TO monetcore_app;
GRANT UPDATE (google_calendar_event_id, google_calendar_event_created_at,
 confirmation_sent_at, admin_notification_sent_at, updated_at)
 ON public.bookings TO monetcore_app;
COMMIT;
