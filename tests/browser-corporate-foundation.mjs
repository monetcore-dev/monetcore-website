import { chromium } from 'playwright-core';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4600';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname)) throw new Error('Local review only');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
const context = await browser.newContext({ reducedMotion: 'reduce' });
await context.route('**/*', route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
try {
  assert.equal((await page.request.post(base + '/api/contact', { data: {} })).status(), 403);
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    await page.getByRole('heading', { level: 1, name: /Engineering software.*Automating business.*Powering the future/i }).waitFor();
    assert.equal(await page.locator('.engineering-capability').count(), 6);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `overflow at ${width}`);
    for (const card of await page.locator('.engineering-capability').all()) {
      const box = await card.boundingBox();
      assert.ok(box.x >= 0 && box.x + box.width <= width + 1);
    }
    if ([390, 1440].includes(width)) {
      const results = await new AxeBuilder({ page }).include('.engineering-capabilities').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
      assert.deepEqual(results.violations, []);
      fs.mkdirSync('/workspace/artifacts/monetcore2', { recursive: true });
      await page.screenshot({ path: `/workspace/artifacts/monetcore2/home-${width}.png`, fullPage: true });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const [route, trigger] of [['/services/software-development', '#trigger-solutions'], ['/products/ai-lead-automation', '#trigger-products']]) {
    await page.goto(base + route);
    assert.ok((await page.locator(trigger).getAttribute('class')).split(/\s+/).includes('is-current'));
  }
  assert.deepEqual(errors, []);
  console.log('PASS corporate hero and six capability cards at eight widths, mobile/desktop axe, nested navigation category state and no browser errors');
} finally { await browser.close(); }
