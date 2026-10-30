import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  services,
  products,
  resolveInterest,
} from "../app/config/offeringCatalog.ts";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4600";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw new Error("Local preview only");
const dir = "/workspace/artifacts/offering-expansion";
fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await b.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const p = await context.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
try {
  assert.equal(
    (await p.request.post(base + "/api/contact", { data: {} })).status(),
    403,
  );
  const findings = [];
  for (const [kind, items] of [
    ["services", services],
    ["products", products],
  ])
    for (const item of items) {
      const path = `/${kind}/${item.slug}`;
      assert.equal((await p.goto(base + path)).status(), 200);
      await p.evaluate(() => document.fonts.ready);
      assert.equal(await p.locator("h1").count(), 1);
      assert.equal(await p.locator("footer").count(), 1);
      assert.equal(
        await p.locator(".experience").count(),
        kind === "services" ? 1 : 0,
      );
      assert.equal(
        await p.locator("link[rel=canonical]").getAttribute("href"),
        "https://monetcore.dev" + path,
      );
      const schema = await p
        .locator('script[type="application/ld+json"]')
        .allTextContents();
      assert.ok(
        schema.some((s) => JSON.parse(s)["@type"] === "BreadcrumbList"),
      );
      if (kind === "products")
        assert.ok(
          (await p.locator(".offering-hero-card").innerText()).includes(
            item.status,
          ),
        );
      for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
        await p.setViewportSize({ width, height: 900 });
        await p.emulateMedia({ colorScheme: width === 375 ? "dark" : "light" });
        const overflow = await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        );
        assert.equal(overflow, false, `${path} ${width}px overflow`);
      }
      await p.setViewportSize({ width: 390, height: 844 });
      const axe = await new AxeBuilder({ page: p })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      findings.push({ path, violations: axe.violations });
      await p.locator(".offering-faq summary").first().focus();
      await p.keyboard.press("Enter");
      assert.equal(
        await p.locator(".offering-faq details").first().getAttribute("open"),
        "",
      );
      await p.keyboard.press("Space");
      assert.equal(
        await p.locator(".offering-faq details").first().getAttribute("open"),
        null,
      );
      const links = await p
        .locator('main a[href^="/"], footer a[href^="/"]')
        .evaluateAll((els) => [
          ...new Set(els.map((e) => e.getAttribute("href"))),
        ]);
      for (const href of links) {
        const r = await p.request.get(new URL(href, base).href);
        assert.equal(r.status(), 200, `${path} broken ${href}`);
        const hash = new URL(href, base).hash;
        if (hash)
          assert.ok((await r.text()).includes(`id="${hash.slice(1)}"`), href);
      }
    }
  fs.writeFileSync(
    dir + "/accessibility.json",
    JSON.stringify(findings, null, 2),
  );
  assert.ok(
    findings.every((f) => f.violations.length === 0),
    JSON.stringify(
      findings
        .filter((f) => f.violations.length)
        .map((f) => ({
          path: f.path,
          violations: f.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          })),
        })),
    ),
  );
  console.log(
    "PASS 13 routes: metadata/breadcrumbs, statuses, links/fragments, eight responsive widths, FAQ keys and automated accessibility",
  );
  for (const [kind, items] of [
    ["service", services],
    ["product", products],
  ])
    for (const item of items) {
      const interest = `${kind}:${item.slug}`;
      for (const booking of [false, true]) {
        const expected = resolveInterest(interest, booking);
        await p.goto(
          base +
            `/${booking ? "book" : "contact"}?interest=${encodeURIComponent(interest)}`,
        );
        assert.equal(
          await p.locator("select[name=service]").inputValue(),
          expected.service,
        );
        assert.equal(
          await p.locator("textarea[name=message]").inputValue(),
          expected.message,
        );
      }
    }
  await p.goto(base + "/contact?interest=%3Cscript%3Ebad%3C/script%3E");
  assert.equal(await p.locator("select[name=service]").inputValue(), "");
  assert.equal(await p.locator("textarea[name=message]").inputValue(), "");
  console.log(
    "PASS all 26 contextual contact/booking prefills and invalid-query rejection",
  );
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(base);
  await p.getByRole("button", { name: "Dismiss preview notice" }).click();
  await p.getByRole("button", { name: "Open navigation menu" }).click();
  await p
    .getByRole("button", { name: "Solutions & Services", exact: true })
    .click();
  assert.equal(await p.locator("#panel-solutions .mega-links a").count(), 7);
  await p
    .locator("#panel-solutions")
    .getByRole("link", { name: /Digital Marketing & Growth/ })
    .click();
  await p.waitForURL("**/services/digital-marketing");
  assert.equal(
    await p
      .getByRole("button", { name: "Open navigation menu" })
      .getAttribute("aria-expanded"),
    "false",
  );
  await p.getByRole("button", { name: "Open navigation menu" }).click();
  await p.getByRole("button", { name: "Products", exact: true }).click();
  await p
    .locator("#panel-products")
    .getByRole("link", { name: /Fintech Products/ })
    .click();
  await p.waitForURL("**/products/fintech-products");
  console.log("PASS expanded mobile service/product menus navigate and close");
  for (const [name, path, width] of [
    ["marketing-mobile", "/services/digital-marketing", 390],
    ["software-desktop", "/services/software-development", 1440],
    ["booking-mobile", "/products/smart-booking", 390],
  ]) {
    await p.setViewportSize({ width, height: 900 });
    await p.goto(base + path);
    await p.getByRole("button", { name: "Dismiss preview notice" }).click();
    await p.screenshot({ path: `${dir}/${name}.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
  console.log("PASS no browser exceptions; screenshots saved");
} finally {
  await b.close();
}
