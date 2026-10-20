import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import fs from "node:fs";
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const context = await b.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const p = await context.newPage();
  const base = process.env.QA_BASE_URL || "http://127.0.0.1:4600";
  if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
    throw new Error("QA requires a local preview server");
  assert.equal(
    (await p.request.post(base + "/api/contact", { data: {} })).status(),
    403,
    "Preview safeguards must be active",
  );
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const routes = [
    "/",
    "/services",
    "/products",
    "/about",
    "/contact",
    "/book",
    "/website-packages",
    "/demo/fintech",
  ];
  const accessibility = [];
  for (const path of routes) {
    const r = await p.goto(base + path);
    assert.equal(r.status(), 200, path);
    await p.evaluate(() => document.fonts.ready);
    const family = await p
      .locator("body")
      .evaluate((el) => getComputedStyle(el).fontFamily);
    assert.ok(family.toLowerCase().includes("inter"), family);
    assert.equal(await p.locator("footer").count(), 1);
    const links = await p
      .locator('a[href^="/"],a[href^="#"]')
      .evaluateAll((items) => [
        ...new Set(items.map((a) => a.getAttribute("href"))),
      ]);
    for (const href of links) {
      const u = new URL(href, p.url());
      const rr = await p.request.get(u.href);
      assert.equal(rr.status(), 200, path + " " + href);
      if (u.hash)
        assert.ok(
          (await rr.text()).includes(`id="${u.hash.slice(1)}"`),
          href + " fragment",
        );
    }
    const a = await new AxeBuilder({ page: p })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    accessibility.push({
      path,
      violations: a.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
    for (const width of [320, 360, 375, 390, 430, 768, 1024, 1280, 1440]) {
      await p.setViewportSize({ width, height: 900 });
      await p.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );
      await p.waitForFunction(
        () => document.documentElement.scrollWidth <= innerWidth,
        {},
        { timeout: 2000 },
      );
      const dims = await p.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert.ok(
        dims.scroll <= dims.width,
        path + " overflow " + width + " " + JSON.stringify(dims),
      );
    }
  }
  fs.writeFileSync(
    "/tmp/monetcore-premium-axe.json",
    JSON.stringify(accessibility, null, 2),
  );
  console.log(
    "Accessibility findings:",
    JSON.stringify(
      accessibility.map((a) => ({
        path: a.path,
        violations: a.violations.map((v) => ({
          id: v.id,
          count: v.nodes.length,
        })),
      })),
    ),
  );
  await p.goto(base);
  await p.getByRole("button", { name: "Dismiss preview notice" }).click();
  await p.setViewportSize({ width: 1440, height: 1000 });
  const nav = p.getByRole("navigation", { name: "Main navigation" });
  for (const label of ["Solutions & Services", "Products", "Company"]) {
    const trigger = nav.getByRole("button", { name: label, exact: true });
    await trigger.focus();
    await p.keyboard.press("Enter");
    assert.equal(await trigger.getAttribute("aria-expanded"), "true");
    assert.equal(await nav.locator(".mega-panel:not([hidden])").count(), 1);
    await p.keyboard.press("ArrowDown");
    await p.waitForFunction(
      () =>
        document.querySelector(".mega-panel:not([hidden]) a") ===
        document.activeElement,
    );
    await p.keyboard.press("Escape");
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.ok(await trigger.evaluate((el) => el === document.activeElement));
  }
  await nav
    .getByRole("button", { name: "Solutions & Services", exact: true })
    .click();
  const panel = nav.getByRole("region", {
    name: "Solutions & Services",
    exact: true,
  });
  await panel
    .getByRole("link", { name: /Custom Software Development/ })
    .hover();
  assert.ok(await panel.isVisible());
  // The expanded menu overlays the hero; click the actual outside margin.
  await p.mouse.click(4, 700);
  assert.equal(await nav.locator(".mega-panel:not([hidden])").count(), 0);
  await nav.getByRole("button", { name: "Products", exact: true }).click();
  await p.screenshot({ path: "/tmp/monetcore-premium-megamenu.png" });
  await p.keyboard.press("Escape");
  await p.screenshot({
    path: "/tmp/monetcore-premium-desktop.png",
    fullPage: true,
  });
  const c = p.getByRole("region", { name: "Technology and product showcases" });
  let height;
  for (const label of [
    "AI Lead Automation",
    "Website Development",
    "Mobile Applications",
    "SaaS Products",
    "Customer Dashboards",
    "MonePay Fintech Demo",
  ]) {
    await c.getByRole("button", { name: "Show " + label, exact: true }).click();
    const h = (await c.boundingBox()).height;
    if (height)
      assert.ok(
        Math.abs(height - h) < 2,
        "carousel shift " + label + " " + height + " " + h,
      );
    height = h;
    const href = await c.locator(".showcase-footer a").getAttribute("href");
    assert.equal((await p.request.get(base + href)).status(), 200);
  }
  for (const width of [375, 768, 1024]) {
    await p.setViewportSize({ width, height: 900 });
    await p.goto(base);
    await p.getByRole("button", { name: "Open navigation menu" }).click();
    for (const label of ["Solutions & Services", "Products", "Company"]) {
      await nav.getByRole("button", { name: label, exact: true }).click();
      assert.equal(await nav.locator(".mega-panel:not([hidden])").count(), 1);
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "mobile menu " + width,
      );
    }
    await p.keyboard.press("Escape");
    await p.keyboard.press("Escape");
    assert.equal(
      await p
        .getByRole("button", { name: "Open navigation menu" })
        .getAttribute("aria-expanded"),
      "false",
    );
  }
  await p.setViewportSize({ width: 390, height: 844 });
  await p.goto(base);
  await p.screenshot({
    path: "/tmp/monetcore-premium-mobile.png",
    fullPage: true,
  });
  await p.getByRole("button", { name: "Open navigation menu" }).click();
  await nav.getByRole("button", { name: "Products", exact: true }).click();
  await nav.getByRole("link", { name: /Smart Website Packages/ }).click();
  await p.waitForURL("**/website-packages");
  await p
    .getByRole("link", { name: "Choose Package: Smart Starter", exact: true })
    .click();
  await p.waitForURL((url) => url.searchParams.get("package") === "starter");
  await p.waitForFunction(
    () =>
      document.querySelector('select[name="packageId"]').value === "starter",
  );
  assert.equal(
    await p.locator('select[name="packageId"]').inputValue(),
    "starter",
  );
  assert.ok(
    accessibility.every((a) => a.violations.length === 0),
    "Accessibility violations remain",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS eight pages, all internal links, nine responsive widths, local fonts, desktop/mobile mega-menu keys/focus/outside click/navigation, stable carousel and package preselection.",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
