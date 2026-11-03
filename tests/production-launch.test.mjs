import test from 'node:test';
import assert from 'node:assert/strict';
import { POST as contact } from '../app/api/contact/route.ts';
import { POST as booking } from '../app/api/book/route.ts';
import { GET as availability } from '../app/api/book/availability/route.ts';
import { POST as assistant } from '../app/api/assistant/route.ts';
import { state } from './integrations.mjs';
import { isPublicLaunch } from '../app/lib/publicLaunch.ts';
test('public production launch refuses all unverified integrations before side effects', async () => {
 const previous=process.env.MONETCORE_PUBLIC_LAUNCH;
 try {
  delete process.env.MONETCORE_PUBLIC_LAUNCH;assert.equal(isPublicLaunch(),false);
  process.env.MONETCORE_PUBLIC_LAUNCH='true';assert.equal(isPublicLaunch(),true);
  const before=[state.bookings.length,state.emails.length,state.calendars.length];
  for(const [handler,url,method] of [[contact,'contact','POST'],[booking,'book','POST'],[availability,'book/availability?date=2030-01-07','GET'],[assistant,'assistant','POST']]) {
   const response=await handler(new Request('https://monetcore.dev/api/'+url,{method}));
   assert.equal(response.status,503);const body=await response.json();assert.equal(body.outcome,'not_created');assert.match(body.error,/hello@monetcore.dev/);assert.equal(body.success,undefined);
  }
  assert.deepEqual([state.bookings.length,state.emails.length,state.calendars.length],before);
 } finally {if(previous===undefined)delete process.env.MONETCORE_PUBLIC_LAUNCH;else process.env.MONETCORE_PUBLIC_LAUNCH=previous;}
});
