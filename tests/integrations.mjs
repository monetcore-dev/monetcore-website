export const state = {
  emails: [],
  transports: [],
  updates: [],
  failTracking: false,
  throwTracking: false,
  bookings: [],
  calendars: [],
  failCalendar: false,
  failEmail: false,
  rejectEmail: false,
  failDatabase: false,
  loseReservationAck: false,
  available: ["09:00"],
};
const mailer = {
  createTransport(options) {
    state.transports.push(options);
    return {
      async sendMail(message) {
        if (state.failEmail) throw new Error("mock mail failure");
        state.emails.push(message);
        return {
          accepted: state.rejectEmail ? [] : [message.to],
          rejected: state.rejectEmail ? [message.to] : [],
        };
      },
    };
  },
};
export function getGoogleCalendar() {
  return {
    monetcoreCalendarId: "mock-calendar",
    googleCalendar: {
      events: {
        async insert(event) {
          if (state.failCalendar) throw new Error("mock calendar failure");
          state.calendars.push(event);
          return { data: { id: "mock-event" } };
        },
      },
    },
  };
}
export default mailer;

// Simulated PostgreSQL booking repository.
// These functions never connect to the real database.
export async function createBooking(record) {
  if (state.failDatabase) {
    throw Object.assign(new Error("Mock database failure"), {
      code: "MOCK_DATABASE_FAILURE",
    });
  }

  if (
    state.bookings.some(
      (booking) =>
        booking.booking_date === record.booking_date &&
        booking.booking_time === record.booking_time &&
        booking.status !== "cancelled",
    )
  ) {
    throw Object.assign(new Error("Duplicate booking"), {
      code: "23505",
      constraint: "unique_active_booking_slot",
    });
  }

  const booking = {
    ...record,
    id: `mock-${state.bookings.length}`,
    status: "confirmed",
    timezone: "Africa/Lagos",
  };

  state.bookings.push(booking);
  if (state.loseReservationAck) throw Object.assign(new Error("Synthetic uncertain commit"), { code: "08006" });
  return booking;
}

export async function getBookedTimes(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Mock invalid date");
  if (state.failDatabase) {
    throw new Error("Mock database failure");
  }

  return state.available.map((time) => String(time).slice(0, 5));
}

export async function updateBookingTracking(bookingId, fields) {
  state.updates.push({
    fields,
    column: "id",
    id: bookingId,
  });

  if (state.throwTracking) {
    throw new Error("PRIVATE synthetic provider details must not be logged");
  }

  if (state.failTracking) {
    throw new Error("Mock tracking failure");
  }

  const booking = state.bookings.find((item) => item.id === bookingId);

  if (booking) {
    Object.assign(booking, fields);
  }
}
