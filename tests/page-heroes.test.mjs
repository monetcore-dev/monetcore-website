import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  internalHeroRoutes,
  serviceHeroVisuals,
  productHeroVisuals,
} from "../app/config/pageHeroes.ts";
import { services, products } from "../app/config/offeringCatalog.ts";
const read = (path) =>
  fs.readFileSync(new URL("../" + path, import.meta.url), "utf8");
test("every existing internal route has an intentional page-specific hero theme", () => {
  assert.equal(Object.keys(internalHeroRoutes).length, 23);
  for (const service of services)
    assert.equal(
      internalHeroRoutes["/services/" + service.slug],
      serviceHeroVisuals[service.slug],
    );
  for (const product of products)
    assert.equal(
      internalHeroRoutes["/products/" + product.slug],
      productHeroVisuals[product.slug],
    );
  assert.ok(!("/" in internalHeroRoutes));
  for (const path of [
    "about",
    "contact",
    "book",
    "privacy",
    "assistant",
    "website-packages",
    "product-showcase",
    "products/fintech-products",
  ])
    assert.ok(read("app/" + path + "/page.tsx").includes("<PageHero"));
  for (const name of ["ServiceDetail", "ProductDetail", "OfferingOverview"])
    assert.ok(
      read("app/components/catalog/" + name + ".tsx").includes("<PageHero"),
    );
  assert.ok(!read("app/page.tsx").includes("PageHero"));
});
test("hero is decorative, server-renderable and motion is optional and pausable without JavaScript", () => {
  const source = read("app/components/PageHero.tsx"),
    visual = read("app/components/PageHeroVisual.tsx"),
    css = read("app/components/page-hero.module.css").replace(/\s+/g, "");
  assert.ok(!source.includes("use client"));
  assert.match(source, /backgroundVisual: Visual \| ReactElement/);
  assert.match(source, /type="checkbox"/);
  assert.match(source, /Pause banner background animation/);
  assert.match(source, /animation\?\.enabled !== false/);
  assert.match(css, /:checked~\.background\*\{animation-play-state:paused;?\}/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
  assert.match(visual, /aria-hidden="true"[\s\S]*?focusable="false"/);
  assert.ok(!/https?:\/\/|<img|<image|<iframe/.test(visual));
  assert.ok(
    !/fetch\(|setInterval\(|requestAnimationFrame\(/.test(source + visual),
  );
});
