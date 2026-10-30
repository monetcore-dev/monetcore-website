-- Read-only operator inspection. Run only on an approved database with an
-- authorized administrator. No credentials, customer names or messages selected.
BEGIN READ ONLY;
SELECT current_user, rolsuper, rolbypassrls
FROM pg_roles WHERE rolname=current_user;
SELECT r.idempotency_key, r.booking_id, b.booking_date, b.booking_time,
       b.status AS reservation_status, r.calendar_state, r.customer_state,
       r.admin_state, r.reconciliation_required, r.last_error_category,
       r.created_at, r.updated_at
FROM public.booking_requests r
JOIN public.bookings b ON b.id=r.booking_id
WHERE r.reconciliation_required
   OR r.calendar_state <> 'accepted'
   OR r.customer_state <> 'accepted'
   OR r.admin_state <> 'accepted'
ORDER BY r.created_at
LIMIT 100;
SELECT indexdef FROM pg_indexes
WHERE schemaname='public' AND indexname='unique_active_booking_slot';
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname='public' AND tablename IN ('bookings','booking_requests');
SELECT tablename, policyname, roles, cmd, qual, with_check FROM pg_policies
WHERE schemaname='public' AND tablename IN ('bookings','booking_requests');
COMMIT;
