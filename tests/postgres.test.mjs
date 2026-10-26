import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { pgState } from './pg-state.mjs';
registerHooks({ resolve(specifier, context, next) {
  if (specifier === 'pg') return { url: new URL('./pg-state.mjs', import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
} });
const { getPostgresPool } = await import('../app/lib/postgres.ts');
const repository = await import('../app/lib/bookingRepository.ts');
test('PostgreSQL pool/repository contract, permissions-aware SQL and cached-pool guards (no sockets)', async () => {
  const saved = { ...process.env }, error = console.error;
  try {
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, { NODE_ENV: 'production', MONETCORE_STAGING: 'true', MONETCORE_VPS_REVIEW: 'true', MONETCORE_VPS_PROXY_VERIFIED: 'true',
      STAGING_BOOKING_ENABLED: 'true', STAGING_BOOKING_EXPECTED_DATABASE: 'monetcore_db', MONETCORE_DB_PASSWORD: 'synthetic-only',
      STAGING_BOOKING_EXPECTED_CALENDAR_ID: 'synthetic-calendar', GOOGLE_CALENDAR_ID: 'synthetic-calendar',
      STAGING_BOOKING_EXPECTED_SERVICE_ACCOUNT_EMAIL: 'test@synthetic.iam.gserviceaccount.com', GOOGLE_SERVICE_ACCOUNT_EMAIL: 'test@synthetic.iam.gserviceaccount.com',
      GOOGLE_PRIVATE_KEY: 'synthetic-only', MONETCORE_EMAIL: 'hello@monetcore.dev', MONETCORE_EMAIL_PASSWORD: 'synthetic-only',
      STAGING_BOOKING_CALENDAR_EXCLUSIVE: 'true', STAGING_BOOKING_TEST_EMAILS: 'test@example.invalid',
      UPSTASH_REDIS_REST_URL: 'https://synthetic.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'synthetic-only', RATE_LIMIT_KEY_SECRET: 'synthetic-long-secret-at-least-thirty-two' });
    const pool = getPostgresPool(); assert.equal(pgState.configs.length, 1);
    assert.equal(getPostgresPool(), pool);
    const config = pgState.configs[0];
    assert.equal(config.host, '127.0.0.1'); assert.equal(config.database, 'monetcore_db');
    assert.equal(config.user, 'monetcore_app'); assert.equal(config.max, 5);
    assert.equal(config.statement_timeout, 5000); assert.equal(config.query_timeout, 7000);
    for (const key of ['VERCEL','VERCEL_ENV','VERCEL_GIT_COMMIT_REF']) {
      process.env[key] = key === 'VERCEL_ENV' ? 'preview' : 'synthetic';
      assert.throws(getPostgresPool); delete process.env[key];
    }
    process.env.STAGING_BOOKING_ENABLED = 'false'; assert.throws(getPostgresPool);
    process.env.STAGING_BOOKING_ENABLED = 'true';
    pgState.result = { rows: [{ id: 'test-id', booking_date: '2030-01-07', booking_time: '09:00' }], rowCount: 1 };
    const input = { consultation_type: 'Discovery Call - 30 minutes', booking_date: '2030-01-07', booking_time: '09:00', name: "Synthetic'); DROP TABLE bookings;--", email: 'test@example.invalid' };
    await repository.createBooking(input);
    const insert = pgState.queries.at(-1);
    assert.ok(insert.values.includes(input.name)); assert.ok(!insert.text.includes(input.name));
    assert.match(insert.text, /RETURNING/); assert.match(insert.text, /Africa\/Lagos/);
    pgState.result = { rows: [], rowCount: 0 }; await assert.rejects(repository.createBooking(input));
    pgState.result = { rows: [{ booking_time: '09:00' }], rowCount: 1 };
    assert.deepEqual(await repository.getBookedTimes('2030-01-07'), ['09:00']);
    assert.match(pgState.queries.at(-1).text, /status <> 'cancelled'/);
    await repository.updateBookingTracking('test-id', { confirmation_sent_at: '2030-01-01T00:00:00Z', status: 'cancelled' });
    assert.doesNotMatch(pgState.queries.at(-1).text, /SET status/);
    const count = pgState.queries.length; await repository.updateBookingTracking('test-id', {});
    assert.equal(pgState.queries.length, count);
    pgState.result = { rows: [], rowCount: 0 }; await assert.rejects(repository.updateBookingTracking('test-id', { updated_at: '2030-01-01T00:00:00Z' }));
    pgState.error = Object.assign(new Error('synthetic internal details'), { code: '08006' });
    await assert.rejects(repository.getBookedTimes('2030-01-07'));
    const logs = []; console.error = (...args) => logs.push(args); pgState.idleError(pgState.error);
    assert.deepEqual(logs, [['PostgreSQL idle connection unavailable.']]);
  } finally {
    console.error = error;
    for (const key of Object.keys(process.env)) delete process.env[key]; Object.assign(process.env, saved);
  }
});
