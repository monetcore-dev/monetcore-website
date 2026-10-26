// Real SQL verification, ONLY against the marked disposable Unix-socket cluster.
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { Pool } from 'pg';
import { realpath } from 'node:fs/promises';
const socket = process.env.MONETCORE_TEST_PG_SOCKET;
assert.equal(socket, '/tmp/monetcore-vps-pg-socket');
assert.equal(await realpath(socket), socket);
registerHooks({ resolve(specifier, context, next) {
  if (specifier === './postgres' && context.parentURL?.endsWith('/app/lib/bookingRepository.ts'))
    return { url: new URL('../../tests/staging/postgres-live-pool.mjs', import.meta.url).href, shortCircuit: true };
  return next(specifier, context);
} });
const { pool } = await import('../../tests/staging/postgres-live-pool.mjs');
const admin = new Pool({ host: socket, database: 'monetcore_db', user: 'postgres' });
const repository = await import('../../app/lib/bookingRepository.ts');
const passed = [];
try {
  const settings = await pool.query("SELECT current_setting('cluster_name') AS cluster, current_setting('server_version_num')::int AS version");
  assert.equal(settings.rows[0].cluster, 'monetcore_disposable_verification');
  assert.ok(settings.rows[0].version >= 160000 && settings.rows[0].version < 170000);
  assert.equal((await pool.query('SELECT count(id)::int AS n FROM public.bookings')).rows[0].n, 0, 'Refuse a cluster with existing bookings');
  passed.push('PostgreSQL16, marked disposable cluster and empty synthetic table');
  const role = (await pool.query('SELECT rolsuper,rolcreatedb,rolcreaterole,rolbypassrls FROM pg_roles WHERE rolname=current_user')).rows[0];
  assert.ok(Object.values(role).every(x => x === false)); passed.push('nonprivileged app role');
  const index = (await admin.query("SELECT indisunique,indisvalid,indisready FROM pg_index WHERE indexrelid='public.unique_active_booking_slot'::regclass")).rows[0];
  assert.ok(Object.values(index).every(Boolean)); passed.push('valid active-slot unique index');
  const base = { consultation_type: 'Discovery Call - 30 minutes', booking_date: '2030-01-07', booking_time: '09:00', name: 'Synthetic only', email: 'test@example.invalid' };
  const booking = await repository.createBooking(base);
  assert.match(booking.id,/^[a-f0-9-]{36}$/); assert.equal(booking.booking_date,base.booking_date); assert.equal(booking.booking_time,'09:00');
  assert.equal((await admin.query('SELECT count(*)::int AS n FROM public.bookings WHERE id=$1',[booking.id])).rows[0].n,1);
  passed.push('UUID/date/time and reservation committed before tracking');
  await assert.rejects(repository.createBooking(base),e => e.code==='23505' && e.constraint==='unique_active_booking_slot'); passed.push('duplicate conflict code and constraint');
  const racing = await Promise.allSettled(Array.from({length:8},()=>repository.createBooking({...base,booking_time:'10:00'})));
  assert.equal(racing.filter(r=>r.status==='fulfilled').length,1);
  assert.equal(racing.filter(r=>r.status==='rejected' && r.reason.code==='23505').length,7); passed.push('eight concurrent reservations: one winner');
  await admin.query("UPDATE public.bookings SET status='cancelled' WHERE id=$1",[booking.id]);
  assert.ok(!(await repository.getBookedTimes(base.booking_date)).includes('09:00'));
  await repository.createBooking(base); passed.push('cancelled-slot exclusion and reuse');
  await assert.rejects(repository.createBooking({...base,booking_date:'2030-01-05'}),e=>e.code==='23514');
  await assert.rejects(repository.createBooking({...base,booking_time:'09:30'}),e=>e.code==='23514'); passed.push('weekday/time CHECK constraints');
  await repository.createBooking({...base,booking_time:'11:00',name:"Synthetic'); DROP TABLE public.bookings;--"});
  assert.equal((await admin.query("SELECT to_regclass('public.bookings')::text AS name")).rows[0].name,'bookings'); passed.push('parameterized injection payload');
  await repository.updateBookingTracking(booking.id,{confirmation_sent_at:'2030-01-01T00:00:00Z'});
  assert.ok((await admin.query('SELECT confirmation_sent_at FROM public.bookings WHERE id=$1',[booking.id])).rows[0].confirmation_sent_at);
  await assert.rejects(repository.updateBookingTracking('00000000-0000-4000-8000-000000000000',{updated_at:'2030-01-01T00:00:00Z'})); passed.push('tracking persistence and missing-row rejection');
  for (const sql of ['SELECT email FROM public.bookings','DELETE FROM public.bookings',"UPDATE public.bookings SET status='cancelled'",'TRUNCATE public.bookings','CREATE TABLE public.unauthorized(id int)'])
    await assert.rejects(pool.query(sql),e=>e.code==='42501');
  passed.push('PII read/delete/status/truncate/schema-write denied');
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("INSERT INTO public.bookings(consultation_type,booking_date,booking_time,name,email) VALUES($1,$2,$3,$4,$5)",[base.consultation_type,base.booking_date,'12:00',base.name,base.email]);
    await client.query('ROLLBACK');
  } finally { client.release(); }
  assert.ok(!(await repository.getBookedTimes(base.booking_date)).includes('12:00')); passed.push('explicit transaction rollback');
  console.log(JSON.stringify({passed:passed.length,failed:0,checks:passed}));
} finally { await pool.end(); await admin.end(); }
