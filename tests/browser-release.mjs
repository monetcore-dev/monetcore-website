import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { publicRoutes } from "../app/lib/metadata.ts";
const base = process.env.QA_BASE_URL;
assert.ok(base && ["localhost", "127.0.0.1"].includes(new URL(base).hostname), "Local production-emulation server required");
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
const page = await context.newPage();
const external = [], trackers = [], errors = [], titles = new Set();
const tracker = /\/_vercel\/(?:insights|speed-insights)|google-analytics\.com|googletagmanager\.com|connect\.facebook\.net|clarity\.ms|hotjar|segment\.(?:com|io)/i;
page.on("pageerror", (error) => errors.push(error.message));
await context.route("**/*", route => {
  const url = new URL(route.request().url());
  if (tracker.test(url.href)) { trackers.push(url.href); return route.abort(); }
  if (url.origin !== new URL(base).origin) { external.push(url.hostname); return route.abort(); }
  // Never exercise business integrations during browser release checks.
  if (url.pathname.startsWith("/api/")) return route.abort();
  return route.continue();
});
try {
  for (const path of publicRoutes) {
    const response = await page.goto(base + path);
    assert.equal(response.status(), 200, path);
    await page.evaluate(() => document.fonts.ready);
    const title = await page.title();
    assert.ok(title.includes("Monetcore"), path);
    assert.ok(!titles.has(title), `Duplicate title: ${path}`); titles.add(title);
    assert.equal(await page.locator("h1").count(), 1, path);
    assert.equal(await page.locator("footer").count(), 1, path);
    assert.equal(new URL(await page.locator('link[rel="canonical"]').getAttribute("href")).href, new URL("https://monetcore.dev" + path).href);
    assert.ok(await page.locator('meta[name="description"]').getAttribute("content"));
    assert.doesNotMatch(await page.locator('meta[name="robots"]').getAttribute("content"), /noindex/);
    assert.equal(await page.locator('a[href="/assistant"]').count(), 0);
    assert.equal(await page.getByRole("combobox", { name: "Synthetic staging test case" }).count(), 0);
    const footer = page.locator("footer");
    assert.equal(await footer.locator('a[href="tel:+2347065880558"]').count(), 1);
    assert.equal(await footer.locator('a[href="mailto:hello@monetcore.dev"]').count(), 1);
    assert.equal(await footer.getByRole("link", { name: "Privacy Policy", exact: true }).getAttribute("href"), "/privacy");
    assert.equal(await page.evaluate(() => typeof window.va), "undefined");
  }
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base + "/");
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${width}px`);
    if (width === 390 || width === 1440) {
      const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      assert.deepEqual(result.violations.map(v => v.id), [], `${width}px accessibility`);
    }
  }
  for (const preference of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: preference, reducedMotion: "reduce" });
    await page.goto(base + "/contact");
    assert.equal(await page.locator("iframe").count(), 0);
    assert.ok(await page.getByRole("link", { name: "Open in Google Maps (opens in a new tab)", exact: true }).count());
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
  await page.goto(base + "/privacy");
  const policy = await page.locator("main").innerText();
  assert.ok(policy.includes("Monetcore System Solutions is responsible for handling privacy requests"));
  assert.ok(policy.includes("does not implement an automated deletion schedule"));
  assert.ok(policy.includes("arrangements remain under review and have not been confirmed as approved or completed"));
  await page.goto(base + "/website-packages");
  const prices = await page.locator("main").innerText();
  assert.doesNotMatch(prices, /proposed|business approval|approval pending/i);
  for (const amount of ["₦99,000", "₦45,000", "₦179,000", "₦60,000", "Starting from ₦299,000", "From ₦90,000"]) assert.ok(prices.includes(amount), amount);
  for (const path of ["/assistant", "/assistant?test=case-01", "/assistant?_rsc=synthetic"]) {
    const response = await page.request.get(base + path);
    assert.equal(response.status(), 503, path);
    assert.match(response.headers()["cache-control"], /no-store/);
    assert.match(response.headers()["x-robots-tag"], /noindex/);
    assert.doesNotMatch(await response.text(), /Synthetic staging test case|<select|owner AI test|AI_OWNER_PASSWORD/);
  }
  const denied = await page.request.post(base + "/api/assistant", {
    data: { messages: ["Synthetic release check"] },
    headers: { origin: base, "x-monetcore-test-case": "case-01" },
  });
  assert.equal(denied.status(), 503);
  const sitemap = await (await page.request.get(base + "/sitemap.xml")).text();
  assert.ok(sitemap.includes("https://monetcore.dev"));
  assert.ok(!sitemap.includes("/assistant"));
  const robots = await (await page.request.get(base + "/robots.txt")).text();
  assert.match(robots, /Allow: \//);
  assert.deepEqual(trackers, []); assert.deepEqual(external, []); assert.deepEqual(errors, []);
  console.log(`PASS production emulation: ${publicRoutes.length} public routes, titles/canonicals, contact/footer links, eight widths, light/dark preferences, axe, disabled private assistant, sitemap and zero trackers/external requests/errors.`);
} finally { await browser.close(); }
