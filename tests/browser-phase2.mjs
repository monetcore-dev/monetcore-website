import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import fs from "node:fs";

const base = process.env.QA_BASE_URL || "http://127.0.0.1:4700";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  assert.equal((await page.request.post(base + "/api/contact", { data: {} })).status(), 403);
  await page.goto(base);
  await page.getByRole("button", { name: "Dismiss preview notice" }).click();
  const solutions = page.getByRole("button", { name: "Solutions & Services", exact: true });
  await solutions.focus();
  await page.keyboard.press("ArrowUp");
  await page.waitForFunction(() => document.activeElement?.closest(".mega-bottom"));
  await page.keyboard.press("Escape");
  assert.equal(await solutions.evaluate((el) => el === document.activeElement), true);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Open navigation menu", exact: true }).click();
  assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
  const last = page.getByRole("navigation", { name: "Main navigation", exact: true }).getByRole("link", { name: "Book a Consultation", exact: true });
  await last.focus();
  await page.keyboard.press("Tab");
  assert.equal(await page.locator(".brand-lockup").evaluate((el) => el === document.activeElement), true);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForFunction(() => document.querySelector(".mobile-menu-toggle").getAttribute("aria-expanded") === "false");
  assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator(".mobile-menu-toggle").getAttribute("aria-expanded"), "false");
  assert.equal(await page.locator(".primary-navigation").isVisible(), false);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator("h1").click();
  await page.mouse.move(0, 0);
  const flow = page.locator(".hero-flow").first();
  const before = await flow.evaluate((el) => getComputedStyle(el).transform);
  await page.waitForTimeout(200);
  assert.notEqual(await flow.evaluate((el) => getComputedStyle(el).transform), before);
  assert.equal(await page.locator(".ai-core").evaluate((el) => getComputedStyle(el).borderTopWidth), "0px");
  await page.getByRole("button", { name: "Pause AI Core animation" }).click();
  assert.equal(await flow.evaluate((el) => getComputedStyle(el).animationPlayState), "paused");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.deepEqual(await page.locator(".hero-flow").evaluateAll((elements) => elements.map((el) => getComputedStyle(el).animationName)), ["none", "none", "none"]);
  fs.mkdirSync("/workspace/artifacts/phase2", { recursive: true });
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `/workspace/artifacts/phase2/hero-${width}.png` });
  }
  assert.deepEqual(errors, []);
  console.log("PASS desktop ArrowUp/Escape focus, mobile Tab wrap, breakpoint reset/scroll unlock, full-background animation, shared pause, reduced motion and four responsive screenshots");
} finally {
  await browser.close();
}
