import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { publicRoutes, indexableRoutes } from "../app/lib/metadata.ts";
import {
  products,
  services,
  resolveInterest,
} from "../app/config/offeringCatalog.ts";
import { productNavigation } from "../app/config/offeringNavigation.ts";
const read = (path) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");
test("retired name occurs in application source only in the preserved unserved prototype", () => {
  function scan(dir) {
    return readdirSync(new URL("../" + dir, import.meta.url), {
      withFileTypes: true,
    }).flatMap((entry) =>
      entry.isDirectory()
        ? scan(dir + "/" + entry.name)
        : /\.(tsx?|css|json|svg|html)$/.test(entry.name)
          ? [dir + "/" + entry.name]
          : [],
    );
  }
  for (const file of scan("app").filter(
    (path) => !path.endsWith("/FintechConcept.tsx"),
  ))
    assert.doesNotMatch(read(file), /mone[\s_-]*pay/i, file);
  assert.ok(read("app/demo/fintech/FintechConcept.tsx").length > 1000);
  assert.doesNotMatch(
    read("app/demo/fintech/page.tsx"),
    /FintechConcept|use client/,
  );
  function publicPaths(dir) {
    return readdirSync(new URL("../" + dir, import.meta.url), {
      withFileTypes: true,
    }).flatMap((entry) =>
      entry.isDirectory()
        ? publicPaths(dir + "/" + entry.name)
        : [dir + "/" + entry.name],
    );
  }
  for (const file of publicPaths("public"))
    assert.doesNotMatch(file, /mone[\s_-]*pay/i);
});
test("concept product demos are unmounted and omitted from indexing, not silently advertised", () => {
  const route = read("app/products/[slug]/page.tsx");
  assert.doesNotMatch(route, /ProductExperience|demo=\{/);
  assert.match(route, /index: false/);
  for (const product of products) {
    assert.ok(publicRoutes.includes("/products/" + product.slug));
    assert.ok(!indexableRoutes.includes("/products/" + product.slug));
    assert.match(product.status, /not available for activation/);
    assert.match(product.disclosure, /temporarily unavailable/);
  }
  assert.ok(indexableRoutes.includes("/products/fintech-products"));
  assert.ok(!publicRoutes.includes("/demo/fintech"));
  assert.equal(productNavigation.length, 2);
  assert.ok(
    productNavigation.some((p) => p.href === "/products/fintech-products"),
  );
});
test("all seven service demonstration implementations remain wired and their enquiry routes resolve", () => {
  assert.equal(services.length, 7);
  assert.match(
    read("app/services/[slug]/page.tsx"),
    /ServiceExperience kind=\{item.demo\}/,
  );
  assert.match(
    read("app/components/catalog/ServiceDetail.tsx"),
    /href="#experience"/,
  );
  for (const item of services)
    assert.ok(resolveInterest("service:" + item.slug));
  assert.match(
    read("app/components/catalog/ProductExperience.tsx"),
    /case "booking"/,
  );
  assert.doesNotMatch(
    read("app/product-showcase/page.tsx"),
    /Request a Demo|<DiscoveryPreview/,
  );
});
