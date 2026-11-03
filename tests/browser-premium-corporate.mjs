// Local-only visual redesign regression: no submissions or live providers.
import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const base=process.env.QA_BASE_URL||'http://127.0.0.1:4891';assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const output='/workspace/artifacts/monetcore-premium-redesign-20261102';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--proxy-server=http://127.0.0.1:9','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1']});
const rows=[],errors=[];
try{
 const context=await browser.newContext();await context.route('**/*',r=>new URL(r.request().url()).origin===base&&!new URL(r.request().url()).pathname.startsWith('/api/')?r.continue():r.abort());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});assert.equal((await page.goto(base,{waitUntil:'networkidle'})).status(),200);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1600);
  assert.equal(await page.locator('h1').count(),1);assert.match(await page.locator('h1').innerText(),/Build smarter/);
  assert.equal(await page.locator('#corporate-hero a').filter({hasText:'Explore Solutions'}).getAttribute('href'),'/services');assert.equal(await page.locator('#corporate-hero a').filter({hasText:'Book Consultation'}).getAttribute('href'),'/book');
  assert.equal(await page.locator('#services a.solution-card').count(),8);
  assert.equal(await page.locator('#corporate-hero figcaption').isVisible(),true);
  assert.ok((await page.locator('#corporate-hero figure').getAttribute('aria-label')).includes('No live customer data'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Horizontal overflow at '+width);
  for(const el of await page.locator('#corporate-hero a').all()){await el.focus();assert.ok(await el.evaluate(e=>getComputedStyle(e).outlineStyle!=='none'));const box=await el.boundingBox();assert.ok(box.height>=44);}
  const axe=await new AxeBuilder({page}).include('#corporate-hero').include('#services').include('#products').include('#live-demos').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  await fs.writeFile(`${output}/axe-${width}.json`,JSON.stringify(axe.violations,null,2));assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[],'Accessibility at '+width);
  rows.push({width,overflow:false,axeViolations:0,serviceCards:8});
 }
 const hrefs=await page.locator('#services a,#corporate-hero a,#products a,#live-demos a').evaluateAll(es=>[...new Set(es.map(e=>e.getAttribute('href')).filter(h=>h?.startsWith('/'))) ]);
 for(const href of hrefs){const res=await page.request.get(base+href);assert.ok(res.status()<400,href+':'+res.status());}
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload();const active=await page.locator('#corporate-hero').evaluate(e=>e.getAnimations({subtree:true}).filter(a=>a.playState==='running').length);assert.equal(active,0);
 await page.setViewportSize({width:390,height:844});await page.reload();const menu=page.getByRole('button',{name:'Open navigation'});await menu.click();await page.keyboard.press('Escape');assert.equal(await menu.getAttribute('aria-expanded'),'false');
 assert.deepEqual(errors,[]);await fs.writeFile(`${output}/responsive-verification.json`,JSON.stringify({rows,hrefs,reducedMotion:true,errors},null,2));console.log('PASS premium redesign 320/390/768/1440,axe,focus,touch targets,real route destinations,mobile menu,static reduced motion;no external integration calls');
}finally{await browser.close();}
