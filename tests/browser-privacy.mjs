import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4600";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw new Error("Local preview only");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  reducedMotion: "reduce",
  viewport: { width: 390, height: 900 },
});
const page = await context.newPage();
const errors = [],
  external = [],
  api = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.route("**/*", (route) => {
  const u = new URL(route.request().url());
  if (u.origin !== new URL(base).origin) {
    external.push(u.hostname);
    return route.abort();
  }
  if (u.pathname.startsWith("/api/")) {
    api.push(u.pathname);
    return route.abort();
  }
  return route.continue();
});
try {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ colorScheme: width === 390 ? "dark" : "light" });
    for (const path of ["/privacy", "/contact", "/book"]) {
      const response = await page.goto(base + path);
      assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready);
      await page
        .getByRole("button", { name: "Dismiss preview notice" })
        .click();
      assert.equal(await page.locator("h1").count(), 1);
      assert.equal(
        await page
          .locator("footer")
          .getByRole("link", { name: "Privacy Policy", exact: true })
          .getAttribute("href"),
        "/privacy",
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${width}px overflow ${path}`,
      );
      if (path === "/privacy") {
        assert.match(await page.title(), /Privacy Policy/);
        assert.equal(
          await page.locator('link[rel="canonical"]').getAttribute("href"),
          "https://monetcore.dev/privacy",
        );
        const body = await page.locator("main").innerText();
        for (const text of [
          "12 months after the last communication",
          "12 months after the appointment",
          "separate, voluntary opt-in consent",
          "does not implement an automated deletion schedule",
          "Nigeria Data Protection Act 2023",
        ])
          assert.ok(body.includes(text), text);
        const nav = page.getByRole("navigation", {
          name: "Privacy policy contents",
        });
        for (const link of await nav.getByRole("link").all()) {
          const href = await link.getAttribute("href");
          assert.equal(await page.locator(href).count(), 1);
        }
        const first = nav.getByRole("link").first();
        await first.focus();
        assert.equal(
          await first.evaluate((el) => el === document.activeElement),
          true,
        );
        await page.keyboard.press("Enter");
        await page.waitForURL("**/privacy#information");
        assert.ok(page.url().endsWith("#information"));
        assert.equal(
          await page
            .locator("main")
            .getByRole("link", { name: "hello@monetcore.dev", exact: true })
            .getAttribute("href"),
          "mailto:hello@monetcore.dev?subject=Privacy%20Request",
        );
      }
      if (path === "/contact") {
        assert.equal(await page.locator("iframe").count(), 0);
        const maps = page.getByRole("link", { name: /^Open in Google Maps/ });
        const u = new URL(await maps.getAttribute("href"));
        assert.equal(u.hostname, "www.google.com");
        assert.ok(u.searchParams.get("query").includes("Maitama"));
        assert.equal(await maps.getAttribute("target"), "_blank");
        assert.match(await maps.getAttribute("rel"), /noopener/);
        assert.equal(
          await page
            .getByRole("form", { name: "Project enquiry" })
            .getByRole("link", { name: "Privacy Policy", exact: true })
            .getAttribute("href"),
          "/privacy",
        );
      }
      if (path === "/book") {
        const notice = page.locator("p").filter({
          hasText: "We use your details to arrange your consultation",
        });
        assert.equal(await notice.count(), 1);
        assert.equal(
          await notice
            .getByRole("link", { name: "Privacy Policy", exact: true })
            .getAttribute("href"),
          "/privacy",
        );
      }
      if ([390, 1440].includes(width)) {
        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
          .analyze();
        assert.deepEqual(
          result.violations.map((v) => ({
            id: v.id,
            targets: v.nodes.map((n) => n.target),
          })),
          [],
          `${width}px axe ${path}`,
        );
      }
    }
    console.log(
      `PASS privacy/contact/booking pages at ${width}px: links, notices, keyboard anchors, metadata and no overflow`,
    );
  }
  for (const path of [
    "/",
    "/website-packages",
    "/contact?interest=product%3Aai-receptionist",
  ]) {
    await page.goto(base + path);
    const form = page.getByRole("form", {
      name:
        path === "/website-packages"
          ? "Website quotation enquiry"
          : "Project enquiry",
      exact: true,
    });
    assert.equal(
      await form
        .getByRole("link", { name: "Privacy Policy", exact: true })
        .getAttribute("href"),
      "/privacy",
    );
    if (path === "/website-packages")
      assert.equal(
        await form.locator('input[name="consent"][required]').count(),
        1,
      );
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(external, []);
  assert.deepEqual(api, []);
  console.log(
    "PASS shared form notices and unchanged quotation checkbox; zero browser errors, external requests or API calls",
  );
} finally {
  await browser.close();
}
