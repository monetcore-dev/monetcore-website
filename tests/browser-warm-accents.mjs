import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4612";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const output = "/workspace/artifacts/monetcore-warm-accents";
await mkdir(output, { recursive: true });
const baseline = process.env.QA_WARM_BASELINE
  ? JSON.parse(await readFile(process.env.QA_WARM_BASELINE, "utf8"))
  : null;
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const measurements = [];
try {
  const context = await browser.newContext({
    reducedMotion: "no-preference",
    hasTouch: true,
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
  const hero = page.locator("#corporate-hero");
  let palette;
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.mouse.move(0, 0);
    const current = await page.evaluate(() => ({
      text: document.querySelector("main").innerText,
      links: [...document.querySelectorAll("main a")].map((a) => [
        a.textContent,
        a.getAttribute("href"),
      ]),
      layout: [...document.querySelectorAll("main > section")].map((el) => ({
        id: el.id,
        height: el.getBoundingClientRect().height,
      })),
      electrons: [...document.querySelectorAll("[data-electron]")].map(
        (el) => ({
          path: el.style.offsetPath,
          duration: el.style.animationDuration,
          delay: el.style.animationDelay,
          direction: el.style.animationDirection,
          position: el.style.offsetDistance,
          radii: [...el.querySelectorAll("circle")].map((c) =>
            Number(c.getAttribute("r")),
          ),
        }),
      ),
      orbit: [...document.querySelectorAll("[data-electron]")].map((el) => {
        const p = el.parentElement.querySelector("path");
        return {
          path: p.getAttribute("d"),
          opacity: getComputedStyle(p).opacity,
          width: getComputedStyle(p).strokeWidth,
        };
      }),
    }));
    if (baseline) {
      const old = baseline[width];
      assert.deepEqual(current.text, old.text);
      assert.deepEqual(current.links, old.links);
      assert.deepEqual(current.layout, old.layout);
      assert.deepEqual(current.orbit, old.orbit);
      assert.deepEqual(
        current.electrons.map((e) => ({
          path: e.path,
          duration: e.duration,
          delay: e.delay,
          direction: e.direction,
          position: e.position,
        })),
        old.electrons.map((e) => ({
          path: e.path,
          duration: e.duration,
          delay: e.delay,
          direction: e.direction,
          position: e.position,
        })),
      );
      for (let i = 0; i < 4; i++)
        for (const j of [3, 4])
          assert.ok(
            current.electrons[i].radii[j] / old.electrons[i].radii[j] >= 1.25 &&
              current.electrons[i].radii[j] / old.electrons[i].radii[j] <= 1.35,
          );
    }
    assert.deepEqual(
      current.electrons.map((e) => e.duration),
      ["32s", "41s", "47s", "56s"],
    );
    assert.deepEqual(
      current.electrons.map((e) => e.delay),
      ["-7s", "-22s", "-13s", "-38s"],
    );
    assert.deepEqual(
      current.electrons.map((e) => e.direction),
      ["normal", "reverse", "normal", "reverse"],
    );
    assert.deepEqual(
      current.electrons.map((e) => e.radii),
      Array.from({ length: 4 }, () => [18, 11.5, 7.2, 4.3, 2.1]),
    );
    assert.deepEqual(
      current.orbit.map((e) => [e.opacity, e.width]),
      Array.from({ length: 4 }, () => ["0.28", "1px"]),
    );
    assert.equal(
      await hero
        .locator('[data-electron="3"]')
        .evaluate((el) => getComputedStyle(el).color),
      "rgb(249, 115, 22)",
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const colorSnapshot = await page.evaluate(() => {
      const selectors = [
        '#corporate-hero > div[aria-hidden="true"]',
        '#corporate-hero > div[aria-hidden="true"] > div',
        "#products",
        "#smart-websites",
        "#live-demos",
        ".solution-card:nth-child(2) .solution-icon",
        ".solution-card:nth-child(5) .solution-icon",
        '#products article:first-child [class*="solutionIcon"]',
      ];
      return selectors.map((selector) => {
        const s = getComputedStyle(document.querySelector(selector));
        return [s.color, s.backgroundColor, s.backgroundImage, s.borderColor];
      });
    });
    palette ??= colorSnapshot;
    assert.deepEqual(
      colorSnapshot,
      palette,
      `same colors and gradients at ${width}`,
    );
    assert.equal(
      await hero.evaluate((el) => el.getAnimations({ subtree: true }).length),
      37,
      "no added decorative animations",
    );
    await hero.scrollIntoViewIfNeeded();
    const frames = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const values = [];
          let prior;
          function frame(t) {
            if (prior !== undefined) values.push(t - prior);
            prior = t;
            if (values.length === 30) resolve(values);
            else requestAnimationFrame(frame);
          }
          requestAnimationFrame(frame);
        }),
    );
    measurements.push({
      width,
      samples: frames.length,
      meanFrameIntervalMs: frames.reduce((a, b) => a + b, 0) / frames.length,
      maxFrameIntervalMs: Math.max(...frames),
    });
    const electron = hero.locator('[data-electron="0"]');
    const first = await electron.boundingBox();
    await page.waitForTimeout(250);
    const next = await electron.boundingBox();
    assert.ok(Math.hypot(next.x - first.x, next.y - first.y) > 1);
    if (width === 390 || width === 1440) {
      await hero.screenshot({
        path: `${output}/hero-${width}.png`,
        animations: "allow",
        style: "header{visibility:hidden!important}",
      });
      await page.locator("#products").screenshot({
        path: `${output}/saas-${width}.png`,
        animations: "allow",
        style: "header{visibility:hidden!important}",
      });
      await page.locator("#live-demos").screenshot({
        path: `${output}/discovery-${width}.png`,
        animations: "allow",
        style: "header{visibility:hidden!important}",
      });
    }
    const quote = page
      .locator("#products article")
      .first()
      .getByRole("link", { name: /Get a Quote/ });
    await quote.hover();
    assert.equal(
      await quote.evaluate((el) => getComputedStyle(el).borderColor),
      "rgb(251, 113, 133)",
    );
    for (const selector of [
      "#corporate-hero",
      "#services",
      "#products",
      "#live-demos",
    ]) {
      if (!(await page.locator(selector).count())) continue;
      const axe = await new AxeBuilder({ page })
        .include(selector)
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
        `contrast/a11y ${selector} ${width}`,
      );
    }
  }
  for (const scheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: scheme });
    assert.equal(
      await page
        .locator("#products")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      "rgb(7, 17, 38)",
    );
  }
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await hero.evaluate((el) => el.getAnimations({ subtree: true }).length),
    0,
  );
  const frozen = await hero.locator('[data-electron="0"]').boundingBox();
  await page.waitForTimeout(200);
  assert.deepEqual(
    await hero.locator('[data-electron="0"]').boundingBox(),
    frozen,
  );
  await hero.screenshot({
    path: `${output}/hero-390-reduced-motion.png`,
    style: "header{visibility:hidden!important}",
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  assert.deepEqual(api, []);
  await writeFile(
    `${output}/frame-observations.json`,
    JSON.stringify(
      {
        environment: "Local headless Chromium; not a physical-device benchmark",
        baselineCompared: !!baseline,
        measurements,
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS warm accents at 390/768/1440: core growth, unchanged orbit/timing/line brightness, palette consistency, motion, accessibility, reduced motion, zero external/API requests. Baseline compared: ${!!baseline}.`,
  );
  console.log(JSON.stringify(measurements));
} finally {
  await browser.close();
}
