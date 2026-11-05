import {chromium} from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base=process.env.QA_BASE_URL,out=process.env.QA_DEVOPS_OUTPUT;
assert.ok(base&&['127.0.0.1','localhost'].includes(new URL(base).hostname));assert.ok(out);fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--proxy-server=http://127.0.0.1:9','--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1']});
const errors=[],checks=[];
try{for(const width of [320,390,768,1440]){
 const context=await browser.newContext({viewport:{width,height:960}});
 await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__devopsCLS=0;new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.__devopsCLS+=entry.value;}).observe({type:'layout-shift',buffered:true});});
 await page.goto(base+'/services/devops-infrastructure',{waitUntil:'networkidle'});
 const headerBox=await page.locator('header.site-header').boundingBox();const eyebrowBox=await page.getByText('Monetcore / Engineering & operations',{exact:true}).boundingBox();assert.ok(eyebrowBox.y>=headerBox.y+headerBox.height,'Hero obscured by fixed navigation');assert.equal(await page.locator('h1').innerText(),'DevOps & Infrastructure Solutions');assert.equal(await page.locator('main article').count(),7);
 const hero=page.locator('main>section').first();
 if(width<=640){const cta=hero.getByRole('link',{name:'Request a Consultation',exact:true});assert.equal(await cta.count(),1);assert.equal(await cta.getAttribute('href'),'/book?interest=service%3Adevops-infrastructure');assert.equal(await hero.getByRole('link',{name:'Discuss Your Infrastructure Requirements'}).count(),0);}
 else{assert.equal(await hero.getByRole('link',{name:'Discuss Your Infrastructure Requirements'}).count(),1);assert.equal(await hero.getByRole('link',{name:'Request a Consultation',exact:true}).count(),0);}
 assert.equal(await hero.locator('p').filter({hasText:'Connect the way you build software'}).evaluate(el=>getComputedStyle(el).color),'rgb(245, 249, 255)');

 const image=page.getByRole('img',{name:/Original illustration of Black African engineers/});assert.ok(await image.evaluate(el=>el.complete&&el.naturalWidth>0));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.ok(await page.evaluate(()=>window.__devopsCLS)<.05,'Unexpected layout shift');
 const buttons=page.locator('main ol button');assert.equal(await buttons.count(),7);
 for(let i=0;i<7;i++){
  await buttons.nth(i).click();if(i===0)await buttons.nth(i).click();assert.equal(await buttons.nth(i).getAttribute('aria-expanded'),'true');assert.equal(await page.locator('main ol button[aria-expanded="true"]').count(),1);
  const id=await buttons.nth(i).getAttribute('aria-controls');assert.ok(await page.locator('#'+id).isVisible());assert.equal(await page.locator('#'+id).evaluate(el=>el.parentElement.tagName),'LI');
  await buttons.nth(i).click();assert.equal(await buttons.nth(i).getAttribute('aria-expanded'),'false');assert.equal(await page.locator('main ol button[aria-expanded="true"]').count(),0);
 }
 await buttons.first().focus();await page.keyboard.press('ArrowRight');assert.equal(await buttons.nth(1).evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Enter');assert.equal(await buttons.nth(1).getAttribute('aria-expanded'),'true');await page.keyboard.press('End');assert.equal(await buttons.last().evaluate(el=>el===document.activeElement),true);await page.keyboard.press('Home');assert.equal(await buttons.first().evaluate(el=>el===document.activeElement),true);
 assert.equal(await buttons.first().evaluate(el=>getComputedStyle(el).outlineStyle),'solid');
 const destinations=await page.locator('main a').evaluateAll(links=>links.map(el=>el.getAttribute('href')));
 for(const href of new Set(destinations)){
  if(href.startsWith('#'))assert.equal(await page.locator(href).count(),1);
  else if(href.startsWith('/'))assert.equal((await context.request.get(base+href.split('#')[0])).status(),200,href);
  else assert.equal(href,'mailto:hello@monetcore.dev');
 }
 const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();fs.writeFileSync(out+'/axe-'+width+'.json',JSON.stringify(axe.violations,null,2));assert.deepEqual(axe.violations,[]);
 await page.goto(base+'/services/devops-infrastructure',{waitUntil:'networkidle'});await page.screenshot({path:out+'/devops-'+width+'.png',fullPage:true});await page.locator('main>section').first().screenshot({path:out+'/hero-'+width+'.png'});
 if(width<1200)await page.getByRole('button',{name:'Open navigation menu'}).click();await page.getByRole('button',{name:'Solutions & Services',exact:true}).click();const link=page.getByRole('navigation',{name:'Main navigation'}).getByRole('link',{name:/DevOps & Infrastructure/});assert.equal(await link.count(),1);await link.click();assert.ok(page.url().includes('/services/devops-infrastructure'));
 await page.goto(base+'/',{waitUntil:'networkidle'});const card=page.locator('#services a[href="/services/devops-infrastructure"]');assert.equal(await card.count(),1);await card.screenshot({path:out+'/service-card-'+width+'.png'});await card.click();await page.waitForURL('**/services/devops-infrastructure');
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('main').evaluate(el=>el.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
 const ids=await page.locator('[id]').evaluateAll(nodes=>nodes.map(n=>n.id));assert.equal(new Set(ids).size,ids.length);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);checks.push({width,status:'PASS'});await context.close();
}assert.deepEqual(errors,[]);fs.writeFileSync(out+'/browser-results.json',JSON.stringify({checks,consolePageErrors:errors},null,2));console.log('PASS four responsive widths,seven workflow stages,keyboard/ARIA/unique IDs,axe,links,nav,homepage card,CLS,reduced motion and local optimized hero. No submissions made.');}finally{await browser.close();}
