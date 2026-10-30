import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4651";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = "/workspace/artifacts/monetcore-unified-premium-20261030";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
try {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  await context.route("**/*", route => new URL(route.request().url()).origin === new URL(base).origin && !new URL(route.request().url()).pathname.startsWith("/api/") ? route.continue() : route.abort());
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base);
  const dismiss = page.getByRole("button", { name: "Dismiss preview notice" });
  if (await dismiss.isVisible()) await dismiss.click();
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator("header.site-header");
  const nav = header.getByRole("navigation", { name: "Main navigation" });
  const toggle = header.locator(".mobile-menu-toggle");
  const solutions = nav.getByRole("button", { name: "Solutions & Services", exact: true });
  const visibleFocus = async () => {
    assert.ok(await page.evaluate(() => {
      const el = document.activeElement, box = el?.getBoundingClientRect();
      return el instanceof HTMLElement && el !== document.body && box.width > 0 && box.height > 0 && box.x >= 0 && box.right <= innerWidth + 1 && box.y >= 0 && box.bottom <= innerHeight + 1;
    }), "Focus stays on a visible control");
  };
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    if (width < 1200) await toggle.click();
    for (const name of ["Solutions & Services", "Products", "Company"]) {
      const trigger = nav.getByRole("button", { name, exact: true });
      const panel = page.locator("#" + await trigger.getAttribute("aria-controls"));
      for (const [key, last] of [["ArrowDown", false], ["ArrowUp", true]]) {
        await trigger.focus();
        await page.keyboard.press(key);
        await page.waitForFunction(({ id, last }) => {
          const links = [...document.getElementById(id).querySelectorAll("a[href]")].filter(link => link.getClientRects().length && link.tabIndex >= 0 && link.getAttribute("aria-disabled") !== "true");
          return document.activeElement === (last ? links.at(-1) : links[0]);
        }, { id: await panel.getAttribute("id"), last });
        await visibleFocus();
        assert.equal(await trigger.getAttribute("aria-expanded"), "true");
        assert.equal(await panel.evaluate(el => getComputedStyle(el).animationName), "none");
        await page.keyboard.press("Escape");
        assert.equal(await trigger.getAttribute("aria-expanded"), "false");
        assert.ok(await trigger.evaluate(el => el === document.activeElement));
        assert.ok(await trigger.evaluate(el => parseFloat(getComputedStyle(el).outlineWidth) >= 3));
      }
    }
    if (width < 1200) {
      const last = nav.locator(".nav-consult");
      await last.focus();
      await page.keyboard.press("Shift+Tab");
      assert.ok(await nav.locator(".nav-contact").evaluate(el => el === document.activeElement));
      await last.focus();
      await page.keyboard.press("Tab");
      await page.waitForFunction(() => document.querySelector(".mobile-menu-toggle").getAttribute("aria-expanded") === "false");
      assert.ok(await page.evaluate(() => !document.querySelector("header").contains(document.activeElement)), "Tab exits navigation; no focus trap");
      assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
      await visibleFocus();
      await toggle.click();
      await solutions.press("ArrowDown");
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");
      assert.ok(await toggle.evaluate(el => el === document.activeElement));
    }
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${output}/navigation-${width}.png` });
    if (width === 390 || width === 1440) {
      const axe = await new AxeBuilder({ page }).include("header.site-header").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
      assert.deepEqual(axe.violations.map(v => v.id), []);
    }
  }
  // Resize in both directions, including focused controls that become hidden.
  for (let round = 0; round < 2; round++) {
    await page.setViewportSize({ width: 1199, height: 900 });
    await toggle.click();
    assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
    await solutions.press("ArrowDown");
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForFunction(() => document.querySelector(".mobile-menu-toggle").getAttribute("aria-expanded") === "false");
    assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
    assert.equal(await solutions.getAttribute("aria-expanded"), "false");
    await visibleFocus();
    await solutions.press("ArrowUp");
    await page.setViewportSize({ width: 1199, height: 900 });
    await page.waitForFunction(() => document.activeElement === document.querySelector(".mobile-menu-toggle"));
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    await visibleFocus();
    await page.setViewportSize({ width: 1200, height: 900 });
    await page.waitForFunction(() => document.activeElement === document.querySelector(".nav-home"));
    await visibleFocus();
  }
  await page.setViewportSize({ width: 1440, height: 400 });
  await solutions.press("ArrowUp");
  const panel = page.locator("#panel-solutions");
  await page.waitForFunction(() => document.querySelector("#panel-solutions").scrollTop > 0);
  const box = await panel.boundingBox();
  assert.ok(box.y >= 0 && box.y + box.height <= 400, "Short-screen panel fits viewport");
  assert.ok(await panel.evaluate(el => el.scrollHeight > el.clientHeight));
  await visibleFocus();
  await panel.screenshot({ path: `${output}/short-desktop-menu.png` });
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await solutions.press("ArrowDown");
  assert.notEqual(await panel.evaluate(el => getComputedStyle(el).animationName), "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await panel.evaluate(el => getComputedStyle(el).animationName), "none");
  // The existing global reduced-motion rule retains a tiny duration; no property may transition.
  assert.equal(await solutions.locator("svg").evaluate(el => getComputedStyle(el).transitionProperty), "none");
  assert.deepEqual(errors, []);
  console.log("PASS four widths, all mega-menu arrow endpoints/Escape, mobile Tab/Shift+Tab without trapping, repeated1199/1200 resets, visible focus, scroll restoration, short-screen containment, reduced motion and axe.");
} finally { await browser.close(); }
