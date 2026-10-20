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
export function getSupabaseAdmin() {
  return {
    from() {
      return {
        insert(record) {
          return {
            select() {
              return {
                async single() {
                  if (state.failDatabase)
                    return { error: { code: "mock-failure" } };
                  if (
                    state.bookings.some(
                      (b) =>
                        b.booking_date === record.booking_date &&
                        b.booking_time === record.booking_time,
                    )
                  )
                    return { error: { code: "23505" } };
                  const data = {
                    ...record,
                    id: "mock-" + state.bookings.length,
                  };
                  state.bookings.push(data);
                  return { data, error: null };
                },
              };
            },
          };
        },
        update(fields) {
          return {
            async eq(column, id) {
              state.updates.push({ fields, column, id });
              if (state.throwTracking)
                throw new Error(
                  "PRIVATE synthetic provider details must not be logged",
                );
              if (state.failTracking)
                return {
                  error: {
                    message:
                      "PRIVATE synthetic database details must not be logged",
                  },
                };
              const booking = state.bookings.find((item) => item.id === id);
              if (booking) Object.assign(booking, fields);
              return { error: null };
            },
          };
        },
        select() {
          return {
            eq() {
              return {
                async neq() {
                  return {
                    data: state.available.map((booking_time) => ({
                      booking_time,
                    })),
                    error: null,
                  };
                },
              };
            },
          };
        },
      };
    },
  };
}

export default mailer;
