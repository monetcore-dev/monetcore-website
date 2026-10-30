import { randomUUID } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { POST } from "../app/api/book/route.ts";
import { GET } from "../app/api/book/availability/route.ts";
import { assertBookingIntegrationsAllowed } from "../app/lib/stagingBooking.ts";
import { getPostgresPool as realPostgresFactory } from "../app/lib/postgres.ts";
import { getGoogleCalendar as realCalendarFactory } from "../app/lib/googleCalendar.ts";
import { state } from "./integrations.mjs";

const config = {
  MONETCORE_STAGING: "true",
  MONETCORE_VPS_REVIEW: "true",
  MONETCORE_VPS_PROXY_VERIFIED: "true",
  NODE_ENV: "production",
  STAGING_BOOKING_ENABLED: "true",
  STAGING_BOOKING_EXPECTED_DATABASE: "monetcore_db",
  MONETCORE_DB_PASSWORD: "synthetic-test-password-not-a-credential",
  STAGING_BOOKING_EXPECTED_CALENDAR_ID: "synthetic-calendar",
  GOOGLE_CALENDAR_ID: "synthetic-calendar",
  STAGING_BOOKING_EXPECTED_SERVICE_ACCOUNT_EMAIL:
    "test@synthetic.iam.gserviceaccount.com",
  GOOGLE_SERVICE_ACCOUNT_EMAIL: "test@synthetic.iam.gserviceaccount.com",
  GOOGLE_PRIVATE_KEY: "synthetic-only",
  STAGING_BOOKING_CALENDAR_EXCLUSIVE: "true",
  STAGING_BOOKING_TEST_EMAILS: "staging-tester@example.invalid",
  MONETCORE_EMAIL: "hello@monetcore.dev",
  MONETCORE_EMAIL_PASSWORD: "synthetic-only",
  UPSTASH_REDIS_REST_URL: "https://synthetic.upstash.io",
  UPSTASH_REDIS_REST_TOKEN: "synthetic-only",
  RATE_LIMIT_KEY_SECRET: "synthetic-local-test-secret-32-characters",
};
const valid = {
  consultationType: "Discovery Call - 30 minutes",
  date: "2030-01-07",
  time: "09:00",
  name: "Synthetic Booking Test",
  email: "staging-tester@example.invalid",
  message: "Synthetic test only",
  startedAt: Date.now() - 5000,
};
const request = (body = valid) =>
  new Request("https://review.monetcore.dev/api/book", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://review.monetcore.dev",
      "x-forwarded-for": "synthetic",
    },
    body: JSON.stringify({ ...body, idempotencyKey: body.idempotencyKey ?? randomUUID() }),
  });
const availability = () =>
  GET(
    new Request("https://review.monetcore.dev/api/book/availability?date=2030-01-07"),
  );
function reset() {
  for (const key of ["VERCEL", "VERCEL_ENV", "VERCEL_GIT_COMMIT_REF"]) delete process.env[key];
  Object.assign(process.env, config);
  for (const key of ["bookings", "emails", "updates", "calendars", "requests"])
    state[key].length = 0;
  for (const key of [
    "failTracking",
    "throwTracking",
    "failCalendar",
    "failEmail",
    "rejectEmail",
    "failDatabase",
    "loseReservationAck",
  ])
    state[key] = false;
  globalThis.fetch = async (url) => {
    assert.equal(String(url), "https://synthetic.upstash.io/");
    return Response.json({ result: [1, 60000] });
  };
}

test("staging booking safety, isolation, delivery outcomes and retry boundaries (mocked services only)", async () => {
  const saved = { ...process.env };
  const originalFetch = globalThis.fetch;
  try {
    for (const patch of [
      { STAGING_BOOKING_ENABLED: "false" },
      { MONETCORE_VPS_REVIEW: "false" },
      { MONETCORE_VPS_PROXY_VERIFIED: "false" },
      { MONETCORE_STAGING: "false" },
      { NODE_ENV: "development" },
      { VERCEL: "1" },
      { VERCEL_ENV: "preview" },
      { VERCEL_GIT_COMMIT_REF: "other-branch" },
    ]) {
      reset();
      Object.assign(process.env, patch);
      assert.equal((await POST(request())).status, 403);
      assert.equal((await availability()).status, 403);
      assert.throws(realPostgresFactory);
      assert.throws(realCalendarFactory);
      assert.equal(state.bookings.length, 0);
    }
    for (const key of Object.keys(config).filter(
      (key) =>
        ![
          "MONETCORE_STAGING", "MONETCORE_VPS_REVIEW", "MONETCORE_VPS_PROXY_VERIFIED", "NODE_ENV",
          "STAGING_BOOKING_ENABLED",
        ].includes(key),
    )) {
      reset();
      delete process.env[key];
      assert.throws(assertBookingIntegrationsAllowed, `missing ${key}`);
      assert.equal((await POST(request())).status, 503);
      assert.equal((await availability()).status, 503);
      assert.equal(state.bookings.length, 0);
    }
    for (const patch of [
      { STAGING_BOOKING_EXPECTED_DATABASE: "production_db" },
      { GOOGLE_CALENDAR_ID: "wrong-calendar" },
      { GOOGLE_SERVICE_ACCOUNT_EMAIL: "wrong@example.invalid" },
      { MONETCORE_EMAIL: "unapproved@example.invalid" },
      { STAGING_BOOKING_TEST_EMAILS: "*@example.invalid" },
      { STAGING_BOOKING_CALENDAR_EXCLUSIVE: "false" },
    ]) {
      reset();
      Object.assign(process.env, patch);
      assert.throws(assertBookingIntegrationsAllowed);
      assert.throws(realPostgresFactory);
      assert.throws(realCalendarFactory);
      assert.equal((await POST(request())).status, 503);
    }
    reset();
    assert.equal(
      (await POST(request({ ...valid, email: "unapproved@example.invalid" })))
        .status,
      403,
    );
    assert.equal(state.bookings.length, 0);
    assert.equal(state.emails.length, 0);
    reset();
    globalThis.fetch = async () => {
      throw new Error("synthetic Redis outage");
    };
    assert.equal((await POST(request())).status, 503);
    assert.equal((await availability()).status, 503);
    assert.equal(state.bookings.length, 0);
    reset();
    globalThis.fetch = async () => Response.json({ result: [100, 60000] });
    assert.equal((await POST(request())).status, 429);
    assert.equal((await availability()).status, 429);
    assert.equal(state.bookings.length, 0);
    reset();
    assert.equal(
      (await POST(request({ ...valid, date: "2030-01-05" }))).status,
      400,
    );
    assert.equal(
      (await POST(request({ ...valid, time: "09:30" }))).status,
      400,
    );
    assert.equal((await availability()).status, 200);
    reset();
    state.failDatabase = true;
    assert.equal((await POST(request())).status, 503);
    assert.equal((await availability()).status, 500);
    assert.equal(state.emails.length, 0);
    assert.equal(state.calendars.length, 0);
    reset();
    state.loseReservationAck = true;
    const uncertain = await POST(request());
    assert.equal(uncertain.status, 201);
    assert.equal((await uncertain.json()).outcome, "confirmed");
    assert.equal(state.bookings.length, 1);
    assert.equal(state.emails.length + state.calendars.length, 3);
    state.loseReservationAck = false;
    assert.equal((await POST(request())).status, 409);
    assert.equal(state.emails.length + state.calendars.length, 3);
    reset();
    let response = await POST(request());
    assert.equal(response.status, 201);
    let body = await response.json();
    assert.equal(body.outcome, "confirmed");
    assert.equal(body.success, true);
    assert.equal(state.emails.length, 2);
    assert.deepEqual(
      state.emails.map((m) => m.to),
      [valid.email, "hello@monetcore.dev"],
    );
    assert.ok(
      state.emails.every((m) => m.subject.startsWith("[STAGING TEST]")),
    );
    const event = state.calendars[0];
    assert.equal(event.sendUpdates, "none");
    assert.equal(event.requestBody.attendees, undefined);
    assert.equal(
      event.requestBody.id,
      createHash("sha256").update("monetcore-booking:mock-0").digest("hex"),
    );
    assert.match(event.requestBody.summary, /^\[STAGING TEST\]/);
    const duplicate = await POST(request());
    assert.equal(duplicate.status, 409);
    assert.equal((await duplicate.json()).outcome, "not_created");
    assert.equal(state.emails.length, 2);
    assert.equal(state.calendars.length, 1);
    for (const failure of [
      "failCalendar",
      "failEmail",
      "rejectEmail",
      "failTracking",
      "throwTracking",
    ]) {
      reset();
      state[failure] = true;
      response = await POST(request());
      body = await response.json();
      assert.equal(response.status, 202, failure);
      assert.equal(body.outcome, "reserved_incomplete", failure);
      assert.equal(body.success, false, failure);
      assert.equal(state.bookings.length, 1);
      assert.match(body.message, /Do not resubmit/);
      const sideEffects = {
        emails: state.emails.length,
        calendar: state.calendars.length,
      };
      assert.equal((await POST(request())).status, 409);
      assert.deepEqual(
        { emails: state.emails.length, calendar: state.calendars.length },
        sideEffects,
        "retry must not repeat side effects",
      );
    }
    reset();
    const racing = await Promise.all([POST(request()), POST(request())]);
    assert.deepEqual(racing.map((r) => r.status).sort(), [201, 409]);
    assert.equal(state.bookings.length, 1);
    assert.equal(state.calendars.length, 1);
    assert.equal(state.emails.length, 2);
    // Production ignores staging flags/identifiers; no production resource is contacted.
    reset();
    process.env.VERCEL_ENV = "production";
    delete process.env.STAGING_BOOKING_EXPECTED_CALENDAR_ID;
    assert.doesNotThrow(assertBookingIntegrationsAllowed);
  } finally {
    globalThis.fetch = originalFetch;
    for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
    for (const [key, value] of Object.entries(saved))
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
  }
});
