import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
const base=process.env.QA_BASE_URL;
assert.ok(base&&['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 for(const width of [390,1440])for(const mode of ['unclassified503','networkLoss','validationRetry']){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===new URL(base).origin?route.continue():route.abort());
  const page=await context.newPage(),ids=[];let calls=0;
  await page.route('**/api/book/availability?*',r=>r.fulfill({json:{success:true,unavailableTimes:[],bookedTimes:[]}}));
  await page.route('**/api/book',route=>{
   calls++;ids.push(route.request().postDataJSON().idempotencyKey);
   if(mode==='networkLoss')return route.abort();
   if(mode==='unclassified503')return route.fulfill({status:503,json:{error:'Synthetic unavailable'}});
   return route.fulfill({status:calls===1?400:201,json:calls===1?{error:'Synthetic correctable validation',outcome:'not_created'}:{success:true,outcome:'confirmed',booking:{id:'synthetic'}}});
  });
  await page.goto(base+'/book');const dismiss=page.getByRole('button',{name:'Dismiss preview notice'});if(await dismiss.isVisible())await dismiss.click();
  await page.locator('[name="consultationType"]').selectOption('Discovery Call - 30 minutes');await page.locator('input[type="date"]').fill('2030-01-07');const time=page.getByRole('button',{name:/10:00/});await time.waitFor();await page.waitForFunction(()=>![...document.querySelectorAll('button')].find(b=>b.textContent.trim().startsWith('10:00'))?.disabled);await time.click();
  await page.locator('[name="name"]').fill('Synthetic test');await page.locator('[name="email"]').fill('test@example.invalid');const submit=page.getByRole('button',{name:'Confirm Consultation'});await submit.click();
  if(mode==='validationRetry'){
   await page.getByText(/Synthetic correctable validation/).waitFor();assert.equal(await submit.isDisabled(),false);await submit.click();await page.getByText(/Your consultation has been booked/).waitFor();assert.equal(calls,2);assert.equal(ids[0],ids[1]);
  }else{
   const notice=page.getByRole('alert').filter({hasText:/Do not resubmit or choose another slot/});await notice.waitFor();assert.equal(await submit.isDisabled(),true);assert.match(await notice.innerText(),/Request reference: [a-f0-9-]{36}/);await page.waitForTimeout(250);assert.equal(calls,1);assert.equal(await page.getByText(/Your consultation has been booked/).count(),0);
  }
  assert.ok(ids.every(id=>/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await context.close();
 }
 console.log('PASS390/1440px: stable request identity on correctable retries; unclassified503/network loss lock unsafe resubmission and show reference; no false confirmation,auto-retry or overflow. All submissions intercepted.');
}finally{await browser.close();}
