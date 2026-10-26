import {
  readSubmission,
  enforceRateLimit,
  validateSubmission,
  isValidDate,
  escapeCalendarText,
} from "@/app/lib/submissionSafety";
import { isStagingBookingEnabled } from "@/app/lib/previewSafety";
import {
  bookingAccessError,
  stagingBookingRecipients,
} from "@/app/lib/stagingBooking";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { createBooking, updateBookingTracking as updatePostgresTracking } from "@/app/lib/bookingRepository";
import { getGoogleCalendar } from "@/app/lib/googleCalendar";

function cleanText(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return "";
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

function buildCalendarDescription({
  consultationType,
  name,
  email,
  phone,
  company,
  service,
  message,
  bookingId,
}: {
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

function smtpAccepted(
  result: { accepted?: unknown; rejected?: unknown },
  recipient: string,
) {
  return (
    Array.isArray(result.accepted) &&
    result.accepted.some(
      (address) =>
        typeof address === "string" &&
        address.toLowerCase() === recipient.toLowerCase(),
    ) &&
    (!Array.isArray(result.rejected) || result.rejected.length === 0)
  );
}

/** Tracking failures must not erase a reservation or repeat accepted side effects. */
async function updateBookingTracking(
  bookingId: string,
  fields: Record<string, string>,
  operation: "calendar" | "customer_notification" | "admin_notification",
) {
  try {
    await updatePostgresTracking(bookingId, fields);
    return true;
  } catch {
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
  if (blocked) return blocked;
  let reservationAttempted = false;
  const respond = (body: Record<string, unknown>, init?: ResponseInit) =>
    NextResponse.json(
      staging && "error" in body && !("outcome" in body)
        ? { ...body, outcome: reservationAttempted ? "unknown" : "not_created" }
        : body,
      init,
    );
  try {
    const limited = await enforceRateLimit(
      request,
      staging ? "staging:booking" : "booking",
      10,
      600_000,
      staging,
    );
    if (limited) return limited;
    const body = await readSubmission(request);
    if (body instanceof Response) return body;
    if (body.website && typeof body.website === "string")
      return staging
        ? respond(
            { error: "Unable to accept this submission." },
            { status: 400 },
          )
        : respond({ success: true });
    const invalid = validateSubmission(body, "booking");
    if (invalid) return respond({ error: invalid }, { status: 400 });

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
      return respond({ success: true }, { status: 200 });
    }

    // Reject unrealistically fast submissions
    if (Number.isFinite(startedAt) && Date.now() - startedAt < 1500) {
      return respond(
        {
          error: "Please wait a moment before submitting.",
        },
        { status: 400 },
      );
    }

    if (!consultationType) {
      return respond(
        {
          error: "Please select a consultation type.",
        },
        { status: 400 },
      );
    }

    if (!name) {
      return respond(
        {
          error: "Please enter your name.",
        },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return respond(
        {
          error: "Please enter a valid email address.",
        },
        { status: 400 },
      );
    }

    if (!isValidDate(date)) {
      return respond(
        {
          error: "Please select a valid booking date.",
        },
        { status: 400 },
      );
    }

    if (!isValidTime(time) || !allowedTimes.has(time)) {
      return respond(
        {
          error: "Please select a valid consultation time.",
        },
        { status: 400 },
      );
    }

    const todayString = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (date < todayString) {
      return respond(
        {
          error: "You cannot book a date in the past.",
        },
        { status: 400 },
      );
    }

    if (date === todayString) {
      const currentTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Africa/Lagos",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }).format(new Date());

      if (time <= currentTime) {
        return respond(
          {
            error:
              "That consultation time has already passed. Please choose a later time.",
          },
          { status: 400 },
        );
      }
    }

    const bookingDate = new Date(`${date}T12:00:00+01:00`);

    const day = bookingDate.getUTCDay();

    if (day === 0 || day === 6) {
      return respond(
        {
          error: "Consultations are currently available Monday to Friday.",
        },
        { status: 400 },
      );
    }

    if (staging && !stagingBookingRecipients().includes(email)) {
      return respond(
        {
          error: "Use an approved staging test email address.",
          outcome: "not_created",
        },
        { status: 403 },
      );
    }

    // Save the booking to the VPS PostgreSQL database first.
    reservationAttempted = true;
    let booking;

    try {
      booking = await createBooking({
        consultation_type: consultationType,
        booking_date: date,
        booking_time: time,
        name,
        email,
        phone: phone || null,
        company: company || null,
        service: service || null,
        message: message || null,
      });
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505" &&
        "constraint" in error && error.constraint === "unique_active_booking_slot"
      ) {
        return respond(
          {
            error:
              "The selected time is no longer available. Please choose another available slot.",
            ...(staging ? { outcome: "not_created" } : {}),
          },
          { status: 409 },
        );
      }

      console.error("PostgreSQL booking creation failed.");

      return respond(
        {
          error: "Unable to create booking.",
        },
        { status: 500 },
      );
    }

    // Booking is now safely stored.
    // Calendar or email failures must not remove the booking.

    let trackingComplete = true;
    let calendarEventCreated = false;
    let calendarEventId: string | null = null;

    try {
      const durationMinutes = getConsultationDuration(consultationType);

      const startDateTime = new Date(`${date}T${time}:00+01:00`);

      const endDateTime = new Date(
        startDateTime.getTime() + durationMinutes * 60 * 1000,
      );

      const { googleCalendar, monetcoreCalendarId } = getGoogleCalendar();
      const calendarResponse = await googleCalendar.events.insert({
        calendarId: monetcoreCalendarId,
        sendUpdates: "none",
        requestBody: {
          ...(staging
            ? {
                id: createHash("sha256")
                  .update(`monetcore-booking:${booking.id}`)
                  .digest("hex"),
              }
            : {}),
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
      });

      calendarEventId = calendarResponse.data.id ?? null;

      if (calendarEventId) {
        calendarEventCreated = true;

        trackingComplete =
          (await updateBookingTracking(
            booking.id,
            {
              google_calendar_event_id: calendarEventId,
              google_calendar_event_created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            "calendar",
          )) && trackingComplete;
      } else {
        console.error("Google Calendar event created without an event ID.");
      }
    } catch {
      console.error("Google Calendar booking sync error:");
    }

    let customerEmailSent = false;
    let adminEmailSent = false;

    if (process.env.MONETCORE_EMAIL && process.env.MONETCORE_EMAIL_PASSWORD) {
      try {
        const transporter = nodemailer.createTransport({
          host: "mail.privateemail.com",
          port: 465,
          secure: true,
          connectionTimeout: 10_000,
          greetingTimeout: 10_000,
          socketTimeout: 20_000,
          disableFileAccess: true,
          disableUrlAccess: true,
          auth: {
            user: process.env.MONETCORE_EMAIL,
            pass: process.env.MONETCORE_EMAIL_PASSWORD,
          },
        });

        const readableDate = formatBookingDate(date);

        // Customer confirmation
        try {
          const customerDelivery = await transporter.sendMail({
            from: `"Monetcore System Solutions" <${process.env.MONETCORE_EMAIL}>`,
            to: email,
            replyTo: process.env.MONETCORE_EMAIL,
            subject: staging
              ? "[STAGING TEST] Your reservation was recorded"
              : "Your Monetcore Consultation Is Confirmed",
            text: `
Hello ${name},

Thank you for booking a consultation with Monetcore System Solutions.

${staging ? "Your staging reservation is recorded. Final confirmation depends on completion of Calendar and notification processing; contact the test administrator if any step is incomplete. Do not resubmit this reservation." : "Your consultation is confirmed."}

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

          if (staging && !smtpAccepted(customerDelivery, email))
            throw new Error("SMTP acceptance incomplete");
          customerEmailSent = true;

          trackingComplete =
            (await updateBookingTracking(
              booking.id,
              {
                confirmation_sent_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              "customer_notification",
            )) && trackingComplete;
        } catch {
          console.error("Customer confirmation email error:");
        }

        // Monetcore notification
        try {
          const adminDelivery = await transporter.sendMail({
            from: `"Monetcore Booking System" <${process.env.MONETCORE_EMAIL}>`,
            to: staging ? "hello@monetcore.dev" : process.env.MONETCORE_EMAIL,
            replyTo: email,
            subject: `${staging ? "[STAGING TEST] " : ""}New Consultation Booking — ${name}`,
            text: `
New consultation booking from monetcore.dev
${staging ? `STAGING reservation. Calendar accepted: ${calendarEventCreated}; customer SMTP accepted: ${customerEmailSent}. Tracking/reconciliation must be reviewed before final confirmation.` : ""}

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

          if (staging && !smtpAccepted(adminDelivery, "hello@monetcore.dev"))
            throw new Error("SMTP acceptance incomplete");
          adminEmailSent = true;

          trackingComplete =
            (await updateBookingTracking(
              booking.id,
              {
                admin_notification_sent_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              "admin_notification",
            )) && trackingComplete;
        } catch {
          console.error("Admin booking notification error:");
        }
      } catch {
        console.error("Booking email setup error:");
      }
    } else {
      console.error("Missing Monetcore booking email environment variables.");
    }

    const complete =
      calendarEventCreated &&
      customerEmailSent &&
      adminEmailSent &&
      trackingComplete;
    return respond(
      {
        success: staging ? complete : true,
        ...(staging
          ? {
              outcome: complete ? "confirmed" : "reserved_incomplete",
              message: complete
                ? "Reservation and required operations accepted."
                : "Your reservation was saved, but confirmation is incomplete. Do not resubmit. Contact hello@monetcore.dev for reconciliation.",
            }
          : {}),
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
      },
      { status: staging && !complete ? 202 : 201 },
    );
  } catch {
    console.error("Booking API error:");

    return respond(
      {
        error: "Unable to process booking.",
      },
      { status: 500 },
    );
  }
}
