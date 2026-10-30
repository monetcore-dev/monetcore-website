import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { internalHeroRoutes } from "../app/config/pageHeroes.ts";
const publicRoutes = [
  "/",
  ...Object.keys(internalHeroRoutes).filter((path) => path !== "/assistant"),
];
import { products, services } from "../app/config/offeringCatalog.ts";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4618";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const output = "/workspace/artifacts/monetcore-marketing-readiness";
await fs.mkdir(output, { recursive: true });
const links = new Set(),
  errors = [],
  external = [],
  api = [];
let responsive = 0;
try {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  await ctx.route("**/*", (route) => {
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
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  const retired = await page.request.get(base + "/demo/fintech", {
    maxRedirects: 0,
  });
  assert.equal(retired.status(), 308);
  assert.equal(retired.headers().location, "/products/fintech-products");
  const routeList = [...publicRoutes, "/assistant"];
  for (const path of routeList) {
    assert.equal((await page.goto(base + path)).status(), 200, path);
    await page.evaluate(() => document.fonts.ready);
    const dismiss = page.getByRole("button", {
      name: "Dismiss preview notice",
    });
    if (await dismiss.isVisible()) await dismiss.click();
    assert.doesNotMatch(await page.content(), /mone[\s_-]*pay/i, path);
    assert.equal(await page.locator("h1").count(), 1, path);
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `overflow ${path} ${width}`,
      );
      if (
        [
          "/products",
          "/products/fintech-products",
          "/product-showcase",
        ].includes(path)
      ) {
        const findings = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
          .analyze();
        assert.deepEqual(
          findings.violations.map((v) => ({
            id: v.id,
            target: v.nodes.map((n) => n.target),
          })),
          [],
          `accessibility ${path} ${width}`,
        );
      }
      responsive++;
    }
    if (products.some((p) => path === "/products/" + p.slug)) {
      assert.equal(await page.locator(".experience").count(), 0, path);
      assert.equal(
        await page
          .getByRole("link", {
            name: /Explore Demo|View Demonstration|Request a Demo/i,
          })
          .count(),
        0,
        path,
      );
      assert.match(
        await page.locator("meta[name=robots]").getAttribute("content"),
        /noindex/,
      );
      assert.equal(await page.locator("[data-page-hero]").count(), 1);
      assert.equal(
        await page.locator("#experience").count(),
        1,
        "retired deep anchor now leads to enquiry",
      );
    }
    if (services.some((s) => path === "/services/" + s.slug))
      assert.equal(await page.locator(".experience").count(), 1, path);
    for (const link of await page.locator("a[href]").all()) {
      const href = await link.getAttribute("href");
      assert.ok(!href.includes("/demo/fintech"));
      assert.ok(!href.includes("monetcore-lead-demo"));
      if (href.startsWith("tel:")) assert.equal(href, "tel:+2347065880558");
      if (href.startsWith("mailto:"))
        assert.equal(new URL(href).pathname, "hello@monetcore.dev");
      if (href.includes("wa.me/"))
        assert.equal(new URL(href).pathname, "/2347065880558");
      if (href.startsWith("/") || href.startsWith("#"))
        links.add(new URL(href, base + path).href);
    }
    if (
      [
        "/products/fintech-products",
        "/product-showcase",
        "/products/smart-booking",
      ].includes(path)
    )
      for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.locator("[data-page-hero]").screenshot({
          path:
            output +
            "/" +
            path.slice(1).replaceAll("/", "-") +
            "-" +
            width +
            ".png",
        });
      }
  }
  for (const href of links) {
    const url = new URL(href);
    assert.ok(!url.pathname.startsWith("/api/"));
    const response = await page.request.get(href);
    assert.equal(response.status(), 200, href);
    if (url.hash)
      assert.ok(
        (await response.text()).includes(`id="${url.hash.slice(1)}"`),
        `missing fragment ${href}`,
      );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/");
  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await page.getByRole("button", { name: "Products", exact: true }).click();
  const menu = page.locator("#panel-products");
  assert.equal(await menu.locator(".mega-links a").count(), 4);
  assert.doesNotMatch(await menu.innerText(), /demonstration|demo|monepay/i);
  await menu.getByRole("link", { name: /Fintech Products/ }).click();
  await page.waitForURL("**/products/fintech-products");
  assert.equal(
    await page
      .getByRole("button", { name: "Open navigation menu" })
      .getAttribute("aria-expanded"),
    "false",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  assert.deepEqual(api, []);
  await fs.writeFile(
    output + "/results.json",
    JSON.stringify(
      {
        routes: routeList.length,
        responsive,
        internalLinks: links.size,
        retiredRedirect: 308,
        productDemosHidden: 6,
        serviceDemosPreserved: 7,
        errors,
        external,
        api,
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS ${routeList.length} public pages, ${responsive} responsive checks, ${links.size} internal links/fragments; fintech redirect, no retired brand, six product demos hidden, seven service demos preserved, simplified mobile menu, contact links and axe checks.`,
  );
} finally {
  await browser.close();
}
