import "server-only";

import { getPostgresPool } from "./postgres";

export type BookingInput = {
  consultation_type: string;
  booking_date: string;
  booking_time: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  service?: string | null;
  message?: string | null;
};

export type BookingRecord = {
  id: string;
  booking_date: string;
  booking_time: string;
  consultation_type: string;
};

export type BookingTracking = Partial<{
  google_calendar_event_id: string;
  google_calendar_event_created_at: string;
  confirmation_sent_at: string;
  admin_notification_sent_at: string;
  updated_at: string;
}>;

export async function createBooking(
  input: BookingInput,
): Promise<BookingRecord> {
  const result = await getPostgresPool().query<BookingRecord>(
    `
    INSERT INTO public.bookings (
      consultation_type,
      booking_date,
      booking_time,
      timezone,
      name,
      email,
      phone,
      company,
      service,
      message,
      status
    )
    VALUES (
      $1, $2, $3, 'Africa/Lagos',
      $4, $5, $6, $7, $8, $9, 'confirmed'
    )
    RETURNING
      id,
      booking_date::text AS booking_date,
      to_char(booking_time, 'HH24:MI') AS booking_time,
      consultation_type
    `,
    [
      input.consultation_type,
      input.booking_date,
      input.booking_time,
      input.name,
      input.email,
      input.phone ?? null,
      input.company ?? null,
      input.service ?? null,
      input.message ?? null,
    ],
  );

  return result.rows[0];
}

export async function getBookedTimes(
  date: string,
): Promise<string[]> {
  const result = await getPostgresPool().query<{
    booking_time: string;
  }>(
    `
    SELECT to_char(booking_time, 'HH24:MI') AS booking_time
    FROM public.bookings
    WHERE booking_date = $1::date
      AND status <> 'cancelled'
    `,
    [date],
  );

  return result.rows.map((row) => row.booking_time);
}

export async function updateBookingTracking(
  bookingId: string,
  fields: BookingTracking,
): Promise<void> {
  const allowedColumns = [
    "google_calendar_event_id",
    "google_calendar_event_created_at",
    "confirmation_sent_at",
    "admin_notification_sent_at",
    "updated_at",
  ] as const;

  const entries = allowedColumns
    .filter((column) => fields[column] !== undefined)
    .map((column) => [column, fields[column]] as const);

  if (entries.length === 0) return;

  const assignments = entries.map(
    ([column], index) => `${column} = $${index + 2}`,
  );

  const values = entries.map(([, value]) => value);

  await getPostgresPool().query(
    `
    UPDATE public.bookings
    SET ${assignments.join(", ")}
    WHERE id = $1::uuid
    `,
    [bookingId, ...values],
  );
}
