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

test('Vercel indicators and incomplete VPS authorization cannot be bypassed by staging flags', async () => {
  const saved = { ...process.env };
  const request = path => new Request(`https://review.monetcore.dev${path}`, { method: 'POST' });
  try {
    for (const patch of [
      { VERCEL_ENV: 'preview' }, { VERCEL: '1' }, { VERCEL_GIT_COMMIT_REF: 'feature/monetcore-vps-staging' },
      { MONETCORE_VPS_PROXY_VERIFIED: undefined }, { MONETCORE_STAGING: undefined }, { MONETCORE_VPS_REVIEW: undefined }, { NODE_ENV: 'development' },
    ]) {
      for (const key of Object.keys(process.env)) delete process.env[key];
      Object.assign(process.env, { MONETCORE_STAGING: 'true', MONETCORE_VPS_REVIEW: 'true', MONETCORE_VPS_PROXY_VERIFIED: 'true', NODE_ENV: 'production',
        STAGING_BOOKING_ENABLED: 'true', STAGING_CONTACT_ENABLED: 'true' });
      for (const [key,value] of Object.entries(patch)) if (value === undefined) delete process.env[key]; else process.env[key]=value;
      assert.equal(isReviewPreview(), true); assert.equal(isStagingBookingEnabled(), false);
      assert.equal(isStagingContactEnabled(), false);
      assert.equal((await book(request('/api/book'))).status,403);
      assert.equal((await contact(request('/api/contact'))).status,403);
      assert.equal((await availability(new Request('https://review.monetcore.dev/api/book/availability?date=2030-01-07'))).status,403);
    }
  } finally {
    for (const key of Object.keys(process.env)) delete process.env[key]; Object.assign(process.env,saved);
  }
});

test('verified VPS proxy origin handles internal URLs without accepting spoofed or missing origins', async () => {
  const saved = { ...process.env };
  const { readSubmission } = await import('../app/lib/submissionSafety.ts');
  try {
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env,{ MONETCORE_STAGING:'true', MONETCORE_VPS_REVIEW:'true', MONETCORE_VPS_PROXY_VERIFIED:'true', NODE_ENV:'production', STAGING_BOOKING_ENABLED:'true' });
    const make = patch => new Request('http://127.0.0.1:3000/api/book',{method:'POST',headers:{
      host:'review.monetcore.dev', 'x-forwarded-proto':'https', origin:'https://review.monetcore.dev', 'content-type':'application/json', ...patch,
    },body:JSON.stringify({synthetic:true})});
    assert.deepEqual(await readSubmission(make()),{synthetic:true});
    for(const patch of [{origin:''},{origin:'https://evil.invalid'},{host:'evil.invalid'},
      {'x-forwarded-proto':'http'},{'x-forwarded-proto':'https,http'},{'x-forwarded-host':'evil.invalid'}])
      assert.equal((await readSubmission(make(patch))).status,403);
    delete process.env.MONETCORE_VPS_PROXY_VERIFIED;
    assert.equal((await readSubmission(make())).status,403);
  } finally {
    for (const key of Object.keys(process.env)) delete process.env[key];Object.assign(process.env,saved);
  }
});
