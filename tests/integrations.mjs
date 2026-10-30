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
          return { data: { id: event.requestBody.id || "mock-event" } };
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

state.requests = [];
state.failLookup = false;
state.failJournal = false;
const reservations = new Map();
export async function reserveBooking(input, key, hash) {
  const before = reservations.get(key) ?? Promise.resolve();
  const next = before.catch(() => {}).then(async () => {
    const prior = state.requests.find(row => row.idempotency_key === key);
    if (prior) {
      if (prior.request_hash !== hash) throw Object.assign(new Error('Identity conflict'), {code:'IDEMPOTENCY_CONFLICT'});
      return prior;
    }
    const nowParts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
    const today=`${nowParts.year}-${nowParts.month}-${nowParts.day}`;
    if(input.booking_date < today || (input.booking_date===today && input.booking_time<=`${nowParts.hour}:${nowParts.minute}`)) throw Object.assign(new Error('Time unavailable'),{code:'BOOKING_INELIGIBLE'});
    const lost = state.loseReservationAck;
    state.loseReservationAck = false;
    let booking;
    try { booking = await createBooking(input); } finally { state.loseReservationAck = lost; }
    const row = { ...booking, booking_status:'confirmed',idempotency_key:key,request_hash:hash,calendar_state:'pending',customer_state:'pending',admin_state:'pending',reconciliation_required:false };
    state.requests.push(row);
    if (lost) throw Object.assign(new Error('Synthetic uncertain commit'), {code:state.ackErrorCode || '08006'});
    return row;
  });
  reservations.set(key,next);
  try { return await next; } finally { if(reservations.get(key)===next) reservations.delete(key); }
}
export async function getBookingRequest(key, hash) {
  if (state.failDatabase || state.failLookup) throw new Error('Synthetic lookup failure');
  const row = state.requests.find(row => row.idempotency_key===key);
  if(row && row.request_hash!==hash) throw Object.assign(new Error('Identity conflict'),{code:'IDEMPOTENCY_CONFLICT'});
  return row ?? null;
}
export async function claimBookingOperation(key, hash, op) {
  if(state.failJournal)throw new Error('Synthetic journal failure');
  const row=await getBookingRequest(key,hash),column=op+'_state';
  if(!row || row[column]!=='pending')return false;
  row[column]='started';if(state.loseClaimAck)throw new Error('Synthetic uncertain claim');return true;
}
export async function finishBookingOperation(key,hash,op,accepted) {
  if(state.failJournal)throw new Error('Synthetic receipt failure');
  const row=await getBookingRequest(key,hash),column=op+'_state';
  if(!row || row[column]!=='started')throw new Error('Receipt conflict');
  row[column]=accepted?'accepted':'uncertain';if(!accepted)row.reconciliation_required=true;
}
