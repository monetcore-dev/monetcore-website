
-- Monetcore System Solutions
-- Migration 001: VPS booking database
-- Target: monetcore_db (VPS only)

BEGIN;

CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    consultation_type VARCHAR(150) NOT NULL,
    booking_date DATE NOT NULL,
    booking_time TIME WITHOUT TIME ZONE NOT NULL,
    timezone VARCHAR(50) NOT NULL DEFAULT 'Africa/Lagos',

    name VARCHAR(100) NOT NULL,
    email VARCHAR(254) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(150),
    service VARCHAR(150),
    message VARCHAR(3000),

    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',

    google_calendar_event_id TEXT,
    google_calendar_event_created_at TIMESTAMPTZ,
    confirmation_sent_at TIMESTAMPTZ,
    admin_notification_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT bookings_status_check
        CHECK (status IN ('confirmed', 'cancelled')),

    CONSTRAINT bookings_timezone_check
        CHECK (timezone = 'Africa/Lagos'),

    CONSTRAINT bookings_time_check
        CHECK (
            booking_time IN (
                TIME '09:00',
                TIME '10:00',
                TIME '11:00',
                TIME '12:00',
                TIME '14:00',
                TIME '15:00',
                TIME '16:00'
            )
        ),

    CONSTRAINT bookings_weekday_check
        CHECK (EXTRACT(ISODOW FROM booking_date) BETWEEN 1 AND 5)
);

-- Prevent double bookings while allowing cancelled
-- appointment slots to be reused.

CREATE UNIQUE INDEX unique_active_booking_slot
ON public.bookings (booking_date, booking_time)
WHERE status <> 'cancelled';

-- Speed up availability checks.

CREATE INDEX bookings_date_status_idx
ON public.bookings (booking_date, status);

-- Protect access through the database role.
-- Application privileges will be configured separately.

REVOKE ALL ON public.bookings FROM PUBLIC;

COMMIT;
