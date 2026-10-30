// Synthetic local advert -> service -> demo -> enquiry journeys; no provider calls.
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { services } from "../app/config/offeringCatalog.ts";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4620";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const output = "/workspace/artifacts/monetcore-final-marketing-audit";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const errors = [],
  outbound = [];
let journeys = 0;
const placements = [];
try {
  const ctx = await browser.newContext({ reducedMotion: "reduce" });
  await ctx.route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.origin !== new URL(base).origin) {
      outbound.push(url.origin);
      return route.abort();
    }
    if (url.pathname.startsWith("/api/"))
      throw Error("Unmocked API request: " + url.pathname);
    return route.continue();
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  let posts = [];
  let fail = false;
  await ctx.route("**/api/contact", async (route) => {
    posts.push(route.request().postDataJSON());
    await new Promise((resolve) => setTimeout(resolve, 150));
    return route.fulfill({
      status: fail ? 503 : 200,
      json: fail
        ? { success: false, error: "Synthetic delivery unavailable." }
        : { success: true },
    });
  });
  for (const [width, height] of [
    [375, 667],
    [390, 844],
    [768, 1024],
    [1440, 1000],
  ]) {
    await page.setViewportSize({ width, height });
    // An advert can land on the corporate homepage and navigate to any service.
    await page.goto(
      base + "/?utm_source=instagram&utm_campaign=synthetic-readiness",
    );
    const dismiss = page.getByRole("button", {
      name: "Dismiss preview notice",
    });
    if (await dismiss.isVisible()) await dismiss.click();
    const homeCTA = page
      .locator("#corporate-hero")
      .getByRole("link", { name: "Explore Solutions", exact: true });
    await homeCTA.click();
    await page.waitForURL("**/services");
    assert.equal(new URL(page.url()).pathname, "/services");
    for (const item of services) {
      await page.goto(
        base +
          "/services/" +
          item.slug +
          "?utm_source=instagram&utm_campaign=synthetic-readiness",
      );
      await page.evaluate(() => document.fonts.ready);
      const hero = page.locator("[data-page-hero]");
      const quote = hero.getByRole("link", { name: /Request a Quote/ });
      const box = await quote.boundingBox();
      assert.ok(
        box.y >= 0 && box.y + box.height <= height,
        `first-screen quote ${item.slug} ${width}`,
      );
      placements.push({
        slug: item.slug,
        width,
        height,
        ctaBottom: Math.round(box.y + box.height),
      });
      await hero.getByRole("link", { name: /Explore Demo/ }).click();
      await page.waitForURL("**#experience");
      assert.equal(new URL(page.url()).hash, "#experience");
      assert.equal(await page.locator("#experience .experience").count(), 1);
      assert.ok(
        (await page.locator("#experience .experience button").count()) > 0,
      );
      const next = page.getByRole("group", {
        name: `Next steps for ${item.title}`,
        exact: true,
      });
      await next
        .getByRole("link", { name: "Request a Quote", exact: true })
        .click();
      await page.waitForURL("**/contact?**");
      assert.equal(new URL(page.url()).pathname, "/contact");
      const form = page.getByRole("form", {
        name: "Project enquiry",
        exact: true,
      });
      assert.equal(
        await form.locator("[name=service]").inputValue(),
        item.formService,
      );
      assert.match(
        await form.locator("[name=message]").inputValue(),
        /I'd like to discuss/,
      );
      const start = posts.length;
      await form.locator("[name=name]").fill("Synthetic Marketing Visitor");
      await form.locator("[name=email]").fill("invalid-email");
      await form.getByRole("button", { name: "Send Project Enquiry" }).click();
      assert.equal(posts.length, start);
      await form.locator("[name=email]").fill("marketing-test@example.invalid");
      await form.locator("[name=company]").fill("Synthetic Business");
      await form.locator("[name=budget]").selectOption("Not sure yet");
      await form
        .locator("[name=message]")
        .fill(
          `Synthetic scoped enquiry about ${item.title}. No live delivery.`,
        );
      await form.getByRole("button", { name: "Send Project Enquiry" }).click();
      await form
        .getByRole("status")
        .filter({ hasText: "Your project enquiry has been sent" })
        .waitFor();
      assert.equal(posts.length, start + 1);
      assert.equal(posts.at(-1).service, item.formService);
      assert.equal(posts.at(-1).budget, "Not sure yet");
      assert.equal(posts.at(-1).company, "Synthetic Business");
      journeys++;
    }
  }
  // Explicit delivery failure is not shown as success; retain draft, permit retry.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(base + "/contact");
  const form = page.getByRole("form", { name: "Project enquiry", exact: true });
  await form.locator("[name=name]").fill("Synthetic Failure Visitor");
  await form.locator("[name=email]").fill("marketing-test@example.invalid");
  await form
    .locator("[name=message]")
    .fill("Synthetic failure and retry verification.");
  fail = true;
  await form.getByRole("button", { name: "Send Project Enquiry" }).click();
  await form.getByRole("alert").waitFor();
  assert.equal(
    await form.locator("[name=message]").inputValue(),
    "Synthetic failure and retry verification.",
  );
  assert.equal(await form.getByRole("status").count(), 0);
  fail = false;
  await form.getByRole("button", { name: "Send Project Enquiry" }).click();
  await form
    .getByRole("status")
    .filter({ hasText: "Your project enquiry has been sent" })
    .waitFor();
  await page.goto(base + "/services/digital-marketing");
  assert.match(
    await page.locator("[data-page-hero]").innerText(),
    /social media/i,
  );
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page
      .locator("[data-page-hero]")
      .screenshot({ path: output + `/digital-marketing-${width}.png` });
  }
  const axe = await new AxeBuilder({ page })
    .include("#experience")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    axe.violations.map((v) => v.id),
    [],
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(outbound, []);
  await fs.writeFile(
    output + "/journeys.json",
    JSON.stringify(
      {
        journeys,
        mockedEnquiries: posts.length,
        placements,
        errors,
        outbound,
        confirmation:
          "Mocked acceptance only; no SMTP/database/calendar verification",
      },
      null,
      2,
    ),
  );
  console.log(
    `PASS ${journeys} advert/service/demo/quotation/confirmation journeys across four viewports; first-screen CTAs, native email validation, prefill, service/budget/company payload, delivery error and retry; all submissions intercepted.`,
  );
} finally {
  await browser.close();
}
