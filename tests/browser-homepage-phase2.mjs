// Homepage-only visual contract. All provider/API requests remain blocked.
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4623";
assert.ok(["127.0.0.1", "localhost"].includes(new URL(base).hostname));
const phase = process.env.HOMEPAGE_CAPTURE === "before" ? "before" : "after";
const compare = process.env.HOMEPAGE_COMPARE_BASELINE === "true";
const dir = "/workspace/artifacts/monetcore-design-phase2";
await fs.mkdir(`${dir}/${phase}`, { recursive: true });
const b = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const rows = [],
  errors = [],
  external = [],
  api = [];
try {
  const ctx = await b.newContext({ reducedMotion: "reduce" });
  await ctx.route("**/*", (r) => {
    const url = new URL(r.request().url());
    if (url.origin !== new URL(base).origin) {
      external.push(url.origin);
      return r.abort();
    }
    if (url.pathname.startsWith("/api/")) {
      api.push(url.pathname);
      return r.abort();
    }
    return r.continue();
  });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  for (const width of [320, 390, 768, 1440]) {
    await p.setViewportSize({ width, height: 1000 });
    await p.goto(base);
    await p.evaluate(() => document.fonts.ready);
    const dismiss = p.getByRole("button", { name: "Dismiss preview notice" });
    if (await dismiss.isVisible()) await dismiss.click();
    const data = await p.evaluate(() => {
      const main = document.querySelector("main");
      const hero = document.querySelector("#corporate-hero");
      const c = (s) =>
        [...document.querySelectorAll(s)].map((e) => ({
          text: e.textContent.trim(),
          size: parseFloat(getComputedStyle(e).fontSize),
        }));
      return {
        height: document.documentElement.scrollHeight,
        hero: hero.outerHTML,
        heroHeight: hero.getBoundingClientRect().height,
        text: main.innerText.replace(/\s+/g, " ").trim(),
        links: [...main.querySelectorAll("a")].map((e) => [
          e.textContent.trim().replace(/\s+/g, " "),
          e.getAttribute("href"),
        ]),
        sections: [...main.querySelectorAll(":scope > section")].map((e) => ({
          id: e.id,
          height: Math.round(e.getBoundingClientRect().height),
          background: getComputedStyle(e).backgroundColor,
        })),
        showcaseLabels: c(
          '#products [class*="stats"] span,#products [class*="chartLabel"],#products [class*="rows"] > div,#products [class*="previewHeading"] strong',
        ),
        discoveryLabels: c(
          '#live-demos [class*="boardHeading"] strong,#live-demos [class*="pipeline"] strong,#live-demos [class*="interfaceNote"]',
        ),
      };
    });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
      `overflow ${width}`,
    );
    const services = p.locator("#services .solution-card");
    assert.equal(await services.count(), 8); // Seven services plus the preserved sales-system destination.
    assert.equal(
      new Set(
        (
          await services.evaluateAll((es) =>
            es.map((e) => e.getAttribute("href")),
          )
        ).filter((h) => h.startsWith("/services/")),
      ).size,
      7,
    );
    await p.mouse.move(0, 0);
    for (const id of ["services", "products", "live-demos", "smart-websites"]) {
      const section = p.locator("#" + id);
      for (const el of await section.locator("h2,h3,p,a").all()) {
        if (!(await el.isVisible())) continue;
        const box = await el.boundingBox();
        assert.ok(
          box.x >= -1 && box.x + box.width <= width + 1,
          `${id} clipped at ${width}`,
        );
      }
      await section.screenshot({
        path: `${dir}/${phase}/${id}-${width}.png`,
        style: ".site-header,.preview-notice {visibility:hidden!important}",
      });
    }
    await p.evaluate(() => scrollTo(0, 0));
    await p.screenshot({
      path: `${dir}/${phase}/homepage-${width}.png`,
      fullPage: true,
    });
    if (phase === "after") {
      assert.ok(
        data.showcaseLabels.every((x) => x.size >= 11),
        `showcase readability ${width}`,
      );
      assert.ok(
        data.discoveryLabels.every((x) => x.size >= 11),
        `discovery readability ${width}`,
      );
      const axe = await new AxeBuilder({ page: p })
        .include("#services")
        .include("#products")
        .include("#live-demos")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        axe.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
      );
      if (width >= 1200) {
        const a = await services.nth(0).boundingBox(),
          z = await services.nth(2).boundingBox();
        assert.ok(a.width > z.width, "selective desktop bento sizing");
        const tops = await p
          .locator("#live-demos article > div:last-child")
          .evaluateAll((es) => es.map((e) => e.getBoundingClientRect().top));
        assert.ok(
          Math.max(...tops) - Math.min(...tops) < 1,
          "aligned product interface/copy rows",
        );
        for (const card of await p.locator("#live-demos article").all()) {
          const visual = await card
            .locator(":scope > div:first-child")
            .boundingBox();
          const copy = await card
            .locator(":scope > div:last-child")
            .boundingBox();
          assert.ok(
            copy.y >= visual.y + visual.height - 1,
            "desktop product copy below full-width visual",
          );
        }
      }
    }
    rows.push({ width, ...data });
  }
  if (phase === "after" && compare) {
    const before = JSON.parse(
      await fs.readFile(`${dir}/before/measurements.json`, "utf8"),
    );
    for (const row of rows) {
      const old = before.find((x) => x.width === row.width);
      assert.equal(row.text, old.text, `approved content ${row.width}`);
      assert.deepEqual(row.links, old.links);
      assert.equal(row.hero, old.hero);
      assert.equal(row.heroHeight, old.heroHeight);
      if (row.width <= 390)
        assert.ok(
          row.height < old.height,
          `shorter mobile journey ${row.width}`,
        );
      assert.deepEqual(
        row.sections.map((s) => s.background),
        old.sections.map((s) => s.background),
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
    `PASS ${phase}: four viewport homepage comparisons, eight capability cards/all seven services, CTA/link/content/hero preservation, responsive screenshots, no overflow or external/API requests${phase === "after" ? "; readable preview labels, scoped axe and desktop bento checks" : ""}.`,
  );
} finally {
  await b.close();
}
