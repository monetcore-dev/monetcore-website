import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4612";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const output = "/workspace/artifacts/monetcore-mobile-workflow";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
let groups = 0;
try {
  const context = await browser.newContext({
    hasTouch: true,
    reducedMotion: "no-preference",
  });
  const errors = [],
    external = [],
    api = [];
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(base).origin) {
      external.push(url.origin);
      return route.abort();
    }
    if (url.pathname.startsWith("/api/")) {
      api.push(url.pathname);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(base);
  await page.evaluate(() => document.fonts.ready);
  const dismiss = page.getByRole("button", { name: "Dismiss preview notice" });
  if (await dismiss.isVisible()) await dismiss.click();
  const section = page.locator("#process"),
    shared = page.locator("#workflow-detail");
  const original = [],
    accents = [];
  for (const width of [768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.equal(
      await section.locator(".workflow-card-desktop:visible").count(),
      4,
    );
    assert.equal(
      await section.locator(".workflow-card-mobile:visible").count(),
      0,
    );
    assert.ok(await shared.isVisible());
    const height = (await shared.boundingBox()).height;
    for (let i = 0; i < 4; i++) {
      const button = page.locator(`#workflow-step-${i}`);
      await button.click();
      assert.equal(await button.getAttribute("aria-pressed"), "true");
      assert.equal(
        await button.getAttribute("aria-controls"),
        "workflow-detail",
      );
      const text = (await shared.innerText()).replace(/\s+/g, " ").trim();
      if (width === 768) {
        original.push(text);
        accents.push(
          await button.evaluate((el) =>
            getComputedStyle(el).getPropertyValue("--step-accent").trim(),
          ),
        );
      } else assert.equal(text, original[i]);
      assert.equal((await shared.boundingBox()).height, height);
    }
    const previous = section.getByRole("button", {
      name: "Previous Step",
      exact: true,
    });
    const next = section.getByRole("button", {
      name: "Next Step",
      exact: true,
    });
    assert.ok(await next.isDisabled());
    await previous.click();
    assert.equal(
      await page.locator("#workflow-step-2").getAttribute("aria-pressed"),
      "true",
    );
    await next.click();
    assert.ok(await next.isDisabled());
    await page.locator("#workflow-step-0").focus();
    await page.keyboard.press("Space");
    assert.ok(await previous.isDisabled());
    await next.focus();
    await page.keyboard.press("Enter");
    assert.equal(
      await page.locator("#workflow-step-1").getAttribute("aria-pressed"),
      "true",
    );
    const axe = await new AxeBuilder({ page })
      .include("#process")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      axe.violations.map((v) => v.id),
      [],
    );
    await section.screenshot({
      path: `${output}/workflow-${width}.png`,
      style: "header{visibility:hidden!important}",
    });
    groups++;
  }
  for (const width of [390, 640, 767]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(
      await section.locator(".workflow-card-mobile:visible").count(),
      4,
    );
    assert.equal(
      await section.locator(".workflow-card-desktop:visible").count(),
      0,
    );
    assert.ok(!(await shared.isVisible()));
    assert.equal(
      await section
        .getByRole("button", { name: "Next Step", exact: true })
        .count(),
      0,
    );
    for (let i = 0; i < 4; i++) {
      const button = page.locator(`#workflow-mobile-step-${i}`);
      if ((await button.getAttribute("aria-expanded")) === "true")
        await button.tap();
      await button.tap();
      assert.equal(await button.getAttribute("aria-expanded"), "true");
      const id = await button.getAttribute("aria-controls"),
        panel = page.locator("#" + id);
      assert.equal(
        await panel.getAttribute("aria-labelledby"),
        await button.getAttribute("id"),
      );
      assert.ok(await panel.isVisible());
      assert.equal(await panel.getAttribute("role"), "region");
      assert.equal(
        (await panel.innerText()).replace(/\s+/g, " ").trim(),
        original[i],
      );
      assert.equal(
        await section.locator(".workflow-detail-mobile:not([hidden])").count(),
        1,
      );
      assert.equal(
        await button.evaluate((el) =>
          getComputedStyle(el).getPropertyValue("--step-accent").trim(),
        ),
        accents[i],
      );
      assert.ok(
        await panel.evaluate(
          (el) =>
            el.previousElementSibling.matches(".workflow-card-mobile") &&
            el.parentElement.tagName === "LI",
        ),
      );
      const b = await button.boundingBox(),
        p = await panel.boundingBox(),
        li = await button.locator("..").boundingBox();
      assert.ok(
        p.y >= b.y + b.height - 1 && p.y + p.height <= li.y + li.height + 1,
      );
      assert.ok(
        await panel.evaluate(
          (el) =>
            el.scrollHeight <= el.clientHeight + 1 &&
            getComputedStyle(el).overflowY === "visible" &&
            getComputedStyle(el).maxHeight === "none",
        ),
      );
    }
    const last = page.locator("#workflow-mobile-step-3");
    await last.tap();
    assert.equal(await last.getAttribute("aria-expanded"), "false");
    assert.equal(
      await section.locator(".workflow-detail-mobile:not([hidden])").count(),
      0,
    );
    const first = page.locator("#workflow-mobile-step-0");
    await first.focus();
    await page.keyboard.press("Enter");
    assert.equal(await first.getAttribute("aria-expanded"), "true");
    await page.keyboard.press("Space");
    assert.equal(await first.getAttribute("aria-expanded"), "false");
    const second = page.locator("#workflow-mobile-step-1");
    await second.tap();
    const ids = await section
      .locator("[id]")
      .evaluateAll((items) => items.map((el) => el.id));
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const axe = await new AxeBuilder({ page })
      .include("#process")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      axe.violations.map((v) => v.id),
      [],
    );
    if (width === 390)
      await section.screenshot({
        path: `${output}/workflow-390.png`,
        style: "header{visibility:hidden!important}",
      });
    groups++;
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const panel = page.locator("#workflow-mobile-detail-1");
  assert.equal(
    await panel
      .locator(".workflow-detail-content")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  assert.ok(
    await page
      .locator("#workflow-mobile-step-1 .workflow-chevron")
      .evaluate(
        (el) => parseFloat(getComputedStyle(el).transitionDuration) <= 0.001,
      ),
  );
  groups++;
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  assert.deepEqual(api, []);
  console.log(
    `PASS ${groups} workflow browser groups: mobile inline single-open/collapse, original content parity, keyboard/ARIA/unique IDs, natural height, desktop previous/next, axe, reduced motion; zero API/external requests.`,
  );
} finally {
  await browser.close();
}
