import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4612";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = "/workspace/artifacts/monetcore-product-discovery";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
let checks = 0;
try {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
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
  for (const path of ["/", "/product-showcase"]) {
    await page.goto(base + path);
    await page.evaluate(() => document.fonts.ready);
    const dismiss = page.getByRole("button", {
      name: "Dismiss preview notice",
    });
    if (await dismiss.isVisible()) await dismiss.click();
    const scope =
      path === "/"
        ? page.locator("#live-demos")
        : page.locator("#main-content");
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 960 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow ${path} ${width}`,
      );
      for (const el of await scope
        .locator("h1,h2,h3,p,article,a,button")
        .all()) {
        const b = await el.boundingBox();
        assert.ok(
          b && b.x >= 0 && b.x + b.width <= width + 1,
          `clipped ${path} ${width}`,
        );
      }
      const a11y = await new AxeBuilder({ page })
        .include(path === "/" ? "#live-demos" : "#main-content")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        a11y.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
        `axe ${path} ${width}`,
      );
      const label = path === "/" ? "homepage-discovery" : "product-showcase";
      if (path === "/")
        await scope.screenshot({
          path: `${output}/${label}-${width}.png`,
          animations: "allow",
          style: "header{visibility:hidden!important}",
        });
      else
        await page.screenshot({
          path: `${output}/${label}-${width}.png`,
          fullPage: true,
          animations: "allow",
          style: "header{visibility:hidden!important}",
        });
      checks++;
    }
    for (const colorScheme of ["light", "dark"]) {
      await page.emulateMedia({ colorScheme });
      assert.equal(
        await scope.evaluate((el) => getComputedStyle(el).backgroundColor),
        path === "/" ? "rgb(241, 245, 252)" : "rgb(245, 247, 252)",
      );
    }
    const demos = await scope
      .getByRole("link", { name: "View Service Demonstration", exact: true })
      .evaluateAll((items) => items.map((a) => a.getAttribute("href")));
    assert.equal(demos.length, 1);
    for (const href of demos) {
      await page.goto(new URL(href, base).href);
      assert.equal(new URL(page.url()).hash, "#experience");
      assert.equal(await page.locator("#experience").count(), 1);
    }
  }
  await page.goto(base);
  assert.equal(await page.locator("#live-demos article").count(), 4);
  assert.equal(
    await page.locator('#live-demos a[href="/demo/fintech"]').count(),
    0,
  );
  await page
    .getByRole("link", { name: "Explore All Products", exact: true })
    .click();
  await page.waitForURL("**/product-showcase");
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute("href"),
    "https://monetcore.dev/product-showcase",
  );
  const category = page.getByRole("navigation", { name: "Product categories" });
  for (const link of await category.getByRole("link").all()) {
    const href = await link.getAttribute("href");
    await link.click();
    assert.equal(new URL(page.url()).hash, href);
    assert.equal(await page.locator(href).count(), 1);
  }
  assert.equal(
    await page.getByRole("group", { name: /example views/ }).count(),
    0,
  );
  assert.equal(
    await page.getByText("Static illustration only.", { exact: false }).count(),
    4,
  );
  checks++;
  const quoteLinks = await page
    .locator("main a")
    .filter({ hasText: /^Request a Quotation/ })
    .evaluateAll((items) => items.map((a) => a.getAttribute("href")));
  assert.equal(quoteLinks.length, 5);
  for (const href of new Set(quoteLinks)) {
    await page.goto(new URL(href, base).href);
    assert.equal(new URL(page.url()).pathname, "/contact");
    if (new URL(href, base).searchParams.has("interest"))
      assert.match(
        await page.locator('textarea[name="message"]').inputValue(),
        /I'd like to discuss/,
      );
  }
  checks++;
  assert.equal((await page.request.get(base + "/demo/fintech")).status(), 200);
  await page.goto(base);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const motion = await page
    .locator("#live-demos article")
    .first()
    .evaluate((el) => ({
      duration: parseFloat(getComputedStyle(el).transitionDuration),
      transform: getComputedStyle(el).transform,
    }));
  assert.ok(motion.duration <= 0.001);
  assert.equal(motion.transform, "none");
  await page.locator("#live-demos").screenshot({
    path: `${output}/homepage-discovery-reduced-motion.png`,
    style: "header{visibility:hidden!important}",
  });
  checks++;
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  assert.deepEqual(api, []);
  console.log(
    `PASS ${checks} browser groups: responsive, accessibility, category navigation, static concept previews, service demonstration, enquiries, canonical, fintech redirect, reduced motion; no API or external requests.`,
  );
} finally {
  await browser.close();
}
