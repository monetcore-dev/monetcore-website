import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { internalHeroRoutes } from "../app/config/pageHeroes.ts";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4616";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = "/workspace/artifacts/monetcore-internal-heroes";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const errors = [],
  external = [],
  api = [];
let checks = 0;
const metrics = [],
  screens = [];
try {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
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
  await page.addInitScript(() => {
    window.heroMetrics = { cls: 0, lcp: 0 };
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        if (!e.hadRecentInput) window.heroMetrics.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.heroMetrics.lcp = e.startTime;
    }).observe({ type: "largest-contentful-paint", buffered: true });
  });
  for (const [path, theme] of Object.entries(internalHeroRoutes)) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    assert.equal((await page.goto(base + path)).status(), 200, path);
    await page.evaluate(() => document.fonts.ready);
    const notice = page.getByRole("button", { name: "Dismiss preview notice" });
    if (await notice.isVisible()) await notice.click();
    const hero = page.locator("[data-page-hero]");
    assert.equal(await hero.count(), 1, path);
    assert.equal(await page.locator("h1").count(), 1, path);
    assert.equal(
      await hero
        .locator("svg[data-hero-visual]")
        .getAttribute("data-hero-visual"),
      theme,
      path,
    );
    assert.equal(
      await hero.locator("svg[data-hero-visual]").getAttribute("aria-hidden"),
      "true",
    );
    const background = await hero.evaluate(
      (el) => getComputedStyle(el).backgroundImage,
    );
    assert.ok(background.includes("rgb(8, 21, 45)"), `navy background ${path}`);
    assert.equal(
      await hero
        .locator('div[aria-hidden="true"]')
        .first()
        .evaluate((el) => getComputedStyle(el).opacity),
      "1",
      `background opacity ${path}`,
    );
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow ${path} ${width}`,
      );
      assert.equal(
        await hero.evaluate((el) => getComputedStyle(el).backgroundImage),
        background,
        `palette ${path} ${width}`,
      );
      for (const el of await hero.locator("h1,p,a,label,aside").all()) {
        if (!(await el.isVisible())) continue;
        const box = await el.boundingBox();
        assert.ok(
          box.x >= -1 && box.x + box.width <= width + 1,
          `clipping ${path} ${width}`,
        );
      }
      const axe = await new AxeBuilder({ page })
        .include("[data-page-hero]")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
        `accessibility ${path} ${width}`,
      );
      const motionLabel = hero.locator('label[for="page-hero-motion"]');
      if (await motionLabel.isVisible()) {
        const label = await motionLabel.boundingBox();
        for (const content of await hero.locator("h1,p,a,aside").all()) {
          if (!(await content.isVisible())) continue;
          const box = await content.boundingBox();
          assert.ok(
            box.y + box.height <= label.y ||
              box.x + box.width <= label.x ||
              box.x >= label.x + label.width,
            `motion control overlap ${path} ${width}`,
          );
        }
      }
      checks++;
    }
    for (const a of await hero.locator("a[href]").all()) {
      const href = await a.getAttribute("href");
      if (href.startsWith("#"))
        assert.equal(
          await page.locator(`[id="${href.slice(1)}"]`).count(),
          1,
          `anchor ${path} ${href}`,
        );
      else if (href.startsWith("/"))
        assert.ok(
          Object.hasOwn(internalHeroRoutes, new URL(href, base).pathname) ||
            new URL(href, base).pathname === "/",
          `route ${path} ${href}`,
        );
      else assert.ok(href.startsWith("mailto:"), `unexpected CTA ${href}`);
    }
    const toggle = hero.getByRole("checkbox", {
      name: "Pause banner background animation",
    });
    if (await toggle.count()) {
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
      await page.keyboard.press("Space");
      assert.ok(!(await toggle.isChecked()));
    }
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    assert.ok(
      await hero
        .locator("[data-hero-visual]")
        .evaluate((svg) =>
          [...svg.querySelectorAll("*")].every(
            (el) => getComputedStyle(el).animationName === "none",
          ),
        ),
    );
    assert.equal(
      await hero.evaluate((el) => getComputedStyle(el).backgroundImage),
      background,
    );
    await page.emulateMedia({
      reducedMotion: "no-preference",
      colorScheme: "light",
    });
    metrics.push({
      path,
      ...(await page.evaluate(() => window.heroMetrics)),
      svgBytes: Buffer.byteLength(
        await hero.locator("[data-hero-visual]").evaluate((el) => el.outerHTML),
      ),
    });
    if (
      [
        "/services/ai-automation",
        "/services/software-development",
        "/services/website-development",
        "/services/business-integrations",
        "/services/digital-marketing",
        "/products/smart-booking",
        "/about",
        "/contact",
        "/privacy",
        "/product-showcase",
      ].includes(path)
    ) {
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        const file =
          output +
          "/" +
          path.slice(1).replaceAll("/", "-") +
          "-" +
          width +
          ".png";
        await hero.screenshot({ path: file, animations: "allow" });
        screens.push(file);
      }
    }
  }
  await page.goto(base + "/");
  assert.equal(await page.locator("[data-page-hero]").count(), 0);
  assert.equal(await page.locator("#corporate-hero").count(), 1);
  checks++;
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  assert.deepEqual(api, []);
  await fs.writeFile(
    output + "/results.json",
    JSON.stringify(
      {
        checks,
        routes: 23,
        widths: [390, 768, 1440],
        metrics,
        screens,
        errors,
        external,
        api,
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS ${checks} responsive route checks; 23 hero themes, CTA destinations, axe checks, pause/keyboard, reduced motion, dark preference, homepage preservation; no external/API requests.`,
  );
} finally {
  await browser.close();
}
