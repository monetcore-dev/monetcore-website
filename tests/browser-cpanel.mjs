import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:6393';
assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox'] });
const context = await browser.newContext({ reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [], external = [];
page.on('pageerror', e => errors.push(e.message));
await context.route('**/*', route => {
  if (new URL(route.request().url()).origin !== new URL(base).origin) {
    external.push('blocked'); return route.abort();
  }
  return route.continue();
});
try {
  for (const width of [320,390,768,1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ['/', '/contact', '/book', '/website-packages', '/privacy']) {
      const response = await page.goto(base + path);
      assert.equal(response.status(), 200, path);
      assert.match(response.headers()['x-robots-tag'] || '', /noindex/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, path);
    }
    await page.goto(base + '/');
    const menu = page.getByRole('button', { name: 'Open navigation menu' });
    if (await menu.isVisible()) {
      await menu.click();
      await page.getByRole('button', { name: 'Close navigation menu' }).click();
    }
  }
  await page.goto(base + '/contact');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
  assert.deepEqual(axe.violations.map(v => v.id), []);
  for (const [path,method,status] of [['/api/contact','POST',403], ['/api/book','POST',403],
    ['/api/book/availability?date=2026-10-23','GET',403], ['/assistant','GET',503], ['/api/assistant','POST',503]]) {
    const r = await context.request.fetch(base+path,{method}); assert.equal(r.status(),status,path);
  }
  assert.deepEqual(errors,[]); assert.deepEqual(external,[]);
  console.log('PASS standalone cPanel review: pages 320/390/768/1440, menu, axe, no overflow, blocked integrations/AI, zero external requests/errors.');
} finally { await browser.close(); }
