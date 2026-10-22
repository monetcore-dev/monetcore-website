import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { isReviewPreview, isStagingContactEnabled, isStagingBookingEnabled } from '../app/lib/previewSafety.ts';
import { isControlledTestEnabled } from '../app/lib/assistant/access.ts';
import { POST as contact } from '../app/api/contact/route.ts';
import { POST as book } from '../app/api/book/route.ts';
const { validate } = createRequire(import.meta.url)('../scripts/cpanel/start.cjs');
test('cPanel adapter rejects fabricated Vercel context and integration activation', () => {
  assert.doesNotThrow(() => validate({}));
  assert.doesNotThrow(() => validate({ MONETCORE_DEPLOYMENT_ENV: 'production', PORT: '3000' }));
  for (const patch of [{ VERCEL: '1' }, { VERCEL_ENV: 'production' }, { AI_ASSISTANT_ENABLED: 'true' },
    { AI_OWNER_TEST_ENABLED: 'true' }, { STAGING_AI_ASSISTANT_ENABLED: 'true' }, { STAGING_BOOKING_ENABLED: 'true' },
    { STAGING_CONTACT_ENABLED: 'true' }, { MONETCORE_DEPLOYMENT_ENV: 'invalid' }, { PORT: '0' }, { PORT: '3000junk' }])
    assert.throws(() => validate(patch));
});
test('portable review mode blocks contact/booking without external calls and cannot enable inference', async () => {
  const saved = { ...process.env }, fetch = global.fetch;
  try {
    for (const key of Object.keys(process.env)) delete process.env[key];
    process.env.MONETCORE_DEPLOYMENT_ENV = 'review';
    global.fetch = () => { throw new Error('External request not allowed'); };
    assert.equal(isReviewPreview(), true); assert.equal(isStagingContactEnabled(), false);
    assert.equal(isStagingBookingEnabled(), false); assert.equal(isControlledTestEnabled(), false);
    const request = () => new Request('https://review.example.invalid/api/contact', { method: 'POST' });
    assert.equal((await contact(request())).status, 403);
    assert.equal((await book(request())).status, 403);
  } finally {
    global.fetch = fetch;
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
