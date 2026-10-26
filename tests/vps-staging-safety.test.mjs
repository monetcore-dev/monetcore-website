import { test } from "node:test";
import assert from "node:assert/strict";
import { isReviewPreview, isStagingBookingEnabled, isStagingContactEnabled } from "../app/lib/previewSafety.ts";
import { bookingAccessError } from "../app/lib/stagingBooking.ts";
import { POST as book } from "../app/api/book/route.ts";
import { GET as availability } from "../app/api/book/availability/route.ts";
import { POST as contact } from "../app/api/contact/route.ts";

test("VPS staging blocks booking and contact APIs", async () => {
  const keys = [
    "MONETCORE_STAGING",
    "VERCEL_ENV",
    "STAGING_BOOKING_ENABLED",
    "STAGING_CONTACT_ENABLED",
    "VERCEL_GIT_COMMIT_REF"
  ];
  const previous = Object.fromEntries(
    keys.map(key => [key, process.env[key]])
  );

  try {
    process.env.MONETCORE_STAGING = "true";
    delete process.env.VERCEL_ENV;
    process.env.STAGING_BOOKING_ENABLED = "false";
    process.env.STAGING_CONTACT_ENABLED = "false";
    delete process.env.VERCEL_GIT_COMMIT_REF;

    assert.equal(isReviewPreview(), true);
    assert.equal(isStagingBookingEnabled(), false);
    assert.equal(isStagingContactEnabled(), false);
    assert.equal(bookingAccessError()?.status, 403);

    const post = path => new Request(
      `https://example.invalid${path}`,
      { method: "POST" }
    );

    assert.equal((await book(post("/api/book"))).status, 403);
    assert.equal(
      (await availability(new Request(
        "https://example.invalid/api/book/availability"
      ))).status,
      403
    );
    assert.equal((await contact(post("/api/contact"))).status, 403);
  } finally {
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
});
