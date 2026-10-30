import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4612";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const output = "/workspace/artifacts/monetcore-color-consistency";
await mkdir(output, { recursive: true });
const prior = process.env.QA_COLOR_DESKTOP_BASELINE
  ? JSON.parse(await readFile(process.env.QA_COLOR_DESKTOP_BASELINE, "utf8"))
  : null;
const footer = [
  ".site-footer",
  ".site-footer .footer-intro",
  ".site-footer h2",
  ".site-footer li a",
  ".site-footer address a",
  ".site-footer .text-white",
  ".site-footer .brand-mark",
  ".site-footer .brand-lockup strong",
  ".site-footer .brand-lockup small",
  ".site-footer > div > p",
];
const conversion = [
  ".corporate-conversion",
  ".conversion-copy .eyebrow",
  ".conversion-copy h2",
  ".conversion-copy > p:not(.eyebrow)",
  ".conversion-primary",
  ".conversion-secondary",
  ".conversion-whatsapp",
];
const explorer = [
  "#explore-solutions",
  ".solution-explorer-heading .eyebrow",
  ".solution-explorer-heading > p",
  ".solution-selector button",
  ".solution-selector button > span",
  ".solution-experience",
  ".automation-simulation",
  ".simulation-heading",
  ".simulation-heading > span",
  ".simulation-stages li > span",
  ".simulation-stages strong",
  ".simulation-output",
  ".simulation-output p",
  ".simulation-output > span",
  ".simulation-controls button",
  ".simulation-disclosure",
];
const sections = [
  "#corporate-hero",
  "#corporate-hero h1",
  "#corporate-hero h1 span",
  "#services",
  "#products",
  "#smart-websites",
  "#live-demos",
  "#about",
  "#process",
  "#faq",
  "#contact",
];
const properties = [
  "color",
  "backgroundColor",
  "backgroundImage",
  "borderTopColor",
  "borderBottomColor",
  "borderLeftColor",
  "borderRightColor",
  "boxShadow",
];
function snapshot({ selectors, properties }) {
  return Object.fromEntries(
    selectors.map((sel) => [
      sel,
      [...document.querySelectorAll(sel)].map((el) => {
        const s = getComputedStyle(el);
        return Object.fromEntries(properties.map((p) => [p, s[p]]));
      }),
    ]),
  );
}
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
let groups = 0;
try {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    hasTouch: true,
  });
  const errors = [],
    external = [],
    api = [];
  await context.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (u.origin !== new URL(base).origin) {
      external.push(u.origin);
      return route.abort();
    }
    if (u.pathname.startsWith("/api/")) {
      api.push(u.pathname);
      return route.abort();
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  let desktop, stageColors, categoryColors;
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    const dismiss = page.getByRole("button", {
      name: "Dismiss preview notice",
    });
    if (await dismiss.isVisible()) await dismiss.click();
    await page.mouse.move(0, 0);
    const selectors = [...footer, ...conversion, ...explorer, ...sections];
    const initial = await page.evaluate(snapshot, { selectors, properties });
    for (const selector of selectors)
      assert.ok(initial[selector].length, `missing ${selector}`);
    if (width === 1440) {
      desktop = initial;
      if (prior)
        for (const [selector, colors] of Object.entries(prior))
          assert.deepEqual(
            initial[selector],
            colors,
            `desktop unchanged ${selector}`,
          );
    } else assert.deepEqual(initial, desktop, `shared home palette ${width}`);
    const sim = page.locator(".automation-simulation");
    await sim.getByRole("button", { name: "Run Demo", exact: true }).click();
    const stages = [];
    for (let n = 1; n <= 4; n++) {
      await page.waitForFunction(
        (n) =>
          document
            .querySelector(".simulation-output")
            .textContent.includes(`Stage ${n} of 4`),
        n,
      );
      await page.mouse.move(0, 0);
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      stages.push(
        await page.evaluate(snapshot, { selectors: explorer, properties }),
      );
    }
    if (width === 1440) stageColors = stages;
    else
      assert.deepEqual(
        stages,
        stageColors,
        `active/completed stage palettes ${width}`,
      );
    await sim.getByRole("button", { name: "Reset Demo", exact: true }).click();
    const categories = [];
    for (const id of ["ai", "software", "websites", "integrations"]) {
      const button = page.locator(`#solution-button-${id}`);
      await button.click();
      await page.waitForFunction(
        (id) =>
          document.getElementById(id)?.getAttribute("aria-pressed") === "true",
        await button.getAttribute("id"),
      );
      await page.mouse.move(0, 0);
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      categories.push(
        await page.evaluate(snapshot, {
          selectors: [
            "#explore-solutions",
            ".solution-selector button",
            ".solution-selector button > span",
            ".solution-experience",
            ".solution-description",
            ".capability-visual",
          ],
          properties,
        }),
      );
    }
    if (width === 1440) categoryColors = categories;
    else
      for (let i = 0; i < categories.length; i++)
        assert.deepEqual(
          categories[i],
          categoryColors[i],
          `solution category ${i} palette ${width}`,
        );
    await page
      .getByRole("group", { name: "Solution categories" })
      .getByRole("button", { name: "AI Automation", exact: true })
      .click();
    for (const selector of [
      ".site-footer",
      ".corporate-conversion",
      "#explore-solutions",
    ]) {
      const results = await new AxeBuilder({ page })
        .include(selector)
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
        `a11y ${selector} ${width}`,
      );
    }
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    if (width === 390)
      for (const a of await page
        .locator(".site-footer li a,.site-footer address a")
        .all())
        assert.ok((await a.boundingBox()).height >= 44);
    if (width !== 768) {
      await page.locator(".site-footer").screenshot({
        path: `${output}/footer-${width}.png`,
        style: "header{visibility:hidden!important}",
      });
      await page.locator(".corporate-conversion").screenshot({
        path: `${output}/conversion-${width}.png`,
        style: "header{visibility:hidden!important}",
      });
      await page.locator("#explore-solutions").screenshot({
        path: `${output}/solutions-${width}.png`,
        style: "header{visibility:hidden!important}",
      });
    }
    groups++;
  }
  for (const path of [
    "/contact",
    "/book",
    "/products/ai-lead-automation",
    "/product-showcase",
    "/privacy",
    "/website-packages",
  ]) {
    let shared;
    for (const width of [1440, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(base + path);
      await page.evaluate(() => document.fonts.ready);
      await page.mouse.move(0, 0);
      const current = await page.evaluate(snapshot, {
        selectors: [
          ...footer,
          'main input[name="email"]',
          'main textarea[name="message"]',
        ],
        properties,
      });
      if (width === 1440) shared = current;
      else assert.deepEqual(current, shared, `${path} shared colors ${width}`);
      for (const selector of footer)
        assert.deepEqual(
          current[selector],
          desktop[selector],
          `same footer on ${path}`,
        );
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${path} overflow ${width}`,
      );
    }
    const axe = await new AxeBuilder({ page })
      .include(".site-footer")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      axe.violations.map((v) => v.id),
      [],
    );
    groups++;
  }
  await page.goto(base);
  await page.setViewportSize({ width: 390, height: 1000 });
  for (const scheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: scheme });
    await page.mouse.move(0, 0);
    assert.deepEqual(
      await page.evaluate(snapshot, {
        selectors: [...footer, ...conversion],
        properties,
      }),
      Object.fromEntries(
        [...footer, ...conversion].map((s) => [s, desktop[s]]),
      ),
    );
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  assert.deepEqual(api, []);
  console.log(
    `PASS ${groups} color-consistency groups at 390/768/1440: shared footer on seven pages, conversion, all solution categories, all workflow states, contrast, mobile touch targets, light/dark preference, zero API/external requests. Pre-change desktop baseline compared: ${!!prior}.`,
  );
} finally {
  await browser.close();
}
