// Final visual polish: local-only, no integration calls or form submissions.
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { internalHeroRoutes } from "../app/config/pageHeroes.ts";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4627";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const phase = process.env.POLISH_CAPTURE === "before" ? "before" : "after";
const dir = "/workspace/artifacts/monetcore-design-phase3";
await fs.mkdir(`${dir}/${phase}`, { recursive: true });
const b = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const rows = [],
  contracts = [],
  errors = [],
  api = [],
  external = [];
try {
  const c = await b.newContext({ reducedMotion: "reduce" });
  await c.route("**/*", (r) => {
    const u = new URL(r.request().url());
    if (u.origin !== new URL(base).origin) {
      external.push(u.origin);
      return r.abort();
    }
    if (u.pathname.startsWith("/api/")) {
      api.push(u.pathname);
      return r.abort();
    }
    return r.continue();
  });
  const p = await c.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  // Inspect every public page, including retained noindex concept pages.
  await p.setViewportSize({ width: 1440, height: 1000 });
  for (const path of [
    "/",
    ...Object.keys(internalHeroRoutes).filter((p) => p != "/assistant"),
  ]) {
    assert.equal((await p.goto(base + path)).status(), 200, path);
    await p.evaluate(() => document.fonts.ready);
    const contract = await p.evaluate(() => {
      const clean = (e) =>
        e.textContent.replace(/[↗✓]/g, "").replace(/\s+/g, " ").trim();
      return {
        content: [
          ...document.querySelectorAll("main h1,main h2,main h3,main p,main a"),
        ].map((e) => [e.tagName, clean(e), e.getAttribute("href")]),
        footer: [...document.querySelectorAll("footer a")].map((e, i) => [
          i === 0 ? "brand" : clean(e),
          e.getAttribute("href"),
        ]),
        footerCopy: [
          ...document.querySelectorAll("footer p,footer h2,footer address"),
        ].map(clean),
      };
    });
    contracts.push({ path, ...contract });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `route overflow ${path}`,
    );
  }
  for (const width of [320, 390, 768, 1440]) {
    await p.setViewportSize({ width, height: 1000 });
    for (const [name, path, selector] of [
      ["home", "/", "footer"],
      ["contact", "/contact", "main > section:nth-of-type(3)"],
      ["about", "/about", "main > section:nth-of-type(4)"],
      [
        "service",
        "/services/ai-automation",
        "main > section:nth-last-of-type(2)",
      ],
      [
        "product",
        "/products/ai-lead-automation",
        "main > section:nth-last-of-type(2)",
      ],
      ["overview", "/products", "main > section:nth-last-of-type(2)"],
    ]) {
      await p.goto(base + path);
      await p.evaluate(() => document.fonts.ready);
      const dismiss = p.getByRole("button", { name: "Dismiss preview notice" });
      if (await dismiss.isVisible()) await dismiss.click();
      await p.mouse.move(0, 0);
      const area = p.locator(selector);
      await area.screenshot({
        path: `${dir}/${phase}/${name}-${width}.png`,
        style: ".site-header,.preview-notice{visibility:hidden!important}",
      });
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `overflow ${name} ${width}`,
      );
      if (name === "home") {
        const hero = await p.locator("#corporate-hero").evaluate((e) => ({
          html: e.outerHTML,
          height: e.getBoundingClientRect().height,
        }));
        const footer = p.locator("footer");
        const palette = await footer.evaluate((e) => [
          getComputedStyle(e).backgroundColor,
          getComputedStyle(e).backgroundImage,
        ]);
        await p.evaluate(() => scrollTo(0, 0));
        if (width < 1200)
          await p
            .getByRole("button", { name: "Open navigation menu", exact: true })
            .click();
        await p.keyboard.press("Tab");
        const target = p.getByRole("button", { name: "Products", exact: true });
        await target.focus();
        await p.waitForTimeout(30);
        const ring = await target.evaluate((e) => ({
          color: getComputedStyle(e).outlineColor,
          width: getComputedStyle(e).outlineWidth,
          offset: getComputedStyle(e).outlineOffset,
        }));
        await p.screenshot({ path: `${dir}/${phase}/focus-${width}.png` });
        await p.keyboard.press("Enter");
        assert.equal(await target.getAttribute("aria-expanded"), "true");
        await p.keyboard.press("Escape");
        assert.equal(await target.getAttribute("aria-expanded"), "false");
        rows.push({ width, hero, palette, ring });
        if (phase === "after") {
          assert.equal(ring.color, "rgb(80, 119, 239)");
          assert.equal(ring.width, "3px");
          assert.equal(
            ring.offset,
            width < 1200 ? "-3px" : "4px",
            "unclipped navigation focus",
          );
          if (width < 1200) {
            const consult = p.locator("header .nav-consult");
            await consult.focus();
            await p.waitForTimeout(30);
            assert.equal(
              await consult.evaluate((e) => getComputedStyle(e).outlineColor),
              "rgb(255, 255, 255)",
              "contrasting inset ring on blue consultation button",
            );
          }
          const hm = await p.locator("header .brand-mark").evaluate((e) => ({
            width: e.getBoundingClientRect().width,
            height: e.getBoundingClientRect().height,
            background: getComputedStyle(e).backgroundImage,
            radius: getComputedStyle(e).borderRadius,
          }));
          const fm = await p.locator("footer .brand-mark").evaluate((e) => ({
            width: e.getBoundingClientRect().width,
            height: e.getBoundingClientRect().height,
            background: getComputedStyle(e).backgroundImage,
            radius: getComputedStyle(e).borderRadius,
          }));
          assert.deepEqual(fm, hm);
          if (width < 1200) await p.keyboard.press("Escape");
          await footer.locator(".brand-lockup").scrollIntoViewIfNeeded();
          const a11y = await new AxeBuilder({ page: p })
            .include("footer")
            .include("header")
            .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
            .analyze();
          assert.deepEqual(
            a11y.violations.map((v) => v.id),
            [],
          );
          const links = footer.locator("a");
          for (const el of await links.all()) {
            const box = await el.boundingBox();
            assert.ok(
              box.x >= 0 && box.x + box.width <= width + 1,
              "footer clipping",
            );
          }
          const reduced = await footer
            .locator("a")
            .first()
            .evaluate((e) => getComputedStyle(e).transitionDuration);
          assert.ok(
            parseFloat(reduced) <= 0.001,
            "footer transitions effectively disabled",
          );
        }
      }
    }
  }
  if (phase === "after" && process.env.POLISH_COMPARE_BASELINE === "true") {
    const before = JSON.parse(
      await fs.readFile(`${dir}/before/contracts.json`, "utf8"),
    );
    assert.deepEqual(
      contracts,
      before,
      "approved content, all routes/footer destinations unchanged",
    );
    const old = JSON.parse(
      await fs.readFile(`${dir}/before/measurements.json`, "utf8"),
    );
    for (const r of rows) {
      const o = old.find((x) => x.width === r.width);
      assert.deepEqual(r.hero, o.hero, "hero preserved");
      assert.deepEqual(r.palette, o.palette, "shared navy footer preserved");
    }
  }
  if (phase === "after") {
    const action = p.locator("footer .footer-intro > a");
    await p.emulateMedia({ reducedMotion: "no-preference" });
    await action.hover();
    await p.waitForTimeout(230);
    assert.notEqual(
      await action
        .locator("svg")
        .evaluate((e) => getComputedStyle(e).transform),
      "none",
      "restrained normal-motion hover",
    );
    await p.emulateMedia({ reducedMotion: "reduce" });
    await p.waitForTimeout(30);
    assert.equal(
      await action
        .locator("svg")
        .evaluate((e) => getComputedStyle(e).transform),
      "none",
      "no hover movement for reduced motion",
    );
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(api, []);
  assert.deepEqual(external, []);
  await fs.writeFile(
    `${dir}/${phase}/contracts.json`,
    JSON.stringify(contracts, null, 2),
  );
  await fs.writeFile(
    `${dir}/${phase}/measurements.json`,
    JSON.stringify(rows, null, 2),
  );
  console.log(
    `PASS ${phase}: ${contracts.length} public-page content/footer contracts; four responsive widths, six visual areas plus focus, navigation, screenshots, no overflow or API/external requests${phase === "after" ? "; header/footer lockup parity, stronger focus, axe and reduced motion" : ""}.`,
  );
} finally {
  await b.close();
}
