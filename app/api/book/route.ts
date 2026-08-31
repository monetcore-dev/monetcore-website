import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import {
  googleCalendar,
  monetcoreCalendarId,
} from "@/app/lib/googleCalendar";

function cleanText(value: unknown, maxLength = 500) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
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
${consultationType}

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

${message || "No additional details provided."}

Booking ID:
${bookingId}

Booked through:
https://monetcore.dev/book
  `.trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const consultationType = cleanText(
      body.consultationType,
      150
    );

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
      return NextResponse.json(
        { success: true },
        { status: 200 }
      );
    }

    // Reject unrealistically fast submissions
    if (
      Number.isFinite(startedAt) &&
      Date.now() - startedAt < 1500
    ) {
      return NextResponse.json(
        {
          error:
            "Please wait a moment before submitting.",
        },
        { status: 400 }
      );
    }

    if (!consultationType) {
      return NextResponse.json(
        {
          error:
            "Please select a consultation type.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          error: "Please enter your name.",
        },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (!isValidDate(date)) {
      return NextResponse.json(
        {
          error:
            "Please select a valid booking date.",
        },
        { status: 400 }
      );
    }

    if (
      !isValidTime(time) ||
      !allowedTimes.has(time)
    ) {
      return NextResponse.json(
        {
          error:
            "Please select a valid consultation time.",
        },
        { status: 400 }
      );
    }

    const todayString = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Lagos",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (date < todayString) {
      return NextResponse.json(
        {
          error:
            "You cannot book a date in the past.",
        },
        { status: 400 }
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
        return NextResponse.json(
          {
            error:
              "That consultation time has already passed. Please choose a later time.",
          },
          { status: 400 }
        );
      }
    }

    const bookingDate = new Date(
      `${date}T12:00:00+01:00`
    );

    const day = bookingDate.getUTCDay();

    if (day === 0 || day === 6) {
      return NextResponse.json(
        {
          error:
            "Consultations are currently available Monday to Friday.",
        },
        { status: 400 }
      );
    }

    // Save booking first.
    // Supabase remains the source of truth.
    const { data: booking, error: bookingError } =
      await supabaseAdmin
        .from("bookings")
        .insert({
          consultation_type: consultationType,
          booking_date: date,
          booking_time: time,
          timezone: "Africa/Lagos",
          name,
          email,
          phone: phone || null,
          company: company || null,
          service: service || null,
          message: message || null,
          status: "confirmed",
        })
        .select(
          "id, booking_date, booking_time, consultation_type"
        )
        .single();

    if (bookingError) {
      if (bookingError.code === "23505") {
        return NextResponse.json(
          {
            error:
              "That consultation time has just been booked. Please choose another time.",
          },
          { status: 409 }
        );
      }

      console.error(
        "Supabase booking error:",
        bookingError
      );

      return NextResponse.json(
        {
          error:
            "Unable to create booking.",
        },
        { status: 500 }
      );
    }

    // Booking is now safely stored.
    // Calendar or email failures must not remove the booking.

    let calendarEventCreated = false;
    let calendarEventId: string | null = null;

    try {
      const durationMinutes =
        getConsultationDuration(consultationType);

      const startDateTime = new Date(
        `${date}T${time}:00+01:00`
      );

      const endDateTime = new Date(
        startDateTime.getTime() +
          durationMinutes * 60 * 1000
      );

      const calendarResponse =
        await googleCalendar.events.insert({
          calendarId: monetcoreCalendarId,
          sendUpdates: "none",
          requestBody: {
            summary: `Monetcore Consultation — ${name}`,
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
            location:
              "Ventures Park, 5 Kwaji Close, Maitama, Abuja, Nigeria",
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

      calendarEventId =
        calendarResponse.data.id ?? null;

      if (calendarEventId) {
        calendarEventCreated = true;

        const { error: calendarUpdateError } =
          await supabaseAdmin
            .from("bookings")
            .update({
              google_calendar_event_id:
                calendarEventId,
              google_calendar_event_created_at:
                new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", booking.id);

        if (calendarUpdateError) {
          console.error(
            "Calendar tracking update error:",
            calendarUpdateError
          );
        }
      } else {
        console.error(
          "Google Calendar event created without an event ID."
        );
      }
    } catch (calendarError) {
      console.error(
        "Google Calendar booking sync error:",
        calendarError
      );
    }

    let customerEmailSent = false;
    let adminEmailSent = false;

    if (
      process.env.MONETCORE_EMAIL &&
      process.env.MONETCORE_EMAIL_PASSWORD
    ) {
      try {
        const transporter =
          nodemailer.createTransport({
            host: "mail.privateemail.com",
            port: 465,
            secure: true,
            auth: {
              user: process.env.MONETCORE_EMAIL,
              pass: process.env
                .MONETCORE_EMAIL_PASSWORD,
            },
          });

        const readableDate =
          formatBookingDate(date);

        // Customer confirmation
        try {
          await transporter.sendMail({
            from: `"Monetcore System Solutions" <${process.env.MONETCORE_EMAIL}>`,
            to: email,
            replyTo: process.env.MONETCORE_EMAIL,
            subject:
              "Your Monetcore Consultation Is Confirmed",
            text: `
Hello ${name},

Thank you for booking a consultation with Monetcore System Solutions.

Your consultation is confirmed.

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

          customerEmailSent = true;

          await supabaseAdmin
            .from("bookings")
            .update({
              confirmation_sent_at:
                new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", booking.id);
        } catch (emailError) {
          console.error(
            "Customer confirmation email error:",
            emailError
          );
        }

        // Monetcore notification
        try {
          await transporter.sendMail({
            from: `"Monetcore Booking System" <${process.env.MONETCORE_EMAIL}>`,
            to: process.env.MONETCORE_EMAIL,
            replyTo: email,
            subject: `New Consultation Booking — ${name}`,
            text: `
New consultation booking from monetcore.dev

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

${message || "No additional details provided."}

Booking ID:
${booking.id}
            `.trim(),
          });

          adminEmailSent = true;

          await supabaseAdmin
            .from("bookings")
            .update({
              admin_notification_sent_at:
                new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", booking.id);
        } catch (emailError) {
          console.error(
            "Admin booking notification error:",
            emailError
          );
        }
      } catch (emailSetupError) {
        console.error(
          "Booking email setup error:",
          emailSetupError
        );
      }
    } else {
      console.error(
        "Missing Monetcore booking email environment variables."
      );
    }

    return NextResponse.json(
      {
        success: true,
        booking: {
          id: booking.id,
          bookingDate: booking.booking_date,
          bookingTime: String(
            booking.booking_time
          ).slice(0, 5),
          consultationType:
            booking.consultation_type,
        },
        calendar: {
          eventCreated: calendarEventCreated,
          eventId: calendarEventId,
        },
        email: {
          customerConfirmationSent:
            customerEmailSent,
          adminNotificationSent:
            adminEmailSent,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Booking API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to process booking.",
      },
      { status: 500 }
    );
  }
}