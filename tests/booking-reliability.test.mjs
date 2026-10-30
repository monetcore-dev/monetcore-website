import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { bookingRecoveryPlan } from '../app/lib/bookingRecovery.ts';
import { POST } from '../app/api/book/route.ts';
import { state } from './integrations.mjs';
const input = { consultationType: 'Discovery Call - 30 minutes', date: '2030-01-07', time: '10:00', name: 'Synthetic reliability test', email: 'tester@example.invalid', message: 'Synthetic only', startedAt: Date.now() - 10000 };
let sequence = 0;
const request = (key, patch = {}) => new Request('https://monetcore.dev/api/book', { method: 'POST', headers: { origin: 'https://monetcore.dev', 'content-type': 'application/json', 'x-vercel-forwarded-for': `synthetic-${++sequence}` }, body: JSON.stringify({ ...input, ...patch, idempotencyKey: key }) });
function reset() {
    for (const key of ['bookings', 'requests', 'emails', 'updates', 'transports', 'calendars'])
        state[key].length = 0;
    for (const key of ['failDatabase', 'failCalendar', 'failEmail', 'failTracking', 'throwTracking', 'rejectEmail', 'failLookup', 'failJournal', 'loseReservationAck', 'loseClaimAck'])
        state[key] = false;
    process.env.MONETCORE_EMAIL = 'sink@example.invalid';
    process.env.MONETCORE_EMAIL_PASSWORD = 'synthetic-only';
}
test('production booking durable identity and honest outcomes (synthetic integrations only)', async (t) => {
    const saved = { ...process.env }, fetch = globalThis.fetch;
    try {
        for (const key of Object.keys(process.env))
            delete process.env[key];
        Object.assign(process.env, { NODE_ENV: 'production', VERCEL_ENV: 'production', VERCEL: '1' });
        globalThis.fetch = async () => { throw Error('No network permitted'); };
        await t.test('confirmed only after required receipts; stable event identity; no invitations', async () => {
            reset();
            const key = randomUUID(), r = await POST(request(key)), b = await r.json();
            assert.equal(r.status, 201);
            assert.equal(b.outcome, 'confirmed');
            assert.equal(b.success, true);
            assert.ok(['calendar', 'customer', 'admin'].every(op => state.requests[0][op + '_state'] === 'accepted'));
            assert.equal(state.calendars[0].requestBody.id, createHash('sha256').update('monetcore-booking:' + b.booking.id).digest('hex'));
            assert.equal(state.calendars[0].requestBody.attendees, undefined);
            assert.equal(state.calendars[0].sendUpdates, 'none');
            assert.doesNotMatch(state.emails[0].subject, /is confirmed/i);
            assert.match(state.emails[0].messageId, /customer@monetcore.dev>$/);
            const before = [state.bookings.length, state.calendars.length, state.emails.length];
            assert.equal((await POST(request(key, { startedAt: Date.now() - 8000 }))).status, 201);
            assert.deepEqual([state.bookings.length, state.calendars.length, state.emails.length], before);
            const conflict = await POST(request(key, { time: '11:00' }));
            assert.equal(conflict.status, 409);
            assert.equal((await conflict.json()).code, 'IDEMPOTENCY_CONFLICT');
        });
        await t.test('same-key concurrent calls admit one reservation and one set of side effects', async () => {
            reset();
            const key = randomUUID();
            const result = await Promise.all(Array.from({ length: 8 }, () => POST(request(key))));
            assert.ok(result.every(r => [201, 202].includes(r.status)));
            assert.equal(state.bookings.length, 1);
            assert.equal(state.calendars.length, 1);
            assert.equal(state.emails.length, 2);
        });
        await t.test('different request keys competing for one slot preserve the slot constraint', async () => {
            reset();
            const result = await Promise.all(Array.from({ length: 8 }, () => POST(request(randomUUID()))));
            assert.equal(result.filter(r => r.status === 201).length, 1);
            assert.equal(result.filter(r => r.status === 409).length, 7);
            assert.equal(state.requests.length, 1);
        });
        for (const flag of ['failCalendar', 'failEmail', 'failTracking', 'throwTracking', 'rejectEmail'])
            await t.test(flag + ' stays incomplete and replay never resends uncertain operations', async () => {
                reset();
                state[flag] = true;
                const key = randomUUID(), r = await POST(request(key)), b = await r.json();
                assert.equal(r.status, 202);
                assert.equal(b.success, false);
                assert.equal(b.outcome, 'reserved_incomplete');
                assert.equal(b.fulfillment, 'reconciliation_required');
                assert.equal(bookingRecoveryPlan(state.requests[0]).fulfillment, 'reconciliation_required');
                const before = [state.bookings.length, state.calendars.length, state.emails.length];
                state[flag] = false;
                assert.equal((await POST(request(key))).status, 202);
                assert.deepEqual([state.bookings.length, state.calendars.length, state.emails.length], before);
            });
        await t.test('lost COMMIT acknowledgement recovers durable identity without another INSERT', async () => {
            reset();
            state.loseReservationAck = true;
            const r = await POST(request(randomUUID()));
            assert.equal(r.status, 201);
            assert.equal(state.bookings.length, 1);
            assert.equal(state.emails.length, 2);
        });
        await t.test('timeout/transport loss plus unavailable readback returns unknown and safe same-key replay', async () => {
            for (const code of ['08006', 'ETIMEDOUT']) {
                reset();
                state.ackErrorCode = code;
                state.loseReservationAck = true;
                state.failLookup = true;
                const key = randomUUID(), r = await POST(request(key));
                assert.equal(r.status, 503);
                assert.equal((await r.json()).outcome, 'unknown');
                assert.equal(state.bookings.length, 1);
                assert.equal(state.emails.length + state.calendars.length, 0);
                state.loseReservationAck = state.failLookup = false;
                assert.equal((await POST(request(key))).status, 201);
                assert.equal(state.bookings.length, 1);
                assert.equal(state.calendars.length, 1);
                assert.equal(state.emails.length, 2);
            }
        });
        await t.test('missing SMTP leaves never-attempted operations pending and can resume once', async () => {
            reset();
            delete process.env.MONETCORE_EMAIL_PASSWORD;
            const key = randomUUID(), r = await POST(request(key));
            assert.equal(r.status, 202);
            assert.equal((await r.json()).fulfillment, 'pending_external_operations');
            assert.equal(state.emails.length, 0);
            process.env.MONETCORE_EMAIL_PASSWORD = 'synthetic-only';
            assert.equal((await POST(request(key))).status, 201);
            assert.equal(state.calendars.length, 1);
            assert.equal(state.emails.length, 2);
        });
        await t.test('lost durable operation-claim acknowledgement never calls a provider', async () => {
            reset();
            state.loseClaimAck = true;
            const key = randomUUID(), r = await POST(request(key));
            assert.equal(r.status, 202);
            assert.equal((await r.json()).fulfillment, 'reconciliation_required');
            assert.equal(state.emails.length + state.calendars.length, 0);
            state.loseClaimAck = false;
            assert.equal((await POST(request(key))).status, 202);
            assert.equal(state.emails.length + state.calendars.length, 0);
        });
        await t.test('invalid identity rejected; unavailable persistence is never falsely declared absent', async () => {
            reset();
            assert.equal((await POST(request('bad'))).status, 400);
            assert.equal(state.bookings.length, 0);
            state.failDatabase = true;
            const r = await POST(request(randomUUID()));
            assert.equal(r.status, 503);
            assert.equal((await r.json()).outcome, 'unknown');
            assert.equal(state.emails.length + state.calendars.length, 0);
        });
    }
    finally {
        globalThis.fetch = fetch;
        for (const key of Object.keys(process.env))
            delete process.env[key];
        Object.assign(process.env, saved);
    }
});
