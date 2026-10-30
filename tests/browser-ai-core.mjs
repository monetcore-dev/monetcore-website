// The approved decorative electron hero replaced the retired interactive five-node AI Core.
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4600";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname), "Local preview only");
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "no-preference", hasTouch: true });
  const errors = [], api = [];
  await context.route("**/*", route => new URL(route.request().url()).origin === new URL(base).origin ? route.continue() : route.abort());
  const page = await context.newPage();
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error" && /hydrat|did not match|Minified React error/i.test(message.text())) errors.push(message.text()); });
  page.on("request", request => { if (new URL(request.url()).pathname.startsWith("/api/")) api.push(request.url()); });
  assert.equal((await page.request.post(base + "/api/contact", { data: {} })).status(), 403);
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  const dismiss = page.getByRole("button", { name: "Dismiss preview notice" });
  if (await dismiss.isVisible()) await dismiss.click();
  const hero = page.locator("#corporate-hero");
  assert.equal(await hero.count(), 1);
  assert.match(await hero.locator("h1").innerText(), /Build smarter.*Automate faster.*Grow further/s);
  assert.equal(await page.locator(".technology-showcase, .ai-core").count(), 0);
  assert.equal(await hero.locator("[data-electron]").count(), 4);
  assert.equal(await hero.getByRole("button", { name: /pause|resume/i }).count(), 0);
  const destinations = [["Explore Solutions", "/services"], ["Book Consultation", "/book"]];
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: width === 375 ? "dark" : "light" });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}px overflow`);
    const bounds = await hero.boundingBox();
    for (const selector of ["h1", "p", ".company-snapshot", "a"]) {
      for (const node of await hero.locator(selector).all()) {
        const box = await node.boundingBox();
        assert.ok(box && box.x >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= bounds.y + bounds.height + 1, `${width}px clipped ${selector}`);
      }
    }
    for (const [name, href] of destinations) {
      const link = hero.getByRole("link", { name, exact: true });
      assert.equal(await link.getAttribute("href"), href);
      await link.focus();
      assert.ok(await link.evaluate(node => node === document.activeElement));
      assert.ok((await link.boundingBox()).height >= 44, `${width}px ${name} touch target`);
    }
    assert.equal(await hero.locator("[data-electron]").evaluateAll(nodes => nodes.every(node => node.closest('[aria-hidden="true"]') !== null)), true);
  }
  const electron = hero.locator('[data-electron="0"]');
  const first = await electron.boundingBox();
  await page.waitForTimeout(300);
  const second = await electron.boundingBox();
  assert.ok(Math.hypot(first.x - second.x, first.y - second.y) > 1, "Electrons actually travel");
  assert.ok(await hero.evaluate(node => node.getAnimations({ subtree: true }).length > 0));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await hero.evaluate(node => node.getAnimations({ subtree: true }).length), 0);
    const staticBefore = await electron.boundingBox();
    await page.waitForTimeout(200);
    assert.deepEqual(await electron.boundingBox(), staticBefore);
    const result = await new AxeBuilder({ page }).include("#corporate-hero").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    assert.deepEqual(result.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })), []);
  }
  for (const [name, href] of destinations) {
    await page.goto(base);
    await hero.getByRole("link", { name, exact: true }).focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(base + href);
    assert.equal(await page.locator("h1").count(), 1);
    await page.goto(base);
    await hero.getByRole("link", { name, exact: true }).tap();
    await page.waitForURL(base + href);
  }
  assert.deepEqual(api, []);
  assert.deepEqual(errors, []);
  console.log("PASS approved electron hero: eight widths, retained copy/CTAs/cards, keyboard/touch destinations, decorative semantics, actual animation/static reduced motion, axe and zero integration requests/errors.");
} finally { await browser.close(); }
