import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4612';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
const output = '/workspace/artifacts/phase2-electron-orbit-review';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
let checks = 0;
try {
  const context = await browser.newContext({ reducedMotion: 'no-preference', hasTouch: true });
  // Prevent all non-local network activity. No form submissions/integration calls.
  await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base);
  const dismiss = page.getByRole('button', { name: 'Dismiss preview notice' });
  if (await dismiss.isVisible()) await dismiss.click();
  await page.evaluate(() => document.fonts.ready);
  const hero = page.locator('#corporate-hero');
  let background;
  for (const width of [320,360,375,390,430,768,1024,1440]) {
    await page.setViewportSize({ width, height: width < 640 ? 844 : 1000 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow ${width}`);
    const current = await hero.locator('[aria-hidden="true"]').first().evaluate(el => getComputedStyle(el).backgroundImage);
    background ??= current;
    assert.equal(current, background, `consistent banner palette ${width}`);
    const bounds = await hero.boundingBox();
    for (const selector of ['h1','p','.company-snapshot','a']) {
      for (const item of await hero.locator(selector).all()) {
        const b = await item.boundingBox();
        assert.ok(b && b.x >= 0 && b.x+b.width <= width+1 && b.y+b.height <= bounds.y+bounds.height+1, `clipped ${selector} ${width}`);
      }
    }
    assert.equal(await hero.getByRole('link', {name:'Explore Solutions',exact:true}).getAttribute('href'), '/services');
    assert.equal(await hero.getByRole('link', {name:'Book Consultation',exact:true}).getAttribute('href'), '/book');
    if (width === 390 || width === 1440) {
      await page.screenshot({ path: `${output}/hero-${width}-animated.png`, fullPage: false });
      await hero.screenshot({ path: `${output}/banner-${width}-animated.png`, animations: 'allow' });
    }
    checks++;
  }
  await page.setViewportSize({width:1440,height:1000});
  const animations = await hero.evaluate(el => el.getAnimations({subtree:true}).length);
  assert.ok(animations > 0);
  assert.equal(await hero.getByRole('button', { name: /background animation/i }).count(), 0);
  assert.equal(await hero.locator('[data-electron]').count(), 4);
  const electron = hero.locator('[data-electron="0"]');
  const before = await electron.boundingBox();
  await page.waitForTimeout(300);
  const after = await electron.boundingBox();
  assert.ok(Math.hypot(after.x-before.x, after.y-before.y)>1, 'electron travels along orbit');
  assert.equal(await hero.locator('.border-t [aria-hidden="true"]').count(), 4);
  checks++;
  const nav=page.getByRole('navigation',{name:'Main navigation'});
  for(const name of ['Solutions & Services','Products','Company']) {
    const trigger=nav.getByRole('button',{name,exact:true});
    await trigger.click(); assert.equal(await trigger.getAttribute('aria-expanded'),'true');
    await trigger.press('ArrowDown');
    await page.waitForFunction(()=>document.activeElement?.matches('.mega-panel:not([hidden]) a'));
    await page.keyboard.press('Escape'); assert.equal(await trigger.getAttribute('aria-expanded'),'false');
    checks++;
  }
  for(const width of [320,390,768]) {
    await page.setViewportSize({width,height:844});
    await page.getByRole('button',{name:'Open navigation menu'}).click();
    for(const name of ['Solutions & Services','Products','Company']) {
      const trigger=nav.getByRole('button',{name,exact:true});
      await trigger.tap();
      assert.equal(await trigger.getAttribute('aria-expanded'),'true');
    }
    await nav.getByRole('link',{name:/About Monetcore/}).click();
    await page.waitForURL('**/about');
    assert.equal(await page.getByRole('button',{name:'Open navigation menu'}).getAttribute('aria-expanded'),'false');
    await page.goto(base); checks++;
  }
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await hero.evaluate(el=>el.getAnimations({subtree:true}).length),0);
  const staticBefore = await hero.locator('[data-electron="0"]').boundingBox();
  await page.waitForTimeout(200);
  assert.deepEqual(await hero.locator('[data-electron="0"]').boundingBox(), staticBefore);
  await hero.screenshot({path:`${output}/banner-390-reduced-motion.png`}); checks++;
  const axe=await new AxeBuilder({page}).include('#corporate-hero').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  assert.deepEqual(axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
  assert.deepEqual(errors,[]); checks++;
  console.log(`PASS ${checks} grouped hero/navigation checks; ${animations} decorative animations; screenshots ${output}`);
} finally { await browser.close(); }
