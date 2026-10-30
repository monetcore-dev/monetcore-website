// Local lab measurements, not Lighthouse scores or real-device Core Web Vitals.
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4617";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = "/workspace/artifacts/monetcore-internal-heroes";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const results = [];
async function isolate(context) {
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    return url.origin !== new URL(base).origin ||
      url.pathname.startsWith("/api/")
      ? route.abort()
      : route.continue();
  });
}
try {
  for (const route of [
    "/services/ai-automation",
    "/services/website-development",
  ])
    for (let sample = 1; sample <= 3; sample++) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        reducedMotion: "no-preference",
      });
      await isolate(context);
      await context.addInitScript(() => {
        window.loadMetrics = { cls: 0, lcp: 0 };
        new PerformanceObserver((list) => {
          for (const e of list.getEntries())
            if (!e.hadRecentInput) window.loadMetrics.cls += e.value;
        }).observe({ type: "layout-shift", buffered: true });
        new PerformanceObserver((list) => {
          for (const e of list.getEntries())
            window.loadMetrics.lcp = e.startTime;
        }).observe({ type: "largest-contentful-paint", buffered: true });
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,
        downloadThroughput: 200000,
        uploadThroughput: 93750,
      });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      assert.equal((await page.goto(base + route)).status(), 200);
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1500);
      const measured = await page.evaluate(() => ({
        ...window.loadMetrics,
        resourceBytes: performance
          .getEntriesByType("resource")
          .reduce((n, r) => n + r.transferSize, 0),
        svgBytes: new TextEncoder().encode(
          document.querySelector("[data-hero-visual]").outerHTML,
        ).byteLength,
      }));
      assert.ok(measured.lcp > 0);
      assert.ok(measured.cls <= 0.1, `layout shift ${route}`);
      assert.ok(measured.svgBytes < 12000);
      results.push({ route, sample, ...measured });
      await context.close();
    }
  const staticContext = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  await isolate(staticContext);
  const page = await staticContext.newPage();
  await page.goto(base + "/services/ai-automation");
  const hero = page.locator("[data-page-hero]");
  assert.ok(await hero.locator("h1").isVisible());
  const toggle = hero.getByRole("checkbox", {
    name: "Pause banner background animation",
  });
  await toggle.focus();
  await page.keyboard.press("Space");
  assert.ok(await toggle.isChecked());
  assert.ok(
    await hero
      .locator("[data-hero-visual]")
      .evaluate((svg) =>
        [...svg.querySelectorAll("*")].every(
          (el) => getComputedStyle(el).animationPlayState === "paused",
        ),
      ),
  );
  await staticContext.close();
  await fs.mkdir(output, { recursive: true });
  await fs.writeFile(
    output + "/performance.json",
    JSON.stringify(
      {
        environment:
          "Headless Chromium, 390x844, fresh contexts/cache disabled, 4x CPU throttling, 150ms latency, 1.6Mbps download / 0.75Mbps upload; localhost; not Lighthouse or field data",
        results,
        noJavaScriptHeroAndKeyboardPause: true,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS six mobile lab samples: bounded inline SVG and CLS; server-rendered banner/pause works with page JavaScript disabled. Results: " +
      output +
      "/performance.json",
  );
} finally {
  await browser.close();
}
