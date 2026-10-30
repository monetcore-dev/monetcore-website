// Public product demos are intentionally withheld; service demos have their own suite.
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import { products, enquiryHref } from "../app/config/offeringCatalog.ts";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4618";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const b = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const p = await b.newPage({
    viewport: { width: 390, height: 844 },
    reducedMotion: "reduce",
    isMobile: true,
    hasTouch: true,
  });
  const errors = [],
    api = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("request", (r) => {
    if (new URL(r.url()).pathname.startsWith("/api/")) api.push(r.url());
  });
  for (const product of products) {
    assert.equal(
      (await p.goto(base + "/products/" + product.slug)).status(),
      200,
    );
    assert.equal(await p.locator(".experience").count(), 0);
    assert.match(
      await p.locator("meta[name=robots]").getAttribute("content"),
      /noindex/,
    );
    assert.ok(
      await p
        .locator("[data-page-hero]")
        .getByText("Product concept · not available for activation", {
          exact: true,
        })
        .isVisible(),
    );
    assert.equal(
      await p
        .getByRole("link", {
          name: /Explore Demo|View Demonstration|Request a Demo/,
        })
        .count(),
      0,
    );
    assert.equal(
      await p
        .locator("[data-page-hero]")
        .getByRole("link", { name: "Request a Quote", exact: true })
        .getAttribute("href"),
      enquiryHref("product", product.slug),
    );
    assert.ok(
      (await p
        .locator(`a[href="${enquiryHref("product", product.slug, true)}"]`)
        .count()) > 0,
    );
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(api, []);
  console.log(
    "PASS six unlaunched product pages: demos hidden, noindex, preserved heroes, quotation/consultation links, no overflow or API calls.",
  );
} finally {
  await b.close();
}
