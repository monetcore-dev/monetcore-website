import { readSubmission, enforceRateLimit, validateSubmission, isValidDate, escapeCalendarText, } from "@/app/lib/submissionSafety";
import { isStagingBookingEnabled } from "@/app/lib/previewSafety";
import { bookingAccessError, stagingBookingRecipients, } from "@/app/lib/stagingBooking";
import { createHash } from "node:crypto";
import { bookingRecoveryPlan, bookingProviderReferences } from "@/app/lib/bookingRecovery";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { reserveBooking, getBookingRequest, claimBookingOperation, finishBookingOperation, type Operation, updateBookingTracking as updatePostgresTracking } from "@/app/lib/bookingRepository";
import { getGoogleCalendar } from "@/app/lib/googleCalendar";
function cleanText(value: unknown, maxLength = 500) {
    if (typeof value !== "string")
        return "";
    return value.trim().slice(0, maxLength);
}
function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isValidTime(value: string) {
    return /^\d{2}:\d{2}$/.test(value);
}
const allowedTimes = new Set([
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "14:00",
    "15:00",
    "16:00",
]);
function formatBookingDate(date: string) {
    const parsedDate = new Date(`${date}T12:00:00+01:00`);
    return new Intl.DateTimeFormat("en-NG", {
        timeZone: "Africa/Lagos",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    }).format(parsedDate);
}
function getConsultationDuration(consultationType: string) {
    const match = consultationType.match(/(\d+)\s*minutes?/i);
    if (!match) {
        return 45;
    }
    const duration = Number(match[1]);
    if (!Number.isFinite(duration) || duration < 15 || duration > 180) {
        return 45;
    }
    return duration;
}
function buildCalendarDescription({ consultationType, name, email, phone, company, service, message, bookingId, }: {
    consultationType: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    service: string;
    message: string;
    bookingId: string;
}) {
    return `
Monetcore System Solutions Consultation

Consultation:
${escapeCalendarText(consultationType)}

CUSTOMER

Name:
${escapeCalendarText(name)}

Email:
${escapeCalendarText(email)}

Phone / WhatsApp:
${escapeCalendarText(phone || "Not provided")}

Company:
${escapeCalendarText(company || "Not provided")}

Service:
${escapeCalendarText(service || "Not specified")}

PROJECT / DISCUSSION DETAILS

${escapeCalendarText(message || "No additional details provided.")}

Booking ID:
${escapeCalendarText(bookingId)}

Booked through:
https://monetcore.dev/book
  `.trim();
}
function smtpAccepted(result: {
    accepted?: unknown;
    rejected?: unknown;
}, recipient: string) {
    return (Array.isArray(result.accepted) &&
        result.accepted.some((address) => typeof address === "string" &&
            address.toLowerCase() === recipient.toLowerCase()) &&
        (!Array.isArray(result.rejected) || result.rejected.length === 0));
}
/** Tracking failures must not erase a reservation or repeat accepted side effects. */
async function updateBookingTracking(bookingId: string, fields: Record<string, string>, operation: "calendar" | "customer_notification" | "admin_notification") {
    try {
        await updatePostgresTracking(bookingId, fields);
        return true;
    }
    catch {
        console.error("Booking tracking update failed.", {
            operation,
            failure: "request_failed",
        });
        return false;
    }
}
export async function POST(request: Request) {
    const staging = isStagingBookingEnabled();
    const blocked = bookingAccessError();
    if (blocked)
        return blocked;
    let reservationAttempted = false;
    const respond = (body: Record<string, unknown>, init?: ResponseInit) => NextResponse.json("error" in body && !("outcome" in body)
        ? { ...body, outcome: reservationAttempted ? "unknown" : "not_created" }
        : body, init);
    try {
        const limited = await enforceRateLimit(request, staging ? "staging:booking" : "booking", 10, 600000, staging);
        if (limited)
            return NextResponse.json({ ...(await limited.json()), outcome: "not_created" }, { status: limited.status, headers: limited.headers });
        const body = await readSubmission(request);
        if (body instanceof Response)
            return NextResponse.json({ ...(await body.json()), outcome: "not_created" }, { status: body.status, headers: body.headers });
        if (body.website && typeof body.website === "string")
            return respond({ error: "Unable to accept this submission.", outcome: "not_created" }, { status: 400 });
        const invalid = validateSubmission(body, "booking");
        if (invalid)
            return respond({ error: invalid }, { status: 400 });
        const consultationType = cleanText(body.consultationType, 150);
        const date = cleanText(body.date, 10);
        const time = cleanText(body.time, 5);
        const name = cleanText(body.name, 100);
        const email = cleanText(body.email, 200).toLowerCase();
        const phone = cleanText(body.phone, 50);
        const company = cleanText(body.company, 150);
        const service = cleanText(body.service, 150);
        const message = cleanText(body.message, 3000);
        const website = cleanText(body.website, 200);
        const startedAt = Number(body.startedAt);
        // Honeypot
        if (website) {
            return respond({ error: "Unable to accept this submission.", outcome: "not_created" }, { status: 400 });
        }
        // Reject unrealistically fast submissions
        if (Number.isFinite(startedAt) && Date.now() - startedAt < 1500) {
            return respond({
                error: "Please wait a moment before submitting.",
            }, { status: 400 });
        }
        if (!consultationType) {
            return respond({
                error: "Please select a consultation type.",
            }, { status: 400 });
        }
        if (!name) {
            return respond({
                error: "Please enter your name.",
            }, { status: 400 });
        }
        if (!isValidEmail(email)) {
            return respond({
                error: "Please enter a valid email address.",
            }, { status: 400 });
        }
        if (!isValidDate(date)) {
            return respond({
                error: "Please select a valid booking date.",
            }, { status: 400 });
        }
        if (!isValidTime(time) || !allowedTimes.has(time)) {
            return respond({
                error: "Please select a valid consultation time.",
            }, { status: 400 });
        }
        const bookingDate = new Date(`${date}T12:00:00+01:00`);
        const day = bookingDate.getUTCDay();
        if (day === 0 || day === 6) {
            return respond({
                error: "Consultations are currently available Monday to Friday.",
            }, { status: 400 });
        }
        if (staging && !stagingBookingRecipients().includes(email)) {
            return respond({
                error: "Use an approved staging test email address.",
                outcome: "not_created",
            }, { status: 403 });
        }
        const requestKey = typeof body.idempotencyKey === "string" ? body.idempotencyKey : "";
        if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(requestKey))
            return respond({ error: "Reload the booking form and try again.", outcome: "not_created" }, { status: 400 });
        const reservationInput = {
            consultation_type: consultationType, booking_date: date, booking_time: time,
            name, email, phone: phone || null, company: company || null,
            service: service || null, message: message || null,
        };
        const requestHash = createHash("sha256").update(JSON.stringify(reservationInput)).digest("hex");
        // Reservation and durable request identity are committed in ONE transaction.
        reservationAttempted = true;
        let booking;
        try {
            booking = await reserveBooking(reservationInput, requestKey, requestHash);
        }
        catch (error) {
            if (typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === "23505" &&
                "constraint" in error && error.constraint === "unique_active_booking_slot") {
                return respond({
                    error: "The selected time is no longer available. Please choose another available slot.",
                    outcome: "not_created", code: "SLOT_UNAVAILABLE",
                }, { status: 409 });
            }
            if (error && typeof error === "object" && "code" in error && error.code === "BOOKING_INELIGIBLE")
                return respond({error:"The selected consultation time has passed. Please choose another available time.",outcome:"not_created",code:"BOOKING_INELIGIBLE"},{status:400});
            if (error && typeof error === "object" && "code" in error &&
                ["IDEMPOTENCY_CONFLICT", "REQUEST_RETIRED"].includes(String(error.code)))
                return respond({ error: "This request cannot be reused. Contact Monetcore before submitting again.", outcome: "not_created", code: String(error.code) }, { status: 409 });
            // A COMMIT acknowledgement may be lost. A durable read can recover an
            // existing reservation, but a missing row does NOT prove a write failed.
            try {
                booking = await getBookingRequest(requestKey, requestHash);
            }
            catch {
                booking = null;
            }
            if (!booking) {
                console.error("Booking persistence outcome unavailable.");
                return respond({ error: "The booking outcome could not be verified. Do not resubmit; contact hello@monetcore.dev with this request reference.", outcome: "unknown", requestReference: requestKey }, { status: 503 });
            }
        }
        if (booking.booking_status !== "confirmed")
            return respond({ error: "This reservation is no longer active. Contact Monetcore.", outcome: "not_created", code: "REQUEST_RETIRED" }, { status: 409 });
        // Booking is now safely stored.
        // Calendar or email failures must not remove the booking.
        const initialPlan = bookingRecoveryPlan(booking);
        const mayResume = !initialPlan.expired;
        const references = bookingProviderReferences(booking.id);
        let trackingComplete = true;
        const receipt = async (operation: Operation, accepted: boolean) => {
            try {
                await finishBookingOperation(requestKey, requestHash, operation, accepted);
            }
            catch {
                trackingComplete = false;
                console.error("Booking operation receipt unavailable.", { operation });
            }
        };
        let calendarClaimed = false;
        let calendarEventCreated = booking.calendar_state === "accepted";
        let calendarEventId: string | null = null;
        try {
            if (mayResume && booking.calendar_state === "pending") {
                const durationMinutes = getConsultationDuration(consultationType);
                const startDateTime = new Date(`${date}T${time}:00+01:00`);
                const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
                const { googleCalendar, monetcoreCalendarId } = getGoogleCalendar();
                calendarClaimed = await claimBookingOperation(requestKey, requestHash, "calendar");
                if (calendarClaimed) {
                    const calendarResponse = await googleCalendar.events.insert({
                        calendarId: monetcoreCalendarId,
                        sendUpdates: "none",
                        requestBody: {
                            id: references.calendarEventId,
                            extendedProperties: { private: { monetcoreBookingId: booking.id } },
                            summary: `${staging ? "[STAGING TEST] " : ""}Monetcore Consultation — ${name}`,
                            description: buildCalendarDescription({
                                consultationType,
                                name,
                                email,
                                phone,
                                company,
                                service,
                                message,
                                bookingId: booking.id,
                            }),
                            location: "Ventures Park, 5 Kwaji Close, Maitama, Abuja, Nigeria",
                            start: {
                                dateTime: startDateTime.toISOString(),
                                timeZone: "Africa/Lagos",
                            },
                            end: {
                                dateTime: endDateTime.toISOString(),
                                timeZone: "Africa/Lagos",
                            },
                        },
                    }, { timeout: 10000, retry: false });
                    calendarEventId = calendarResponse.data.id ?? null;
                    if (calendarEventId !== references.calendarEventId)
                        throw new Error("Calendar identity mismatch");
                    if (calendarEventId) {
                        calendarEventCreated = true;
                        trackingComplete =
                            (await updateBookingTracking(booking.id, {
                                google_calendar_event_id: calendarEventId,
                                google_calendar_event_created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            }, "calendar")) && trackingComplete;
                    }
                    else {
                        console.error("Google Calendar event created without an event ID.");
                    }
                    await receipt("calendar", calendarEventCreated && trackingComplete);
                }
            }
        }
        catch {
            if (calendarClaimed)
                await receipt("calendar", false);
            console.error("Google Calendar booking sync error:");
        }
        let customerEmailSent = booking.customer_state === "accepted";
        let adminEmailSent = booking.admin_state === "accepted";
        if (process.env.MONETCORE_EMAIL && process.env.MONETCORE_EMAIL_PASSWORD) {
            try {
                const transporter = nodemailer.createTransport({
                    host: "mail.privateemail.com",
                    port: 465,
                    secure: true,
                    connectionTimeout: 10000,
                    greetingTimeout: 10000,
                    socketTimeout: 20000,
                    disableFileAccess: true,
                    disableUrlAccess: true,
                    auth: {
                        user: process.env.MONETCORE_EMAIL,
                        pass: process.env.MONETCORE_EMAIL_PASSWORD,
                    },
                });
                const readableDate = formatBookingDate(date);
                // Customer confirmation
                let customerClaimed = false;
                try {
                    if (mayResume && booking.customer_state === "pending") {
                        customerClaimed = await claimBookingOperation(requestKey, requestHash, "customer");
                        if (customerClaimed) {
                            const customerDelivery = await transporter.sendMail({
                                messageId: references.customerMessageId,
                                from: `"Monetcore System Solutions" <${process.env.MONETCORE_EMAIL}>`,
                                to: email,
                                replyTo: process.env.MONETCORE_EMAIL,
                                subject: `${staging ? "[STAGING TEST] " : ""}Your Monetcore reservation was recorded`,
                                text: `
Hello ${name},

Thank you for booking a consultation with Monetcore System Solutions.

Request reference: ${requestKey}

Your reservation is recorded. Final confirmation depends on completion of Calendar and notification processing. Contact hello@monetcore.dev if confirmation is incomplete; do not resubmit this reservation.

Consultation:
${consultationType}

Date:
${readableDate}

Time:
${time} WAT

Timezone:
West Africa Time (Africa/Lagos)

Service:
${service || "Not specified"}

We look forward to discussing your project and identifying practical next steps.

If you need to contact us before the meeting:

Email: hello@monetcore.dev
Phone: +234 706 588 0558
WhatsApp: +234 706 588 0558

Monetcore System Solutions
Ventures Park
5 Kwaji Close
Maitama, Abuja
Nigeria

https://monetcore.dev
            `.trim(),
                            });
                            if (!smtpAccepted(customerDelivery, email))
                                throw new Error("SMTP acceptance incomplete");
                            customerEmailSent = true;
                            const customerTracked =
                                await updateBookingTracking(booking.id, {
                                    confirmation_sent_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                }, "customer_notification");
                            trackingComplete = customerTracked && trackingComplete;
                            await receipt("customer", customerTracked);
                        }
                    }
                }
                catch {
                    if (customerClaimed)
                        await receipt("customer", false);
                    console.error("Customer confirmation email error:");
                }
                // Monetcore notification
                let adminClaimed = false;
                try {
                    if (mayResume && booking.admin_state === "pending") {
                        adminClaimed = await claimBookingOperation(requestKey, requestHash, "admin");
                        if (adminClaimed) {
                            const adminDelivery = await transporter.sendMail({
                                messageId: references.adminMessageId,
                                from: `"Monetcore Booking System" <${process.env.MONETCORE_EMAIL}>`,
                                to: staging ? "hello@monetcore.dev" : process.env.MONETCORE_EMAIL,
                                replyTo: email,
                                subject: `${staging ? "[STAGING TEST] " : ""}New Consultation Booking — ${name}`,
                                text: `
New consultation booking from monetcore.dev
${staging ? "STAGING reservation" : "Reservation recorded"}. Calendar accepted: ${calendarEventCreated}; customer SMTP accepted: ${customerEmailSent}; tracking complete: ${trackingComplete}. Review the durable request journal before final confirmation.
Request reference: ${requestKey}

Consultation:
${consultationType}

Date:
${readableDate}

Time:
${time} WAT

CUSTOMER

Name:
${name}

Email:
${email}

Phone / WhatsApp:
${phone || "Not provided"}

Company:
${company || "Not provided"}

Service:
${service || "Not specified"}

PROJECT / DISCUSSION DETAILS

${escapeCalendarText(message || "No additional details provided.")}

Booking ID:
${booking.id}
            `.trim(),
                            });
                            if (!smtpAccepted(adminDelivery, staging ? "hello@monetcore.dev" : process.env.MONETCORE_EMAIL!))
                                throw new Error("SMTP acceptance incomplete");
                            adminEmailSent = true;
                            const adminTracked =
                                await updateBookingTracking(booking.id, {
                                    admin_notification_sent_at: new Date().toISOString(),
                                    updated_at: new Date().toISOString(),
                                }, "admin_notification");
                            trackingComplete = adminTracked && trackingComplete;
                            await receipt("admin", adminTracked);
                        }
                    }
                }
                catch {
                    if (adminClaimed)
                        await receipt("admin", false);
                    console.error("Admin booking notification error:");
                }
            }
            catch {
                console.error("Booking email setup error:");
            }
        }
        else {
            console.error("Missing Monetcore booking email environment variables.");
        }
        let verified;
        try {
            verified = await getBookingRequest(requestKey, requestHash);
        }
        catch {
            verified = null;
        }
        const plan = verified ? bookingRecoveryPlan(verified) : null;
        const complete = plan?.fulfillment === "confirmed";
        return respond({
            success: complete,
            outcome: complete ? "confirmed" : "reserved_incomplete",
            fulfillment: plan?.fulfillment ?? "reconciliation_required",
            requestReference: requestKey,
            message: complete ? "Reservation and required operations accepted." : "Your reservation was saved, but confirmation is incomplete. Do not resubmit. Contact hello@monetcore.dev with your request reference.",
            booking: {
                id: booking.id,
                bookingDate: booking.booking_date,
                bookingTime: String(booking.booking_time).slice(0, 5),
                consultationType: booking.consultation_type,
            },
            calendar: {
                eventCreated: calendarEventCreated,
            },
            email: {
                customerConfirmationSent: customerEmailSent,
                adminNotificationSent: adminEmailSent,
            },
        }, { status: complete ? 201 : 202 });
    }
    catch {
        console.error("Booking API error:");
        return respond({
            error: "Unable to process booking.",
        }, { status: 500 });
    }
}
