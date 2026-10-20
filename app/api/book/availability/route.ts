import { enforceRateLimit, isValidDate } from "@/app/lib/submissionSafety";
import { isReviewPreview, previewFormMessage } from "@/app/lib/previewSafety";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/app/lib/supabaseAdmin";

const allowedTimes = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "14:00",
  "15:00",
  "16:00",
];

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
    parts.map((part) => [part.type, part.value]),
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

export async function GET(request: Request) {
  if (isReviewPreview()) {
    return NextResponse.json({ error: previewFormMessage }, { status: 403 });
  }
  const limited = await enforceRateLimit(request, "availability", 60, 60_000);
  if (limited) return limited;
  try {
    const { searchParams } = new URL(request.url);

    const date = searchParams.get("date")?.trim() || "";

    if (!isValidDate(date)) {
      return NextResponse.json(
        {
          error: "Please provide a valid date.",
        },
        { status: 400 },
      );
    }

    const lagosNow = getLagosDateParts();

    if (date < lagosNow.date) {
      return NextResponse.json(
        {
          error: "This booking date is in the past.",
        },
        { status: 400 },
      );
    }

    const bookingDate = new Date(`${date}T12:00:00+01:00`);

    const day = bookingDate.getUTCDay();

    if (day === 0 || day === 6) {
      return NextResponse.json({
        success: true,
        date,
        bookedTimes: [],
        unavailableTimes: [...allowedTimes],
        unavailable: true,
        message: "Consultations are available Monday to Friday.",
      });
    }

    const { data, error } = await getSupabaseAdmin()
      .from("bookings")
      .select("booking_time")
      .eq("booking_date", date)
      .neq("status", "cancelled");

    if (error) {
      console.error("Booking availability error:");

      return NextResponse.json(
        {
          error: "Unable to check availability.",
        },
        { status: 500 },
      );
    }

    const bookedTimes = (data || []).map((booking) =>
      String(booking.booking_time).slice(0, 5),
    );

    const pastTimes =
      date === lagosNow.date
        ? allowedTimes.filter((time) => time <= lagosNow.time)
        : [];

    const unavailableTimes = Array.from(
      new Set([...bookedTimes, ...pastTimes]),
    );

    return NextResponse.json({
      success: true,
      date,
      bookedTimes,
      pastTimes,
      unavailableTimes,
    });
  } catch {
    console.error("Availability API error:");

    return NextResponse.json(
      {
        error: "Unable to check availability.",
      },
      { status: 500 },
    );
  }
}
