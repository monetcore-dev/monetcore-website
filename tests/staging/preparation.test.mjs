import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import net from "node:net";
import { bookingFixtures } from "./fixtures.mjs";
import { state } from "../integrations.mjs";
import { POST as book } from "../../app/api/book/route.ts";
import { GET as availability } from "../../app/api/book/availability/route.ts";
import {
  validateSubmission,
  enforceRateLimit,
  consultationTypes,
} from "../../app/lib/submissionSafety.ts";
let sequence = 0;
function request(body) {
  return new Request("https://example.invalid/api/book", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://example.invalid",
      "x-forwarded-for": `synthetic-${++sequence}`,
    },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  for (const key of ["bookings", "calendars", "emails", "transports"])
    state[key].length = 0;
  state.failCalendar = state.failEmail = state.failDatabase = false;
  process.env.VERCEL_ENV = "development";
});
test("1 isolation: outbound fetch and sockets are blocked; fixtures contain no real recipients", async () => {
  await assert.rejects(fetch("https://example.invalid"), /offline-only/);
  assert.throws(() => net.connect(443, "example.invalid"), /offline-only/);
  const f = bookingFixtures();
  assert.match(f.base.email, /@example\.invalid$/);
  assert.ok(new Date(f.base.date + "T12:00:00+01:00").getTime() > Date.now());
  assert.equal(process.env.MONETCORE_DB_PASSWORD, undefined);
});
test("2 contract: booking field/type/date rules can be checked without a database", () => {
  const f = bookingFixtures();
  assert.equal(validateSubmission(f.base, "booking"), null);
  for (const key of ["invalidEmail", "invalidDate", "unknownType"])
    assert.ok(validateSubmission(f[key], "booking"));
  assert.equal(consultationTypes.length, 3);
});
test("3 limiter: configured outage fails closed before insertion or downstream calls", async () => {
  process.env.RATE_LIMIT_REQUIRED = "true";
  try {
    assert.equal((await book(request(bookingFixtures().base))).status, 503);
    assert.equal(
      state.bookings.length + state.calendars.length + state.emails.length,
      0,
    );
    process.env.UPSTASH_REDIS_REST_URL = "https://offline-example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-only";
    process.env.RATE_LIMIT_KEY_SECRET =
      "synthetic-only-key-at-least-32-characters";
    const original = globalThis.fetch;
    let captured;
    try {
      globalThis.fetch = async (_url, options) => {
        captured = JSON.parse(options.body);
        return Response.json({ result: [11, 1000] });
      };
      assert.equal(
        (await enforceRateLimit(request({}), "booking")).status,
        429,
      );
      assert.equal(captured[0], "EVAL");
      assert.match(captured[3], /^monetcore:v1:booking:[a-f0-9]{64}$/);
    } finally {
      globalThis.fetch = original;
    }
  } finally {
    for (const key of [
      "RATE_LIMIT_REQUIRED",
      "UPSTASH_REDIS_REST_URL",
      "UPSTASH_REDIS_REST_TOKEN",
      "RATE_LIMIT_KEY_SECRET",
    ])
      delete process.env[key];
  }
});
test("4 insertion: valid synthetic request reaches only mock storage; rejected inputs have no side effects", async () => {
  const f = bookingFixtures();
  for (const key of ["invalidEmail", "invalidDate", "unknownType"])
    assert.equal((await book(request(f[key]))).status, 400);
  assert.equal((await book(request(f.honeypot))).status, 200);
  assert.equal(state.bookings.length, 0);
  assert.equal((await book(request(f.base))).status, 201);
  assert.equal(state.bookings.length, 1);
  assert.equal(state.bookings[0].timezone, "Africa/Lagos");
});
test("5 duplicates: application handles a simulated atomic database conflict", async () => {
  const f = bookingFixtures();
  const results = await Promise.all([
    book(request(f.base)),
    book(request(f.duplicate)),
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  assert.equal(state.bookings.length, 1);
  assert.equal(state.calendars.length, 1);
  assert.equal(state.emails.length, 2);
});
test("6 Calendar: mock event duration, WAT conversion and invitation settings match all types", async () => {
  for (const [index, consultationType] of consultationTypes.entries()) {
    const f = bookingFixtures().base;
    assert.equal(
      (
        await book(
          request({
            ...f,
            time: `${9 + index}:00`.padStart(5, "0"),
            consultationType,
          }),
        )
      ).status,
      201,
    );
    const event = state.calendars.at(-1);
    assert.equal(event.sendUpdates, "none");
    assert.equal(event.requestBody.attendees, undefined);
    assert.equal(event.requestBody.start.timeZone, "Africa/Lagos");
    const duration =
      (Date.parse(event.requestBody.end.dateTime) -
        Date.parse(event.requestBody.start.dateTime)) /
      60000;
    assert.equal(duration, index === 0 ? 30 : 45);
    assert.equal(
      new Date(event.requestBody.start.dateTime).getUTCHours(),
      8 + index,
    );
  }
});
test("7 failures: database failure blocks effects; Calendar/mail failure retains reservation and truthful flags", async () => {
  const f = bookingFixtures().base;
  state.failDatabase = true;
  assert.equal((await book(request(f))).status, 500);
  assert.equal(state.calendars.length + state.emails.length, 0);
  state.failDatabase = false;
  state.failCalendar = state.failEmail = true;
  const response = await book(request(f));
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.equal(state.bookings.length, 1);
  assert.equal(result.calendar.eventCreated, false);
  assert.equal(result.email.customerConfirmationSent, false);
  assert.equal(result.email.adminNotificationSent, false);
});
test("8 email: mock messages remain plaintext and exclusively synthetic", async () => {
  assert.equal((await book(request(bookingFixtures().base))).status, 201);
  assert.equal(state.emails.length, 2);
  for (const mail of state.emails) {
    assert.match(mail.to, /@example\.invalid$/);
    assert.equal(mail.html, undefined);
    assert.ok(mail.text);
  }
});
test("9 review isolation: preview availability and booking remain blocked before side effects", async () => {
  process.env.VERCEL_ENV = "preview";
  assert.equal((await book(request(bookingFixtures().base))).status, 403);
  assert.equal(
    (
      await availability(
        new Request(
          "https://example.invalid/api/book/availability?date=" +
            bookingFixtures().base.date,
        ),
      )
    ).status,
    403,
  );
  assert.equal(
    state.bookings.length + state.calendars.length + state.emails.length,
    0,
  );
});
