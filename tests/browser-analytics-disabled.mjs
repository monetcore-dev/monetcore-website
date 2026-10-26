import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import fs from "node:fs";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4600";
if (!["localhost", "127.0.0.1"].includes(new URL(base).hostname))
  throw new Error("Local release-build test only");
const manifest = JSON.parse(
  fs.readFileSync(".next/prerender-manifest.json", "utf8"),
);
const routes = [
  ...new Set([
    ...Object.keys(manifest.routes).filter(
      (p) => !p.startsWith("/_") && !/\.[^/]+$/.test(p),
    ),
    "/contact",
    "/book",
    "/website-packages",
  ]),
];
const tracker =
  /\/_vercel\/(?:insights|speed-insights)|vercel-scripts\.com|vitals\.vercel-insights\.com|google-analytics\.com|googletagmanager\.com|connect\.facebook\.net|fbevents|clarity\.ms|hotjar|plausible\.io|segment\.(?:com|io)/i;
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const analytics = [],
  external = [],
  api = [],
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("**/*", (route) => {
  const u = new URL(route.request().url());
  if (tracker.test(u.href)) {
    analytics.push(u.pathname);
    return route.abort();
  }
  if (u.origin !== new URL(base).origin) {
    external.push(u.hostname);
    return route.abort();
  }
  if (u.pathname.startsWith("/api/")) {
    api.push(u.pathname);
    return route.abort();
  }
  return route.continue();
});
async function check() {
  await page.waitForLoadState("networkidle");
  const scripts = await page
    .locator("script[src]")
    .evaluateAll((nodes) => nodes.map((n) => n.src));
  assert.ok(
    scripts.every((src) => !tracker.test(src)),
    scripts.filter((src) => tracker.test(src)),
  );
  assert.equal(await page.evaluate(() => typeof window.va), "undefined");
  assert.equal(
    await page
      .locator("footer")
      .getByRole("link", { name: "Privacy Policy", exact: true })
      .getAttribute("href"),
    "/privacy",
  );
}
try {
  for (const route of routes) {
    const r = await page.goto(base + route);
    assert.equal(r.status(), 200, route);
    await check();
  }
  // Exercise native client-side routing as well as initial full-page loads.
  await page.goto(base + "/");
  await page
    .locator("footer")
    .getByRole("link", { name: "Privacy Policy", exact: true })
    .click();
  await page.waitForURL("**/privacy");
  await check();
  const policy = await page.locator("main").innerText();
  assert.ok(policy.includes("Vercel Web Analytics is temporarily disabled"));
  assert.ok(
    policy.includes("does not make the website tracking-free or cookie-free"),
  );
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of ["/", "/contact", "/privacy"]) {
      await page.goto(base + route);
      await check();
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${width}px ${route}`,
      );
    }
  }
  await page.goto(base + "/contact");
  assert.equal(await page.locator("iframe").count(), 0);
  assert.deepEqual(analytics, []);
  assert.deepEqual(external, []);
  assert.deepEqual(api, []);
  assert.deepEqual(errors, []);
  console.log(
    `PASS ${routes.length} routes and client-side navigation: no Vercel Analytics scripts, tracker requests or window.va initialization`,
  );
  console.log(
    "PASS mobile/tablet layouts, disabled-analytics policy, privacy footer link and no Maps iframe",
  );
  console.log(
    "PASS zero external/API requests and no browser exceptions; release-mode local build only",
  );
} finally {
  await browser.close();
}
