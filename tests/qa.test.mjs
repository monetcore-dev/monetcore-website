import { randomUUID } from "node:crypto";
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  readSubmission,
  validateSubmission,
  isValidDate,
  rateLimit,
} from "../app/lib/submissionSafety.ts";
import {
  recommendProject,
  plannerChallenges,
  plannerCapabilities,
  enquiryBudgets,
  solutionOptions,
} from "../app/config/projectPlanner.ts";
import { isReviewPreview } from "../app/lib/previewSafety.ts";
import robots from "../app/robots.ts";
import sitemap from "../app/sitemap.ts";
import nextConfig from "../next.config.ts";
import { state } from "./integrations.mjs";
import { POST as contact } from "../app/api/contact/route.ts";
import { POST as booking } from "../app/api/book/route.ts";
import { GET as availability } from "../app/api/book/availability/route.ts";
const now = 2_000_000_000_000;
const base = {
  name: "Test Person",
  email: "test@example.invalid",
  message: "Test project",
  startedAt: now - 5000,
};
let sequence = 0;
function request(data, path = "contact", extras = {}) {
  const host =
    process.env.MONETCORE_VPS_REVIEW === "true" && !process.env.VERCEL_ENV
      ? "review.monetcore.dev"
      : "review.example";
  return new Request(`https://${host}/api/${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: `https://${host}`,
      "x-forwarded-for": `test-${++sequence}`,
      ...extras,
    },
    body: typeof data === "string" ? data : JSON.stringify(path === "book" && data && typeof data === "object" ? { ...data, idempotencyKey: data.idempotencyKey ?? randomUUID() } : data),
  });
}
test("bounded JSON, content type, malformed payloads and same-origin validation", async () => {
  for (const body of ["null", "[]", "broken"])
    assert.equal((await readSubmission(request(body))).status, 400);
  assert.equal(
    (
      await readSubmission(
        request(base, "contact", { origin: "https://other.invalid" }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await readSubmission(
        request(base, "contact", { "content-type": "text/plain" }),
      )
    ).status,
    415,
  );
  assert.equal(
    (await readSubmission(request({ message: "x".repeat(33000) }))).status,
    413,
  );
  assert.deepEqual(await readSubmission(request(base)), base);
});
test("server validation rejects whitespace, malformed types, email header injection, timing and impossible dates", () => {
  assert.equal(validateSubmission(base, "contact", now), null);
  for (const patch of [
    { name: " " },
    { message: " " },
    { company: {} },
    { email: "a@b.test\r\nBcc:x@y.test" },
    { email: "not-an-email" },
    { name: "a\nb" },
    { startedAt: "invalid" },
    { startedAt: now + 1 },
    { startedAt: now - 1 },
    { message: "x".repeat(5001) },
  ])
    assert.ok(validateSubmission({ ...base, ...patch }, "contact", now));
  for (const date of ["2027-02-29", "2026-02-31", "2026-13-01", "bad"])
    assert.equal(isValidDate(date), false);
  assert.equal(isValidDate("2028-02-29"), true);
  assert.ok(
    validateSubmission(
      {
        ...base,
        consultationType: "Made up - 180 minutes",
        date: "2027-01-04",
      },
      "booking",
      now,
    ),
  );
});
test("bounded instance limiter rejects bursts and resets expired buckets", () => {
  const req = request(base);
  assert.equal(rateLimit(req, "unit", 2, 1000, now), null);
  assert.equal(rateLimit(req, "unit", 2, 1000, now), null);
  const blocked = rateLimit(req, "unit", 2, 1000, now);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("retry-after"), "1");
  assert.equal(rateLimit(req, "unit", 2, 1000, now + 1001), null);
});
test("planner exhaustively preserves explicit goals and follows documented unsure priorities", () => {
  let count = 0;
  for (const goal of [...solutionOptions.map((x) => x.id), "unsure"])
    for (const challenge of plannerChallenges)
      for (const budget of enquiryBudgets)
        for (let mask = 0; mask < 64; mask++) {
          const capabilities = plannerCapabilities
            .filter((_, i) => mask & (1 << i))
            .map((x) => x.id);
          const result = recommendProject({
            goal,
            challenge: challenge.id,
            budget: budget.value,
            capabilities,
          });
          const expected =
            goal !== "unsure"
              ? goal
              : challenge.id === "disconnected" ||
                  capabilities.includes("connections")
                ? "integrations"
                : challenge.id === "responses" ||
                    capabilities.includes("ai-responses")
                  ? "ai"
                  : challenge.id === "visibility" ||
                      capabilities.includes("website")
                    ? "websites"
                    : "software";
          assert.equal(result.solution.id, expected);
          assert.ok(result.message.includes(challenge.label));
          assert.ok(result.message.includes(budget.value));
          assert.match(result.message, /not a quotation/);
          count++;
        }
  assert.equal(count, 9600);
});
test("production SEO allows public routes; preview uses three independent indexing barriers", async () => {
  process.env.VERCEL_ENV = "production";
  assert.equal(isReviewPreview(), false);
  assert.equal(robots().rules.allow, "/");
  assert.equal(sitemap().length, 17);
  assert.equal(new Set(sitemap().map((item) => item.url)).size, 17);
  assert.ok(!sitemap().some((item) => item.url.endsWith("/assistant")));
  assert.ok(sitemap().every((x) => x.url.startsWith("https://monetcore.dev")));
  assert.ok(
    !(await nextConfig.headers())[0].headers.some(
      (x) => x.key === "X-Robots-Tag",
    ),
  );
  process.env.VERCEL_ENV = "preview";
  assert.equal(robots().rules.disallow, "/");
  assert.deepEqual(sitemap(), []);
  assert.ok(
    (await nextConfig.headers())[0].headers.some(
      (x) => x.key === "X-Robots-Tag" && x.value.includes("noindex"),
    ),
  );
});
test("preview rejects valid/invalid submissions before touching integrations", async () => {
  process.env.VERCEL_ENV = "preview";
  for (const payload of [base, null, { website: "bot" }]) {
    assert.equal((await contact(request(payload))).status, 403);
    assert.equal((await booking(request(payload, "book"))).status, 403);
  }
  assert.equal(
    (
      await availability(
        new Request(
          "https://review.example/api/book/availability?date=2030-01-07",
        ),
      )
    ).status,
    403,
  );
  assert.equal(
    state.emails.length + state.bookings.length + state.calendars.length,
    0,
  );
});
test("contact validation, quotation consent and success use mocked SMTP only", async () => {
  process.env.VERCEL_ENV = "production";
  process.env.MONETCORE_EMAIL = "mock@example.invalid";
  process.env.MONETCORE_EMAIL_PASSWORD = "mock-only";
  const valid = { ...base, startedAt: Date.now() - 5000 };
  assert.equal(
    (await contact(request({ ...valid, message: " " }))).status,
    400,
  );
  assert.equal(
    (await contact(request({ ...valid, packageId: "starter", consent: false })))
      .status,
    400,
  );
  assert.equal(
    (await contact(request({ ...valid, packageId: "unknown", consent: true })))
      .status,
    400,
  );
  assert.equal(
    (await contact(request({ ...valid, packageId: "starter", consent: true })))
      .status,
    200,
  );
  assert.match(state.emails.at(-1).text, /₦99,000/);
  assert.equal(state.emails.at(-1).to, "mock@example.invalid");
  state.failEmail = true;
  assert.equal((await contact(request(valid))).status, 500);
  state.failEmail = false;
});
test("booking, unique-slot conflict, unavailable date and partial integration failure use mocks only", async () => {
  const valid = {
    ...base,
    startedAt: Date.now() - 5000,
    consultationType: "Discovery Call - 30 minutes",
    date: "2030-01-07",
    time: "10:00",
    message: '<img src=x onerror="alert(1)"> & literal project text',
  };
  assert.equal(
    (await booking(request({ ...valid, date: "2030-02-31" }, "book"))).status,
    400,
  );
  assert.equal(
    (await booking(request({ ...valid, date: "2030-01-06" }, "book"))).status,
    400,
  );
  const success = await booking(request(valid, "book"));
  assert.equal(success.status, 201);
  assert.equal((await success.json()).calendar.eventCreated, true);
  assert.ok(state.calendars.at(-1).requestBody.description.includes("&lt;img"));
  assert.ok(!state.calendars.at(-1).requestBody.description.includes("<img"));
  assert.equal(state.emails.at(-1).html, undefined);
  assert.equal((await booking(request(valid, "book"))).status, 409);
  state.failCalendar = true;
  state.failEmail = true;
  const partial = await booking(request({ ...valid, time: "11:00" }, "book"));
  assert.equal(partial.status, 202);
  const result = await partial.json();
  assert.equal(result.calendar.eventCreated, false);
  assert.equal(result.email.customerConfirmationSent, false);
  state.failCalendar = false;
  state.failEmail = false;
  const response = await availability(
    new Request("https://review.example/api/book/availability?date=2030-01-07"),
  );
  assert.equal(response.status, 200);
  assert.deepEqual((await response.json()).bookedTimes, ["09:00"]);
  assert.equal(
    (
      await availability(
        new Request("https://review.example/api/book/availability?date=bad"),
      )
    ).status,
    400,
  );
});

test("shared limiter uses an atomic expiring pseudonymous counter and fails closed", async () => {
  const { enforceRateLimit } = await import("../app/lib/submissionSafety.ts");
  const names = [
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "RATE_LIMIT_KEY_SECRET",
    "RATE_LIMIT_REQUIRED",
    "VERCEL",
    "VERCEL_ENV",
  ];
  const saved = Object.fromEntries(
    names.map((name) => [name, process.env[name]]),
  );
  const originalFetch = globalThis.fetch;
  try {
    for (const name of names) delete process.env[name];
    assert.equal(await enforceRateLimit(request(base), "fallback"), null);
    process.env.RATE_LIMIT_REQUIRED = "true";
    assert.equal(
      (await enforceRateLimit(request(base), "required")).status,
      503,
    );
    process.env.UPSTASH_REDIS_REST_URL = "https://staging-example.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "mock-token";
    process.env.RATE_LIMIT_KEY_SECRET =
      "mock-secret-only-for-tests-32-characters";
    process.env.VERCEL = "1";
    let calls = [];
    let result = [1, 60000];
    globalThis.fetch = async (url, options) => {
      calls.push({ url, options });
      return Response.json({ result });
    };
    const req = request(base, "contact", {
      "x-vercel-forwarded-for": "192.0.2.42",
      "x-forwarded-for": "spoofed",
    });
    assert.equal(await enforceRateLimit(req, "contact", 2, 60000), null);
    const command = JSON.parse(calls[0].options.body);
    const firstKey = command[3];
    await enforceRateLimit(
      request(base, "contact", {
        "x-vercel-forwarded-for": "192.0.2.42",
        "x-forwarded-for": "changed-spoof",
      }),
      "contact",
      2,
      60000,
    );
    assert.equal(JSON.parse(calls[1].options.body)[3], firstKey);
    calls = [calls[0]];
    assert.equal(command[0], "EVAL");
    assert.match(command[1], /PEXPIRE/);
    assert.match(command[3], /^monetcore:v1:contact:[a-f0-9]{64}$/);
    assert.ok(!calls[0].options.body.includes("192.0.2.42"));
    assert.equal(calls[0].options.redirect, "error");
    result = [3, 2501];
    const denied = await enforceRateLimit(req, "contact", 2, 60000);
    assert.equal(denied.status, 429);
    assert.equal(denied.headers.get("Retry-After"), "3");
    await enforceRateLimit(req, "booking", 2, 60000);
    assert.notEqual(
      JSON.parse(calls[1].options.body)[3],
      JSON.parse(calls[2].options.body)[3],
    );
    for (const invalid of [[1, -1], [1, 60001], ["1", 1000], null]) {
      result = invalid;
      assert.equal(
        (await enforceRateLimit(req, "contact", 2, 60000)).status,
        503,
      );
    }
    globalThis.fetch = async () => {
      throw new Error("mock timeout");
    };
    assert.equal((await enforceRateLimit(req, "contact")).status, 503);
    process.env.UPSTASH_REDIS_REST_URL = "https://untrusted.invalid";
    globalThis.fetch = async () => {
      assert.fail("invalid endpoint must not receive a token");
    };
    assert.equal((await enforceRateLimit(req, "contact")).status, 503);
    process.env.VERCEL_ENV = "preview";
    assert.equal((await contact(request(base))).status, 403);
  } finally {
    globalThis.fetch = originalFetch;
    for (const name of names) {
      if (saved[name] === undefined) delete process.env[name];
      else process.env[name] = saved[name];
    }
  }
});

test("SMTP transports enforce bounded waits and disable file/URL attachment reads", () => {
  assert.ok(state.transports.length >= 2);
  for (const options of state.transports) {
    assert.equal(options.host, "mail.privateemail.com");
    assert.equal(options.port, 465);
    assert.equal(options.secure, true);
    assert.equal(options.disableFileAccess, true);
    assert.equal(options.disableUrlAccess, true);
    assert.equal(options.connectionTimeout, 10000);
    assert.equal(options.greetingTimeout, 10000);
    assert.equal(options.socketTimeout, 20000);
    assert.equal(options.tls?.rejectUnauthorized, undefined);
  }
});

test("booking keeps Calendar id internal and persists all tracking fields", async () => {
  process.env.VERCEL_ENV = "development";
  const data = {
    ...base,
    startedAt: Date.now() - 5000,
    consultationType: "Discovery Call - 30 minutes",
    date: "2030-01-08",
    time: "09:00",
  };
  const response = await booking(request(data, "book"));
  assert.equal(response.status, 201);
  const result = await response.json();
  assert.deepEqual(result.calendar, { eventCreated: true });
  assert.equal(JSON.stringify(result).includes("mock-event"), false);
  const record = state.bookings.at(-1);
  assert.match(record.google_calendar_event_id, /^[0-9a-f]{64}$/);
  for (const field of [
    "google_calendar_event_created_at",
    "confirmation_sent_at",
    "admin_notification_sent_at",
  ])
    assert.ok(Number.isFinite(Date.parse(record[field])));
});

test("returned and thrown tracking errors are sanitized and never erase or repeat accepted side effects", async () => {
  const originalError = console.error;
  try {
    for (const [index, flag] of ["failTracking", "throwTracking"].entries()) {
      const logs = [];
      console.error = (...args) => logs.push(args);
      state[flag] = true;
      const before = {
        bookings: state.bookings.length,
        emails: state.emails.length,
        calendars: state.calendars.length,
        updates: state.updates.length,
      };
      const response = await booking(
        request(
          {
            ...base,
            startedAt: Date.now() - 5000,
            consultationType: "Discovery Call - 30 minutes",
            date: "2030-01-08",
            time: `${10 + index}:00`,
          },
          "book",
        ),
      );
      assert.equal(response.status, 202);
      const result = await response.json();
      assert.equal(result.outcome, "reserved_incomplete");
      assert.equal(result.success, false);
      assert.deepEqual(result.calendar, { eventCreated: true });
      assert.equal(result.email.customerConfirmationSent, true);
      assert.equal(result.email.adminNotificationSent, true);
      assert.equal(state.bookings.length, before.bookings + 1);
      assert.equal(state.bookings.at(-1).status, "confirmed");
      assert.equal(state.emails.length, before.emails + 2);
      assert.equal(state.calendars.length, before.calendars + 1);
      assert.equal(state.updates.length, before.updates + 3);
      assert.deepEqual(
        logs,
        ["calendar", "customer_notification", "admin_notification"].map(
          (operation) => [
            "Booking tracking update failed.",
            {
              operation,
              failure: "request_failed",
            },
          ],
        ),
      );
      assert.doesNotMatch(
        JSON.stringify(logs),
        /PRIVATE|Test Person|test@example|mock-event|password/i,
      );
      state[flag] = false;
    }
  } finally {
    state.failTracking = state.throwTracking = false;
    console.error = originalError;
  }
});

test("slot conflict gives selection guidance without repeating Calendar or notification calls", async () => {
  const data = {
    ...base,
    startedAt: Date.now() - 5000,
    consultationType: "Discovery Call - 30 minutes",
    date: "2030-01-08",
    time: "12:00",
  };
  assert.equal((await booking(request(data, "book"))).status, 201);
  const before = [
    state.bookings.length,
    state.calendars.length,
    state.emails.length,
  ];
  const response = await booking(request(data, "book"));
  assert.equal(response.status, 409);
  assert.match(
    (await response.json()).error,
    /selected time is no longer available.*choose another available slot/i,
  );
  assert.deepEqual(
    [state.bookings.length, state.calendars.length, state.emails.length],
    before,
  );
});

test("staging contact opt-in is VPS-only, recipient-locked and requires SMTP acceptance; booking stays blocked", async () => {
  const keys = [
    "VERCEL_ENV",
    "VERCEL",
    "VERCEL_GIT_COMMIT_REF",
    "MONETCORE_STAGING",
    "MONETCORE_VPS_REVIEW",
    "MONETCORE_VPS_PROXY_VERIFIED",
    "NODE_ENV",
    "STAGING_CONTACT_ENABLED",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
    "RATE_LIMIT_KEY_SECRET",
    "MONETCORE_EMAIL",
    "MONETCORE_EMAIL_PASSWORD",
  ];
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  const initial = state.emails.length;
  const originalFetch = globalThis.fetch;
  const valid = {
    ...base,
    startedAt: Date.now() - 5000,
    company: "Synthetic Test Ltd",
    service: "AI Automation",
    budget: "₦100,000 - ₦200,000",
    message: "Synthetic AI Receptionist enquiry; planner outline preserved.",
  };
  try {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_GIT_COMMIT_REF = "feature/monetcore-stage1-websites";
    process.env.MONETCORE_STAGING = "true";
    process.env.MONETCORE_VPS_REVIEW = "true";
    process.env.MONETCORE_VPS_PROXY_VERIFIED = "true";
    process.env.STAGING_CONTACT_ENABLED = "true";
    process.env.MONETCORE_EMAIL = "hello@monetcore.dev";
    process.env.MONETCORE_EMAIL_PASSWORD = "mock-only";

    // Vercel previews remain blocked, even with activation flags.
    assert.equal((await contact(request(valid))).status, 403);

    globalThis.fetch = async () => Response.json({ result: [1, 600000] });
    process.env.UPSTASH_REDIS_REST_URL = "https://synthetic.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "synthetic-only";
    process.env.RATE_LIMIT_KEY_SECRET =
      "synthetic-long-test-key-over-thirty-two";
    // An authorized VPS review requires explicit configuration.
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL;
    delete process.env.VERCEL_GIT_COMMIT_REF;
    process.env.NODE_ENV = "production";

    delete process.env.STAGING_CONTACT_ENABLED;
    assert.equal((await contact(request(valid))).status, 403);

    process.env.STAGING_CONTACT_ENABLED = "true";
    process.env.MONETCORE_VPS_REVIEW = "false";
    assert.equal((await contact(request(valid))).status, 403);

    process.env.MONETCORE_VPS_REVIEW = "true";
    process.env.MONETCORE_VPS_PROXY_VERIFIED = "true";
    globalThis.fetch = async () => {
      throw new Error("synthetic Redis outage");
    };
    assert.equal((await contact(request(valid))).status, 503);
    assert.equal(state.emails.length, initial);
    globalThis.fetch = async () => Response.json({ result: [11, 600000] });
    assert.equal((await contact(request(valid))).status, 429);
    assert.equal(state.emails.length, initial);
    globalThis.fetch = async () => Response.json({ result: [1, 600000] });
    process.env.MONETCORE_EMAIL = "unapproved@example.invalid";
    assert.equal((await contact(request(valid))).status, 503);
    assert.equal(state.emails.length, initial);
    process.env.MONETCORE_EMAIL = "hello@monetcore.dev";
    assert.equal(
      (await contact(request({ ...valid, email: "invalid" }))).status,
      400,
    );
    assert.equal(
      (
        await contact(
          request(valid, "contact", { origin: "https://other.invalid" }),
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await contact(
          request({
            ...valid,
            packageId: "starter",
            consent: true,
            to: "unapproved@example.invalid",
          }),
        )
      ).status,
      200,
    );
    const mail = state.emails.at(-1);
    assert.equal(mail.to, "hello@monetcore.dev");
    assert.match(mail.subject, /^\[STAGING TEST\]/);
    for (const detail of [
      valid.name,
      valid.email,
      valid.company,
      valid.service,
      valid.budget,
      valid.message,
      "Smart Starter",
    ])
      assert.ok(mail.text.includes(detail));
    state.rejectEmail = true;
    assert.equal((await contact(request(valid))).status, 500);
    state.rejectEmail = false;
    state.failEmail = true;
    assert.equal((await contact(request(valid))).status, 500);
    state.failEmail = false;
    assert.equal((await booking(request(valid, "book"))).status, 403);
    assert.equal(
      (
        await availability(
          new Request(
            "https://review.example/api/book/availability?date=2099-01-05",
          ),
        )
      ).status,
      403,
    );
  } finally {
    globalThis.fetch = originalFetch;
    state.rejectEmail = false;
    state.failEmail = false;
    for (const key of keys)
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
  }
});
