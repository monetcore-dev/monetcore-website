import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4600";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw new Error("Local preview only");
const dir = "/workspace/artifacts/ai-core";
fs.mkdirSync(dir, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "no-preference",
});
const page = await context.newPage();
const errors = [],
  api = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (message) => {
  if (
    message.type() === "error" &&
    /hydrat|did not match|server rendered|Minified React error/i.test(
      message.text(),
    )
  )
    errors.push(message.text());
});
page.on("request", (r) => {
  if (new URL(r.url()).pathname.startsWith("/api/")) api.push(r.url());
});
const links = [
  ["AI Automation", "/services/ai-automation"],
  ["Software Development", "/services/software-development"],
  ["Digital Marketing", "/services/digital-marketing"],
  ["Business Integrations", "/services/business-integrations"],
  ["Smart Products", "/products"],
];
try {
  assert.equal(
    (await page.request.post(base + "/api/contact", { data: {} })).status(),
    403,
  );
  await page.addInitScript(() => {
    window.__coreCLS = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries())
        if (!entry.hadRecentInput) window.__coreCLS += entry.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("button", { name: "Dismiss preview notice" }).click();
  const core = page.getByRole("region", {
    name: "Monetcore AI Core",
    exact: true,
  });
  assert.equal(await page.locator(".technology-showcase").count(), 0);
  assert.equal(await core.getByRole("link").count(), 5);
  const heading = await page.locator("#corporate-hero h1").innerText();
  assert.match(heading, /Build smarter.*Automate faster.*Grow further/s);
  assert.equal(
    await page
      .locator("#corporate-hero")
      .getByRole("link", { name: /Start Your Project/ })
      .getAttribute("href"),
    "#contact",
  );
  assert.equal(
    await page
      .locator("#corporate-hero")
      .getByRole("link", { name: "Explore Our Solutions", exact: true })
      .getAttribute("href"),
    "#services",
  );
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: width === 375 ? "dark" : "light" });
    const initial = await core.boundingBox();
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `${width}px overflow`,
    );
    for (const [name, href] of links) {
      const node = core.getByRole("link", { name, exact: true });
      assert.equal(await node.getAttribute("href"), href);
      await node.focus();
      assert.equal(await core.locator(".ai-core-detail p").innerText(), name);
      assert.ok(await node.evaluate((el) => el === document.activeElement));
      const box = await node.boundingBox();
      assert.ok(box.height >= 44, `${width}px touch height ${name}`);
      assert.ok(
        box.x >= initial.x &&
          box.x + box.width <= initial.x + initial.width + 1,
        `${width}px clipped ${name}`,
      );
      assert.ok(
        Math.abs((await core.boundingBox()).height - initial.height) < 1,
        `${width}px detail shift ${name}`,
      );
      const paused = await core
        .locator(".ai-core-orbit-track")
        .first()
        .evaluate((el) => getComputedStyle(el).animationPlayState);
      assert.equal(paused, "paused");
    }
  }
  console.log(
    "PASS five node labels/routes, keyboard descriptions, touch targets, no clipping/overflow or detail shifts at eight widths",
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator("h1").click();
  await page.mouse.move(0, 0);
  const track = core.locator(".ai-core-orbit-track").first();
  assert.equal(
    await track.evaluate((el) => getComputedStyle(el).animationPlayState),
    "running",
  );
  const first = await track.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(250);
  const second = await track.evaluate((el) => getComputedStyle(el).transform);
  assert.notEqual(first, second);
  await core.getByRole("button", { name: "Pause AI Core animation" }).click();
  await page.locator("h1").click();
  await page.mouse.move(0, 0);
  assert.equal(
    await track.evaluate((el) => getComputedStyle(el).animationPlayState),
    "paused",
  );
  const stopped = await track.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(250);
  assert.equal(
    await track.evaluate((el) => getComputedStyle(el).transform),
    stopped,
  );
  await core.getByRole("button", { name: "Resume AI Core animation" }).click();
  await page.locator("h1").click();
  await page.mouse.move(0, 0);
  assert.equal(
    await track.evaluate((el) => getComputedStyle(el).animationPlayState),
    "running",
  );
  await core.hover();
  assert.equal(
    await track.evaluate((el) => getComputedStyle(el).animationPlayState),
    "paused",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await track.evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  assert.ok(await core.getByText("Static view", { exact: true }).isVisible());
  assert.equal(
    await core
      .getByRole("button", { name: "Pause AI Core animation" })
      .isVisible(),
    false,
  );
  console.log(
    "PASS measured CSS motion, pause/resume, hover/focus pausing and static reduced-motion alternative",
  );
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [name] of links) {
      await core.getByRole("link", { name, exact: true }).focus();
      const axe = await new AxeBuilder({ page })
        .include(".ai-core")
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
      );
    }
  }
  for (const [name, href] of links) {
    await page.goto(base);
    await page
      .getByRole("region", { name: "Monetcore AI Core", exact: true })
      .getByRole("link", { name, exact: true })
      .focus();
    await page.keyboard.press("Enter");
    await page.waitForURL(base + href);
    assert.equal(await page.locator("h1").count(), 1);
  }
  console.log(
    "PASS axe checks for all focused states and keyboard Enter navigation for all five nodes",
  );
  const touchContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const touchPage = await touchContext.newPage();
  touchPage.on("pageerror", (e) => errors.push(e.message));
  touchPage.on("console", (message) => {
    if (
      message.type() === "error" &&
      /hydrat|did not match|server rendered|Minified React error/i.test(
        message.text(),
      )
    )
      errors.push(message.text());
  });
  touchPage.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api/")) api.push(r.url());
  });
  for (const [name, href] of links) {
    await touchPage.goto(base);
    await touchPage
      .getByRole("region", { name: "Monetcore AI Core", exact: true })
      .getByRole("link", { name, exact: true })
      .tap();
    await touchPage.waitForURL(base + href);
  }
  await touchContext.close();
  console.log("PASS mobile touch navigation for all five nodes");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base);
  await page.getByRole("button", { name: "Dismiss preview notice" }).click();
  await page
    .locator("#corporate-hero")
    .screenshot({ path: dir + "/hero-mobile-390.png" });
  await page
    .locator(".ai-core")
    .screenshot({ path: dir + "/core-mobile-390.png" });
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(base);
  await page.getByRole("button", { name: "Dismiss preview notice" }).click();
  await page.screenshot({ path: dir + "/hero-desktop-1440.png" });
  await page
    .locator(".ai-core")
    .screenshot({ path: dir + "/core-desktop-1440.png" });
  assert.deepEqual(api, []);
  assert.deepEqual(errors, []);
  const cls = await page.evaluate(() => window.__coreCLS);
  assert.ok(cls < 0.01, `CLS ${cls}`);
  console.log(
    "PASS zero API calls, no browser exceptions; observed final navigation CLS:",
    cls,
  );
} finally {
  await browser.close();
}
