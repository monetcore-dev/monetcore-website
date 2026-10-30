// Local-only visual refinement checks. No external or integration requests.
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4622";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const phase = process.env.DESIGN_CAPTURE === "before" ? "before" : "after";
const dir = "/workspace/artifacts/monetcore-design-phase1";
await fs.mkdir(`${dir}/${phase}`, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const rows = [],
  errors = [],
  external = [],
  api = [];
try {
  const context = await browser.newContext({ reducedMotion: "reduce" });
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
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [name, path] of [
      ["contact", "/contact"],
      ["service", "/services/ai-automation"],
      ["product", "/products/ai-lead-automation"],
    ]) {
      await page.goto(base + path);
      await page.evaluate(() => document.fonts.ready);
      const dismiss = page.getByRole("button", {
        name: "Dismiss preview notice",
      });
      if (await dismiss.isVisible()) await dismiss.click();
      const hero = page.locator("[data-page-hero]");
      const data = await hero.evaluate((el) => ({
        text: el.innerText.replace(/\s+/g, " ").trim(),
        height: Math.round(el.getBoundingClientRect().height),
        links: [...el.querySelectorAll("a")].map((a) => [
          a.textContent.trim(),
          a.getAttribute("href"),
        ]),
      }));
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${path} overflow ${width}`,
      );
      await hero.screenshot({
        path: `${dir}/${phase}/${name}-hero-${width}.png`,
      });
      if (name === "contact") {
        const form = page.getByRole("form", {
          name: "Project enquiry",
          exact: true,
        });
        data.controls = await form
          .locator("input:not([type=hidden]),textarea,select")
          .evaluateAll((els) =>
            els.map((el) => ({
              name: el.name,
              type: el.type,
              required: el.required,
            })),
          );
        data.inputWidth = Math.round(
          (await form.locator("[name=email]").boundingBox()).width,
        );
        await form.screenshot({
          path: `${dir}/${phase}/contact-form-${width}.png`,
          style:
            ".site-header, .preview-notice { visibility: hidden !important; }",
        });
        if (phase === "after") {
          assert.ok(
            data.inputWidth >= (width <= 390 ? width - 95 : 200),
            `usable form width ${width}`,
          );
          const axe = await new AxeBuilder({ page })
            .include('form[aria-label="Project enquiry"]')
            .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
            .analyze();
          assert.deepEqual(
            axe.violations.map((v) => v.id),
            [],
          );
        }
      }
      if (phase === "after" && name !== "contact") {
        const panel = hero.locator("aside");
        const copy = hero.locator("h1");
        const pb = await panel.boundingBox(),
          cb = await copy.boundingBox();
        if (width >= 1024)
          assert.ok(pb.x > cb.x + cb.width, `balanced desktop panel ${name}`);
        for (const el of await hero.locator("h1,p,a,aside").all()) {
          if (!(await el.isVisible())) continue;
          const box = await el.boundingBox();
          assert.ok(
            box.x >= 0 && box.x + box.width <= width + 1,
            `${name} clipping ${width}`,
          );
        }
      }
      rows.push({ name, width, ...data });
    }
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    const home = await page.locator("#corporate-hero").innerText();
    if (width < 1200)
      await page
        .getByRole("button", { name: "Open navigation menu", exact: true })
        .click();
    const trigger = page.getByRole("button", {
      name: "Solutions & Services",
      exact: true,
    });
    await trigger.focus();
    await page.keyboard.press("Enter");
    // Existing IDs are read from aria-controls, preserving the navigation contract.
    const controlled = page.locator(
      `[id="${await trigger.getAttribute("aria-controls")}"]`,
    );
    await controlled.waitFor({ state: "visible" });
    const nav = await controlled.evaluate((el) => ({
      text: el.innerText.replace(/\s+/g, " ").trim(),
      links: [...el.querySelectorAll("a")].map((a) => a.getAttribute("href")),
      descriptionSize: parseFloat(
        getComputedStyle(el.querySelector(".mega-link small")).fontSize,
      ),
      introHeight: Math.round(
        el.querySelector(".mega-introduction").getBoundingClientRect().height,
      ),
    }));
    assert.equal(await controlled.locator(".mega-link").count(), 7);
    if (phase === "after") {
      assert.ok(nav.descriptionSize >= 13);
      const axe = await new AxeBuilder({ page })
        .include("header")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        axe.violations.map((v) => v.id),
        [],
      );
    }
    await page.screenshot({ path: `${dir}/${phase}/navigation-${width}.png` });
    await page.keyboard.press("Escape");
    assert.equal(await trigger.getAttribute("aria-expanded"), "false");
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    rows.push({ name: "navigation", width, home, ...nav });
  }
  if (phase === "after" && process.env.DESIGN_COMPARE_BASELINE === "true") {
    const before = JSON.parse(
      await fs.readFile(`${dir}/before/measurements.json`, "utf8"),
    );
    for (const row of rows) {
      const previous = before.find(
        (v) => v.name === row.name && v.width === row.width,
      );
      assert.equal(
        row.text,
        previous.text,
        `approved text preserved ${row.name} ${row.width}`,
      );
      assert.deepEqual(row.links, previous.links);
      if (row.controls) assert.deepEqual(row.controls, previous.controls);
      if (row.home) assert.equal(row.home, previous.home);
      if (row.name !== "navigation")
        assert.ok(
          row.height < previous.height,
          `shorter hero ${row.name} ${row.width}`,
        );
    }
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  assert.deepEqual(api, []);
  await fs.writeFile(
    `${dir}/${phase}/measurements.json`,
    JSON.stringify(rows, null, 2),
  );
  console.log(
    `PASS ${phase}: ${rows.length} responsive hero/form/navigation groups; screenshots, preserved text/routes/fields/homepage, no overflow or external/API requests${phase === "after" ? "; shorter heroes, wider forms, desktop composition, keyboard and scoped axe checks" : ""}.`,
  );
} finally {
  await browser.close();
}
