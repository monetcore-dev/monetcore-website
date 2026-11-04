// Runs ONLY against a newly created disposable Unix-socket cluster; no URLs/TCP.
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {registerHooks} from 'node:module';import {randomUUID} from 'node:crypto';import pg from 'pg';
const socket=process.env.MONETCORE_ENQUIRY_TEST_SOCKET;assert.ok(socket);assert.equal(path.resolve(socket),socket);assert.ok(socket.startsWith('/workspace/artifacts/monetcore-enquiries-20261103/disposable-pg-'));assert.equal(fs.realpathSync(socket),socket);assert.ok(fs.statSync(socket+'/.s.PGSQL.5432').isSocket());
const pool=new pg.Pool({host:socket,user:'monetcore_enquiries',database:'monetcore_db',max:20,connectionTimeoutMillis:3000});const admin=new pg.Pool({host:socket,user:'postgres',database:'monetcore_db',max:1});
let lostCommit=false;globalThis.__enquiryPg={query:pool.query.bind(pool),async connect(){const c=await pool.connect();return {release:c.release.bind(c),async query(sql,values){const r=await c.query(sql,values);if(sql==='COMMIT'&&lostCommit){lostCommit=false;throw Object.assign(Error('Synthetic lost acknowledgement'),{code:'08006'});}return r;}};}};
registerHooks({resolve(s,c,next){if(s==='./database'&&c.parentURL?.endsWith('/app/lib/enquiries/repository.ts'))return {url:'data:text/javascript,export function enquiryPool(){return globalThis.__enquiryPg}',shortCircuit:true};if(s==='nodemailer')return {url:'data:text/javascript,export default {createTransport(){return globalThis.__enquirySmtp}}',shortCircuit:true};if(s==='next/server')return next('next/server.js',c);if(s.startsWith('@/'))return next(new URL('../'+s.slice(2)+'.ts',import.meta.url).href,c);if(s==='server-only')return {url:'data:text/javascript,export{}',shortCircuit:true};try{return next(s,c);}catch(e){if(s.startsWith('.')&&!/\.[a-z]+$/i.test(s))return next(s+'.ts',c);throw e;}}});
const repo=await import('../app/lib/enquiries/repository.ts');const payload={kind:'contact',name:'Synthetic',email:'tester@example.invalid',company:'',service:'Software',budget:'',message:'Synthetic only',package_id:null,package_summary:null};let checks=0;
const reset=()=>admin.query('TRUNCATE monetcore_enquiries.request_keys,monetcore_enquiries.enquiries,monetcore_enquiries.rate_windows');
try{
 assert.match((await admin.query('SELECT version() AS v')).rows[0].v,/PostgreSQL 16\./);checks++;
 assert.equal((await admin.query('SELECT marker FROM public.bookings')).rows[0].marker,'SYNTHETIC-PRESERVE');checks++;
 await assert.rejects(pool.query('SELECT * FROM public.bookings'),e=>e.code==='42501');await assert.rejects(pool.query('CREATE TABLE monetcore_enquiries.forbidden(id int)'),e=>e.code==='42501');checks++;
 const roles=(await pool.query("SELECT rolsuper,rolbypassrls,rolcreatedb,rolcreaterole FROM pg_roles WHERE rolname=current_user")).rows[0];assert.ok(Object.values(roles).every(v=>v===false));checks++;
 await reset();const key=randomUUID(),hash='a'.repeat(64),ip='b'.repeat(64);const rows=await Promise.all(Array.from({length:8},()=>repo.saveEnquiry(key,hash,ip,payload)));assert.equal(new Set(rows.map(r=>r.id)).size,1);assert.equal((await admin.query('SELECT count(*)::int AS n FROM monetcore_enquiries.enquiries')).rows[0].n,1);checks++;
 const alias=await repo.saveEnquiry(randomUUID(),hash,ip,payload);assert.equal(alias.id,rows[0].id);assert.equal((await admin.query('SELECT count(*)::int AS n FROM monetcore_enquiries.request_keys')).rows[0].n,2);checks++;
 await assert.rejects(repo.saveEnquiry(key,'c'.repeat(64),ip,payload),e=>e.code==='ENQUIRY_CONFLICT');checks++;
 const claims=await Promise.all(Array.from({length:8},()=>repo.claimNotification(rows[0].id)));assert.equal(claims.filter(Boolean).length,1);await repo.finishNotification(rows[0].id,'accepted','smtp_accepted');assert.equal(await repo.claimNotification(rows[0].id),null);checks++;
 await reset();for(let i=0;i<10;i++)await repo.saveEnquiry(randomUUID(),i.toString(16).padStart(64,'0'),ip,payload);await assert.rejects(repo.saveEnquiry(randomUUID(),'f'.repeat(64),ip,payload),e=>e.code==='ENQUIRY_RATE_LIMIT');assert.equal((await admin.query('SELECT count(*)::int AS n FROM monetcore_enquiries.enquiries')).rows[0].n,10);checks++;
 await reset();for(let i=0;i<100;i++)await repo.saveEnquiry(randomUUID(),i.toString(16).padStart(64,'0'),i.toString(16).padStart(64,'0'),payload);await assert.rejects(repo.saveEnquiry(randomUUID(),'f'.repeat(64),'e'.repeat(64),payload),e=>e.code==='ENQUIRY_RATE_LIMIT');checks++;
 await reset();const replayKey=randomUUID();lostCommit=true;await assert.rejects(repo.saveEnquiry(replayKey,hash,ip,payload),/Synthetic lost/);const recovered=await repo.saveEnquiry(replayKey,hash,ip,payload);assert.ok(recovered.id);assert.equal((await admin.query('SELECT count(*)::int AS n FROM monetcore_enquiries.enquiries')).rows[0].n,1);checks++;
 await reset();await admin.query('ALTER TABLE monetcore_enquiries.request_keys ADD CONSTRAINT synthetic_reject CHECK(false)');await assert.rejects(repo.saveEnquiry(randomUUID(),hash,ip,payload));assert.equal((await admin.query('SELECT count(*)::int AS n FROM monetcore_enquiries.enquiries')).rows[0].n,0);await admin.query('ALTER TABLE monetcore_enquiries.request_keys DROP CONSTRAINT synthetic_reject');checks++;
 const pending=await repo.saveEnquiry(randomUUID(),hash,ip,payload);await repo.claimNotification(pending.id);await admin.query("UPDATE monetcore_enquiries.enquiries SET started_at=now()-interval '3 minutes' WHERE id=$1",[pending.id]);await repo.maintainEnquiryQueue();assert.equal((await repo.notificationProblems())[0].notification_state,'uncertain');assert.equal(await repo.claimNotification(pending.id),null);checks++;
 await reset();const retry=await repo.saveEnquiry(randomUUID(),hash,ip,payload);for(let i=0;i<5;i++){assert.ok(await repo.claimNotification(retry.id));await repo.finishNotification(retry.id,'pending','smtp_pre_message');await admin.query('UPDATE monetcore_enquiries.enquiries SET next_attempt_at=now() WHERE id=$1',[retry.id]);}assert.equal((await admin.query('SELECT notification_state FROM monetcore_enquiries.enquiries')).rows[0].notification_state,'failed');assert.equal(await repo.claimNotification(retry.id),null);checks++;
 const hashed=(await admin.query('SELECT bucket FROM monetcore_enquiries.rate_windows')).rows;assert.ok(hashed.every(r=>r.bucket==='global'||/^ip:[a-f0-9]{64}$/.test(r.bucket)));checks++;
 // Exercise the real POST handler and notification worker together with real disposable
 // PostgreSQL. SMTP is an in-memory stub: no socket or customer email is permitted.
 await reset();
 Object.assign(process.env,{NODE_ENV:'production',MONETCORE_PUBLIC_LAUNCH:'true',MONETCORE_CONTACT_ENABLED:'true',MONETCORE_CONTACT_PROXY_VERIFIED:'true',MONETCORE_ENQUIRY_RATE_SECRET:'synthetic-e2e-secret-01234567890123456789',MONETCORE_EMAIL:'hello@monetcore.dev',MONETCORE_EMAIL_PASSWORD:'synthetic-only'});
 for(const key of ['VERCEL','VERCEL_ENV','MONETCORE_STAGING','MONETCORE_VPS_REVIEW'])delete process.env[key];
 const {POST}=await import('../app/api/contact/route.ts');const {processEnquiryNotification}=await import('../app/lib/enquiries/notifications.ts');
 const mails=[];let smtpFailure=false;
 globalThis.__enquirySmtp={close(){},async sendMail(mail){
  const id=mail.messageId.match(/monetcore\.enquiry\.(.+)@/)[1];
  assert.equal((await admin.query('SELECT notification_state FROM monetcore_enquiries.enquiries WHERE id=$1',[id])).rows[0].notification_state,'started');
  assert.equal(mail.to,'hello@monetcore.dev');assert.deepEqual(mail.envelope.to,['hello@monetcore.dev']);
  if(smtpFailure)throw Object.assign(Error('Synthetic SMTP unavailable'),{command:'CONN'});
  mails.push(mail);return {accepted:['hello@monetcore.dev'],rejected:[]};
 }};
 const post=(key,extra={})=>POST(new Request('http://localhost:4308/api/contact',{method:'POST',headers:{host:'monetcore.dev',origin:'https://monetcore.dev','x-forwarded-proto':'https','x-real-ip':'192.0.2.10','content-type':'application/json'},body:JSON.stringify({idempotencyKey:key,name:'Synthetic E2E',email:'tester@example.invalid',service:'Business Website',message:'Synthetic isolated end-to-end test only',startedAt:Date.now()-10000,...extra})}));
 for(const kind of ['contact','quotation']){
  const key=randomUUID();const extra=kind==='quotation'?{packageId:'starter',consent:true}:{};
  const response=await post(key,extra);assert.equal(response.status,202);const receipt=await response.json();assert.equal(receipt.outcome,'received');
  const saved=(await admin.query('SELECT payload,notification_state FROM monetcore_enquiries.enquiries WHERE id=$1',[receipt.enquiryReference])).rows[0];
  assert.equal(saved.payload.kind,kind);assert.equal(saved.notification_state,'pending');
  const replay=await post(key,extra);assert.equal((await replay.json()).enquiryReference,receipt.enquiryReference);
  smtpFailure=kind==='quotation';await processEnquiryNotification(receipt.enquiryReference);
  assert.equal((await admin.query('SELECT notification_state FROM monetcore_enquiries.enquiries WHERE id=$1',[receipt.enquiryReference])).rows[0].notification_state,smtpFailure?'pending':'accepted');
  if(smtpFailure){smtpFailure=false;await admin.query('UPDATE monetcore_enquiries.enquiries SET next_attempt_at=now() WHERE id=$1',[receipt.enquiryReference]);await processEnquiryNotification(receipt.enquiryReference);}
  assert.equal((await admin.query('SELECT notification_state FROM monetcore_enquiries.enquiries WHERE id=$1',[receipt.enquiryReference])).rows[0].notification_state,'accepted');
  assert.equal(await processEnquiryNotification(receipt.enquiryReference),false);checks++;
 }
 assert.equal(mails.length,2);assert.equal((await admin.query('SELECT count(*)::int AS n FROM monetcore_enquiries.enquiries')).rows[0].n,2);
 assert.equal((await admin.query('SELECT marker FROM public.bookings')).rows[0].marker,'SYNTHETIC-PRESERVE');checks++;
 // New production worker must not claim any pre-activation pending notification.
 await reset();const old=await repo.saveEnquiry(randomUUID(),hash,ip,payload);
 await admin.query("UPDATE monetcore_enquiries.enquiries SET created_at=now()-interval '1 day' WHERE id=$1",[old.id]);
 process.env.MONETCORE_ENQUIRY_NOTIFY_AFTER=new Date(Date.now()-1000).toISOString().replace(/\.\d{3}Z$/,'Z');
 assert.equal(await repo.claimNotification(old.id),null);assert.equal((await admin.query('SELECT notification_state FROM monetcore_enquiries.enquiries WHERE id=$1',[old.id])).rows[0].notification_state,'pending');
 const fresh=await repo.saveEnquiry(randomUUID(),'d'.repeat(64),ip,{...payload,message:'Synthetic new post-activation enquiry'});assert.equal((await repo.claimNotification()).id,fresh.id);delete process.env.MONETCORE_ENQUIRY_NOTIFY_AFTER;checks++;
 console.log('PASS real POST -> disposable PostgreSQL -> mocked SMTP for contact and quotation, durable receipts before email, idempotent replay, failure retention and safe retry; no email sent.');
 console.log('PASS '+checks+' PostgreSQL16 checks: migration,least privilege,booking sentinel,concurrent idempotency,alias dedupe,conflict,atomic claim,persistent IP/global limits,lost COMMIT,transaction rollback,stale recovery,bounded retry.');
}finally{await pool.end();await admin.end();}
