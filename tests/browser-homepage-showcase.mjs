import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4612";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const output = "/workspace/artifacts/monetcore-homepage-showcase";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
let checks = 0;
try {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  const external = [],
    apis = [],
    errors = [];
  await context.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(base).origin) {
      external.push(url.origin);
      return route.abort();
    }
    if (url.pathname.startsWith("/api/")) {
      apis.push(url.pathname);
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
  const products = page.locator("#products"),
    tech = page.locator("#smart-websites");
  let palette;
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      `overflow ${width}`,
    );
    const current = await products.evaluate((el) => [
      getComputedStyle(el).backgroundColor,
      getComputedStyle(el).backgroundImage,
    ]);
    palette ??= current;
    assert.deepEqual(current, palette);
    for (const section of [products, tech]) {
      for (const item of await section.locator("h2,h3,p,article,a").all()) {
        const box = await item.boundingBox();
        assert.ok(
          box && box.x >= 0 && box.x + box.width <= width + 1,
          `clipping ${width}`,
        );
      }
      const results = await new AxeBuilder({ page })
        .include(`#${await section.getAttribute("id")}`)
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
        `axe ${width}`,
      );
    }
    await products.screenshot({
      path: `${output}/products-${width}.png`,
      animations: "allow",
      style: "header { visibility: hidden !important; }",
    });
    await tech.screenshot({
      path: `${output}/technology-${width}.png`,
      animations: "allow",
      style: "header { visibility: hidden !important; }",
    });
    checks++;
  }
  for (const colorScheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme });
    assert.deepEqual(
      await products.evaluate((el) => [
        getComputedStyle(el).backgroundColor,
        getComputedStyle(el).backgroundImage,
      ]),
      palette,
    );
  }
  const groups = tech.locator("ul");
  const groupWidth = (await groups.first().boundingBox()).width;
  const trackWidth = (await groups.first().locator("..").boundingBox()).width;
  assert.ok(
    Math.abs(trackWidth - 2 * groupWidth) < 1,
    "two identical seamless halves",
  );
  assert.equal(await products.locator("article").count(), 3);
  assert.equal(await products.getByText(/Illustrative interface ·/).count(), 3);
  assert.equal(
    await products
      .getByRole("link", { name: /Explore product information/ })
      .count(),
    0,
  );
  assert.ok(!(await tech.innerText()).includes("₦"));
  const motion = tech.locator("ul").first().locator("..");
  await page.mouse.move(0, 0);
  assert.equal(
    await motion.evaluate((el) => getComputedStyle(el).animationPlayState),
    "running",
  );
  await tech.getByRole("checkbox", { name: "Pause logo motion" }).check();
  assert.equal(
    await motion.evaluate((el) => getComputedStyle(el).animationPlayState),
    "paused",
  );
  await tech.getByRole("checkbox").uncheck();
  await page.locator("h1").click();
  await tech.hover();
  assert.equal(
    await motion.evaluate((el) => getComputedStyle(el).animationPlayState),
    "paused",
  );
  await products.hover();
  assert.equal(
    await motion.evaluate((el) => getComputedStyle(el).animationPlayState),
    "running",
  );
  await tech.getByRole("checkbox").focus();
  assert.equal(
    await motion.evaluate((el) => getComputedStyle(el).animationPlayState),
    "paused",
  );
  await tech.getByRole("checkbox").press("Space");
  assert.equal(await tech.getByRole("checkbox").isChecked(), true);
  checks++;
  for (const [slug, title] of [
    ["ai-lead-automation", "Monetcore AI Lead Automation"],
    ["smart-booking", "Smart Booking"],
    ["business-automation", "Business Automation"],
  ]) {
    await page.goto(base);
    const link = page.locator(`#products a[href*="${slug}"]`);
    const href = await link.getAttribute("href");
    assert.equal(
      new URL(href, base).searchParams.get("interest"),
      `product:${slug}`,
    );
    await link.click();
    await page.waitForURL("**/contact?**");
    assert.ok(
      (await page.locator('textarea[name="message"]').inputValue()).includes(
        title,
      ),
      `prefill ${slug}`,
    );
    checks++;
  }
  await page.goto(base + "/website-packages");
  assert.ok((await page.innerText("main")).includes("₦99,000"));
  await page.goto(base);
  await page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(
    await page
      .locator("#smart-websites ul")
      .first()
      .locator("..")
      .evaluate((el) => getComputedStyle(el).animationName),
    "none",
  );
  assert.equal(
    await page
      .locator('#smart-websites ul[aria-hidden="true"]')
      .evaluate((el) => getComputedStyle(el).display),
    "none",
  );
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 960 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const logos = page.locator("#smart-websites ul").first();
    for (const logo of await logos.locator("li").all()) {
      const b = await logo.boundingBox();
      assert.ok(b.x >= 0 && b.x + b.width <= width + 1);
    }
  }
  await page
    .locator("#smart-websites")
    .screenshot({
      path: `${output}/technology-reduced-motion.png`,
      style: "header { visibility: hidden !important; }",
    });
  checks++;
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  assert.deepEqual(apis, []);
  console.log(
    `PASS ${checks} showcase/browser groups: responsive, axe, prefills, pricing, motion, zero API/external requests. Screenshots: ${output}`,
  );
  await context.close();
} finally {
  await browser.close();
}
