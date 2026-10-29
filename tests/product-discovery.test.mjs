import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  discoveryProducts,
  discoveryContent,
} from "../app/config/productDiscovery.ts";
import {
  findProduct,
  findService,
  resolveInterest,
} from "../app/config/offeringCatalog.ts";
import { publicRoutes } from "../app/lib/metadata.ts";
test("discovery has exactly four verified categories and no fintech promotion", () => {
  assert.deepEqual(
    discoveryProducts.map((p) => p.id),
    ["websites", "automation", "booking", "management"],
  );
  assert.ok(!JSON.stringify(discoveryProducts).includes("fintech"));
  assert.equal(new Set(discoveryProducts.map((p) => p.id)).size, 4);
});
test("discovery preserves catalog status and features rather than declaring concepts operational", () => {
  for (const item of discoveryProducts) {
    const content = discoveryContent(item);
    const catalog =
      item.kind === "product" ? findProduct(item.slug) : findService(item.slug);
    assert.deepEqual(content.features, catalog.features);
    if (item.kind === "product") {
      assert.equal(content.status, catalog.status);
      assert.equal(content.disclosure, catalog.disclosure);
    } else assert.match(content.disclosure, /local illustration/);
  }
});
test("every discovery demo route has an implemented local experience and quote prefill", () => {
  for (const item of discoveryProducts) {
    const content = discoveryContent(item);
    assert.ok(publicRoutes.includes(content.demoHref.split("#")[0]));
    assert.ok(content.demoHref.endsWith("#experience"));
    const url = new URL(content.enquiryHref, "https://monetcore.dev");
    assert.equal(url.pathname, "/contact");
    assert.ok(resolveInterest(url.searchParams.get("interest")));
  }
});
test("homepage removes fintech promotion while dedicated MonePay demo is preserved", () => {
  const home = readFileSync(
    new URL("../app/page.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(!home.includes("/demo/fintech"));
  assert.ok(home.includes("<ProductDiscovery />"));
  assert.ok(
    readFileSync(
      new URL("../app/demo/fintech/page.tsx", import.meta.url),
      "utf8",
    ),
  );
  assert.ok(publicRoutes.includes("/product-showcase"));
});
