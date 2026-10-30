// Explicit opt-in: disposable Unix socket only; NEVER accepts a database URL.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { registerHooks } from 'node:module';
import { randomUUID, createHash } from 'node:crypto';
const socket = process.env.MONETCORE_TEST_PG_SOCKET;
const allowedRoot=path.resolve(fileURLToPath(new URL('../node_modules/.local-pg/',import.meta.url)));
assert.ok(socket && path.resolve(socket).startsWith(allowedRoot+path.sep));
assert.equal(fs.realpathSync(socket),path.resolve(socket));
assert.ok(fs.statSync(socket + '/.s.PGSQL.5432').isSocket());
const pg = await import('pg');
const pool = new pg.Pool({ host: socket, user: 'monetcore_app', database: 'monetcore_db', max: 10, connectionTimeoutMillis: 3000, query_timeout: 7000 });
let loseCommit = false, failBeforeCommit = false;
const wrapper = { query: pool.query.bind(pool), async connect() { const c = await pool.connect(); return { release: c.release.bind(c), async query(text, values) { const result = await c.query(text, values); if (text === 'COMMIT' && loseCommit) {
            loseCommit = false;
            throw Object.assign(new Error('Synthetic lost acknowledgement'), { code: 'ETIMEDOUT' });
        } if (text.startsWith('INSERT INTO public.booking_requests') && failBeforeCommit) {
            failBeforeCommit = false;
            throw new Error('Synthetic failure before commit');
        } return result; } }; } };
globalThis.__monetcoreTestPool = wrapper;
registerHooks({ resolve(s, c, next) { if (s === './postgres' && c.parentURL?.endsWith('/app/lib/bookingRepository.ts'))
        return { url: 'data:text/javascript,export function getPostgresPool(){return globalThis.__monetcoreTestPool}', shortCircuit: true }; if (s === 'server-only')
        return { url: 'data:text/javascript,export{}', shortCircuit: true }; try {
        return next(s, c);
    }
    catch (e) {
        if (s.startsWith('.') && !/\.[a-z]+$/i.test(s))
            return next(s + '.ts', c);
        throw e;
    } } });
const repo = await import('../app/lib/bookingRepository.ts');
const hash = createHash('sha256').update('synthetic test intent').digest('hex');
const input = { consultation_type: 'Discovery Call - 30 minutes', booking_date: '2030-01-07', booking_time: '10:00', name: 'Synthetic only', email: 'synthetic@example.invalid' };
let assertions = 0;
try {
    const role = await pool.query('SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user');
    assert.equal(role.rows[0].rolsuper, false);
    assert.equal(role.rows[0].rolbypassrls, false);
    assertions++;
    await assert.rejects(repo.reserveBooking({...input,booking_date:'2000-01-03'},randomUUID(),hash),e=>e.code==='BOOKING_INELIGIBLE');assertions++;
    const key = randomUUID();
    const records = await Promise.all(Array.from({ length: 8 }, () => repo.reserveBooking(input, key, hash)));
    assert.equal(new Set(records.map(r => r.id)).size, 1);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM public.bookings')).rows[0].n, 1);
    assertions++;
    const claims = await Promise.all(Array.from({ length: 8 }, () => repo.claimBookingOperation(key, hash, 'calendar')));
    assert.equal(claims.filter(Boolean).length, 1);
    await repo.finishBookingOperation(key, hash, 'calendar', true);
    assert.equal((await repo.getBookingRequest(key, hash)).calendar_state, 'accepted');
    assertions++;
    await assert.rejects(repo.reserveBooking({ ...input, booking_time: '11:00' }, key, 'b'.repeat(64)), e => e.code === 'IDEMPOTENCY_CONFLICT');
    assertions++;
    const competition = await Promise.allSettled(Array.from({ length: 8 }, () => repo.reserveBooking({ ...input, booking_time: '11:00' }, randomUUID(), hash)));
    assert.equal(competition.filter(x => x.status === 'fulfilled').length, 1);
    assert.ok(competition.filter(x => x.status === 'rejected').every(x => x.reason.code === '23505' && x.reason.constraint === 'unique_active_booking_slot'));
    assertions++;
    const before = (await pool.query('SELECT count(*)::int AS n FROM public.bookings')).rows[0].n;
    failBeforeCommit = true;
    const rollbackKey = randomUUID();
    await assert.rejects(repo.reserveBooking({ ...input, booking_time: '12:00' }, rollbackKey, hash));
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM public.bookings')).rows[0].n, before);
    assert.equal(await repo.getBookingRequest(rollbackKey, hash), null);
    assertions++;
    loseCommit = true;
    const lostKey = randomUUID();
    await assert.rejects(repo.reserveBooking({ ...input, booking_time: '14:00' }, lostKey, hash));
    const stored = await repo.getBookingRequest(lostKey, hash);
    assert.ok(stored);
    assert.equal((await repo.reserveBooking({ ...input, booking_time: '14:00' }, lostKey, hash)).id, stored.id);
    assertions++;
    assert.equal(await repo.claimBookingOperation(lostKey, hash, 'customer'), true);
    await repo.finishBookingOperation(lostKey, hash, 'customer', false);
    assert.equal(await repo.claimBookingOperation(lostKey, hash, 'customer'), false);
    assert.equal((await repo.getBookingRequest(lostKey, hash)).reconciliation_required, true);
    assertions++;
    await pool.query("UPDATE public.bookings SET status='cancelled' WHERE id=$1", [stored.id]).then(() => { throw Error('Application role unexpectedly permitted cancellation'); }, e => assert.equal(e.code, '42501'));
    assertions++;
    console.log(JSON.stringify({ status: 'PASS', checks: assertions, serverVersion: (await pool.query('SHOW server_version')).rows[0].server_version, scope: 'disposable PostgreSQL Unix socket; actual repository transaction/claim SQL; no external services' }));
}
finally {
    await pool.end();
    delete globalThis.__monetcoreTestPool;
}
