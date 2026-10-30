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
export async function getBookedTimes(date: string): Promise<string[]> {
    const result = await getPostgresPool().query<{
        booking_time: string;
    }>(`
    SELECT to_char(booking_time, 'HH24:MI') AS booking_time
    FROM public.bookings
    WHERE booking_date = $1::date
      AND status <> 'cancelled'
    `, [date]);
    return result.rows.map((row) => row.booking_time);
}
export async function updateBookingTracking(bookingId: string, fields: BookingTracking): Promise<void> {
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
    if (entries.length === 0)
        return;
    const assignments = entries.map(([column], index) => `${column} = $${index + 2}`);
    const values = entries.map(([, value]) => value);
    const result = await getPostgresPool().query(`
    UPDATE public.bookings
    SET ${assignments.join(", ")}
    WHERE id = $1::uuid
    `, [bookingId, ...values]);
    if (result.rowCount !== 1)
        throw new Error("Tracking update not persisted");
}
export type Operation = "calendar" | "customer" | "admin";
export type OperationState = "pending" | "started" | "accepted" | "uncertain";
export type BookingRequest = BookingRecord & {
    idempotency_key: string;
    request_hash: string;
    booking_status: string;
    calendar_state: OperationState;
    customer_state: OperationState;
    admin_state: OperationState;
    reconciliation_required: boolean;
};
const requestSelection = `SELECT b.id, b.booking_date::text AS booking_date,
  to_char(b.booking_time,'HH24:MI') AS booking_time, b.consultation_type,
  b.status AS booking_status, r.idempotency_key, r.request_hash, r.calendar_state, r.customer_state, r.admin_state,
  r.reconciliation_required FROM public.booking_requests r JOIN public.bookings b ON b.id=r.booking_id`;
export async function getBookingRequest(key: string, hash: string): Promise<BookingRequest | null> {
    const result = await getPostgresPool().query<BookingRequest>(requestSelection + ' WHERE r.idempotency_key=$1::uuid', [key]);
    const row = result.rows[0];
    if (row && row.request_hash !== hash)
        throw Object.assign(new Error("Request identity conflict"), { code: "IDEMPOTENCY_CONFLICT" });
    return row ?? null;
}
/** One pinned connection and explicit transaction: reservation + journal commit together. */
export async function reserveBooking(input: BookingInput, key: string, hash: string): Promise<BookingRequest> {
    const client = await getPostgresPool().connect();
    let broken = false;
    try {
        await client.query('BEGIN');
        // Serializes simultaneous absent-row requests with the same random UUID.
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [key]);
        const prior = await client.query<BookingRequest>(requestSelection + ' WHERE r.idempotency_key=$1::uuid', [key]);
        if (prior.rows[0]) {
            if (prior.rows[0].booking_status !== 'confirmed')
                throw Object.assign(new Error('Request retired'), { code: 'REQUEST_RETIRED' });
            if (prior.rows[0].request_hash !== hash)
                throw Object.assign(new Error("Request identity conflict"), { code: "IDEMPOTENCY_CONFLICT" });
            await client.query('COMMIT');
            return prior.rows[0];
        }
        const eligibility = await client.query<{ eligible: boolean }>(`SELECT
          ($1::date > (clock_timestamp() AT TIME ZONE 'Africa/Lagos')::date OR
           ($1::date = (clock_timestamp() AT TIME ZONE 'Africa/Lagos')::date AND
            $2::time > (clock_timestamp() AT TIME ZONE 'Africa/Lagos')::time)) AS eligible`, [input.booking_date,input.booking_time]);
        if (eligibility.rows[0]?.eligible !== true)
            throw Object.assign(new Error('Selected time unavailable'), {code:'BOOKING_INELIGIBLE'});
        const row = await client.query<BookingRecord>(`INSERT INTO public.bookings
      (consultation_type,booking_date,booking_time,timezone,name,email,phone,company,service,message,status)
      VALUES ($1,$2,$3,'Africa/Lagos',$4,$5,$6,$7,$8,$9,'confirmed')
      RETURNING id,booking_date::text AS booking_date,to_char(booking_time,'HH24:MI') AS booking_time,consultation_type`, [input.consultation_type, input.booking_date, input.booking_time, input.name, input.email, input.phone ?? null, input.company ?? null, input.service ?? null, input.message ?? null]);
        if (row.rows.length !== 1)
            throw new Error('Reservation result unavailable');
        await client.query('INSERT INTO public.booking_requests (idempotency_key,request_hash,booking_id) VALUES ($1::uuid,$2,$3::uuid)', [key, hash, row.rows[0].id]);
        await client.query('COMMIT'); // A lost acknowledgement is uncertain, never a safe automatic retry.
        return { ...row.rows[0], booking_status: 'confirmed', idempotency_key: key, request_hash: hash, calendar_state: 'pending', customer_state: 'pending', admin_state: 'pending', reconciliation_required: false };
    }
    catch (error) {
        try {
            await client.query('ROLLBACK');
        }
        catch {
            broken = true;
        }
        // Do not retry a write. Destroy a connection with any uncertain transport/timeout.
        if (!(error && typeof error === 'object' && 'code' in error && ['23505', 'IDEMPOTENCY_CONFLICT'].includes(String(error.code))))
            broken = true;
        throw error;
    }
    finally {
        client.release(broken);
    }
}
const stateColumns = { calendar: 'calendar_state', customer: 'customer_state', admin: 'admin_state' } as const;
/** Persist intent before provider execution. A lost claim acknowledgement triggers no call. */
export async function claimBookingOperation(key: string, hash: string, operation: Operation): Promise<boolean> {
    const column = stateColumns[operation];
    if (!column)
        throw new Error('Operation');
    const result = await getPostgresPool().query(`UPDATE public.booking_requests SET ${column}='started',updated_at=now()
    WHERE idempotency_key=$1::uuid AND request_hash=$2 AND ${column}='pending' RETURNING booking_id`, [key, hash]);
    return result.rowCount === 1;
}
export async function finishBookingOperation(key: string, hash: string, operation: Operation, accepted: boolean) {
    const column = stateColumns[operation];
    if (!column)
        throw new Error('Operation');
    const result = await getPostgresPool().query(`UPDATE public.booking_requests SET ${column}=$3,
    reconciliation_required=reconciliation_required OR NOT $4::boolean,
    last_error_category=CASE WHEN $4::boolean THEN last_error_category ELSE $5 END,updated_at=now()
    WHERE idempotency_key=$1::uuid AND request_hash=$2 AND ${column}='started'`, [key, hash, accepted ? 'accepted' : 'uncertain', accepted, operation]);
    if (result.rowCount !== 1)
        throw new Error('Operation receipt not persisted');
}
