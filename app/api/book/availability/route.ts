import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

const allowedTimes = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
];

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function getLagosDateParts() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [
      part.type,
      part.value,
    ])
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const date =
      searchParams.get("date")?.trim() || "";

    if (!isValidDate(date)) {
      return NextResponse.json(
        {
          error:
            "Please provide a valid date.",
        },
        { status: 400 }
      );
    }

    const lagosNow = getLagosDateParts();

    if (date < lagosNow.date) {
      return NextResponse.json(
        {
          error:
            "This booking date is in the past.",
        },
        { status: 400 }
      );
    }

    const bookingDate = new Date(
      `${date}T12:00:00+01:00`
    );

    const day = bookingDate.getUTCDay();

    if (day === 0 || day === 6) {
      return NextResponse.json({
        success: true,
        date,
        bookedTimes: [],
        unavailableTimes: [...allowedTimes],
        unavailable: true,
        message:
          "Consultations are available Monday to Friday.",
      });
    }

    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", date)
      .neq("status", "cancelled");

    if (error) {
      console.error(
        "Booking availability error:",
        error
      );

      return NextResponse.json(
        {
          error:
            "Unable to check availability.",
        },
        { status: 500 }
      );
    }

    const bookedTimes = (data || []).map(
      (booking) =>
        String(booking.booking_time).slice(0, 5)
    );

    const pastTimes =
      date === lagosNow.date
        ? allowedTimes.filter(
            (time) => time <= lagosNow.time
          )
        : [];

    const unavailableTimes = Array.from(
      new Set([
        ...bookedTimes,
        ...pastTimes,
      ])
    );

    return NextResponse.json({
      success: true,
      date,
      bookedTimes,
      pastTimes,
      unavailableTimes,
    });
  } catch (error) {
    console.error(
      "Availability API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to check availability.",
      },
      { status: 500 }
    );
  }
}