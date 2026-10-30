import "server-only";
import { createHash } from "node:crypto";
import type { BookingRequest } from "./bookingRepository";
/** References aid reconciliation; Message-ID does NOT guarantee SMTP deduplication. */
export function bookingProviderReferences(bookingId: string) {
    const digest = createHash("sha256").update(`monetcore-booking:${bookingId}`).digest("hex");
    return { calendarEventId: digest,
        customerMessageId: `<monetcore.${digest}.customer@monetcore.dev>`,
        adminMessageId: `<monetcore.${digest}.admin@monetcore.dev>` };
}
/** Read-only plan. No provider calls, state resets, resends or public admin endpoint. */
export function bookingTimeHasPassed(date: string,time: string,now = new Date()) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now).map(part=>[part.type,part.value]));
    const today = `${parts.year}-${parts.month}-${parts.day}`;
    return date < today || (date === today && time <= `${parts.hour}:${parts.minute}`);
}
export function bookingRecoveryPlan(row: BookingRequest) {
    const states = [row.calendar_state, row.customer_state, row.admin_state];
    const complete = row.booking_status === "confirmed" && states.every(state => state === "accepted") && !row.reconciliation_required;
    const expired = bookingTimeHasPassed(row.booking_date,row.booking_time);
    const manual = (!complete && expired) || row.booking_status !== "confirmed" || row.reconciliation_required || states.some(state => state === "started" || state === "uncertain");
    return { expired, fulfillment: complete ? "confirmed" as const : manual ? "reconciliation_required" as const : "pending_external_operations" as const,
        safeToResume: { calendar: !expired && row.calendar_state === "pending", customer: !expired && row.customer_state === "pending", admin: !expired && row.admin_state === "pending" },
        ...bookingProviderReferences(row.id) };
}
