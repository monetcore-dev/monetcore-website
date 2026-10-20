import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import fs from "node:fs";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4600";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: "reduce",
});
const page = await context.newPage();
assert.equal(
  (await page.request.post(base + "/api/contact", { data: {} })).status(),
  403,
);
const titles = new Set();
for (const path of [
  "/",
  "/services",
  "/products",
  "/about",
  "/contact",
  "/book",
  "/website-packages",
  "/demo/fintech",
]) {
  const response = await page.goto(base + path);
  const title = await page.title();
  assert.ok(!titles.has(title), path + " duplicate title");
  titles.add(title);
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute("href"),
    "https://monetcore.dev" + (path === "/" ? "" : path),
  );
  assert.ok(
    (await page.locator('meta[name="description"]').getAttribute("content"))
      .length > 40,
  );
  assert.match(
    await page.locator('meta[name="robots"]').getAttribute("content"),
    /noindex/,
  );
  assert.match(response.headers()["x-robots-tag"], /noindex/);
  assert.equal(response.headers()["x-content-type-options"], "nosniff");
  assert.ok(
    await page.locator('meta[property="og:image"]').getAttribute("content"),
  );
  assert.equal(await page.locator("main h1").count(), 1);
  for (const href of await page
    .locator('a[href^="tel:"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute("href"))))
    assert.equal(href, "tel:+2347065880558");
  for (const href of await page
    .locator('a[href^="https://wa.me/"]')
    .evaluateAll((els) => els.map((e) => e.getAttribute("href"))))
    assert.equal(new URL(href).pathname, "/2347065880558");
}
assert.match(
  await (await page.request.get(base + "/robots.txt")).text(),
  /Disallow: \//,
);
assert.ok(
  !(await (await page.request.get(base + "/sitemap.xml")).text()).includes(
    "<loc>",
  ),
);
assert.equal(
  (await page.request.get(base + "/missing-quality-check-route")).status(),
  404,
);
// Project choices survive real route navigation and reload, without storing identity fields.
await page.goto(base);
await page.getByRole("button", { name: "Dismiss preview notice" }).click();
const planner = page.getByRole("form", { name: "Smart project planner" });
await planner.locator('[name="plannerGoal"]').selectOption("websites");
await planner.locator('[name="plannerChallenge"]').selectOption("visibility");
await planner.locator('[name="plannerBudget"]').selectOption("Under ₦100,000");
await planner.locator('[value="website"]').check();
await page.goto(base + "/services");
await page.goto(base);
await page.reload();
await page.waitForFunction(
  () => document.querySelector('[name="plannerGoal"]').value === "websites",
);
assert.equal(
  await planner.locator('[name="plannerBudget"]').inputValue(),
  "Under ₦100,000",
);
assert.ok(await planner.locator('[value="website"]').isChecked());
const stored = await page.evaluate(() =>
  JSON.parse(sessionStorage.getItem("monetcore-planner-v1")),
);
assert.deepEqual(Object.keys(stored).sort(), [
  "budget",
  "capabilities",
  "challenge",
  "goal",
]);
await planner.getByRole("button", { name: "Discuss This Project" }).click();
assert.equal(
  await page.locator('#project-enquiry [name="service"]').inputValue(),
  "Business Website",
);
// A pending enquiry also refuses a repeated submit event.
const enquiry = page.getByRole("form", {
  name: "Project enquiry",
  exact: true,
});
await enquiry.locator('[name="name"]').fill("QA Example");
await enquiry.locator('[name="email"]').fill("qa@example.invalid");
let enquiries = 0,
  finishEnquiry;
await page.route("**/api/contact", (route) => {
  enquiries++;
  finishEnquiry = () =>
    route.fulfill({ json: { success: false, error: "Mock enquiry declined" } });
});
const enquiryRequest = page.waitForRequest("**/api/contact");
await enquiry
  .getByRole("button", { name: "Send Project Enquiry", exact: true })
  .click();
await enquiryRequest;
await enquiry.dispatchEvent("submit");
assert.equal(enquiries, 1);
await finishEnquiry();
await enquiry
  .getByRole("alert")
  .filter({ hasText: "Mock enquiry declined" })
  .waitFor();
await page.unroute("**/api/contact");
// A late response for an old date cannot overwrite the latest availability.
await page.goto(base + "/book");
await page.getByRole("button", { name: "Dismiss preview notice" }).click();
let oldRoute;
await page.route("**/api/book/availability?*", async (route) => {
  if (route.request().url().includes("2030-01-07")) oldRoute = route;
  else
    await route.fulfill({
      json: { bookedTimes: ["09:00"], unavailableTimes: ["09:00"] },
    });
});
await page.locator('input[type="date"]').fill("2030-01-07");
await page.waitForFunction(
  () => document.querySelector('input[type="date"]').value === "2030-01-07",
);
const deadline = Date.now() + 5000;
while (!oldRoute && Date.now() < deadline)
  await new Promise((resolve) => setTimeout(resolve, 10));
assert.ok(oldRoute, "First availability request was not intercepted");
await page.locator('input[type="date"]').fill("2030-01-08");
await page.getByRole("button", { name: "10:00", exact: true }).click();
await oldRoute.fulfill({
  json: { bookedTimes: ["10:00"], unavailableTimes: ["10:00"] },
});
await page.waitForTimeout(100);
assert.ok(
  await page.getByRole("button", { name: "10:00", exact: true }).isEnabled(),
);
await page
  .locator('[name="consultationType"]')
  .selectOption("Discovery Call - 30 minutes");
await page.locator('[name="name"]').fill("Safe QA");
await page.locator('[name="email"]').fill("qa@example.invalid");
let submissions = 0,
  complete;
await page.route("**/api/book", (route) => {
  submissions++;
  complete = () =>
    route.fulfill({ json: { success: false, error: "Mock not confirmed" } });
});
await page.getByRole("button", { name: "Confirm Consultation" }).click();
await page.locator("form").dispatchEvent("submit");
assert.equal(submissions, 1);
await complete();
await page
  .getByRole("alert")
  .filter({ hasText: "Mock not confirmed" })
  .waitFor();
assert.equal(
  await page.getByText(/Your consultation has been booked/).count(),
  0,
);
await page.unrouteAll({ behavior: "wait" });
// Scan every focused capability detail, not only the default visualization.
for (const width of [390, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(base);
  await page.getByRole("button", { name: "Dismiss preview notice" }).click();
  for (const node of await page.locator(".ai-core-node").all()) {
    await node.focus();
    const a = await new AxeBuilder({ page })
      .include(".ai-core")
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      a.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
    );
  }
}
for (const colorScheme of ["light", "dark"])
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width, height: 900 });
    await page.goto(base);
    await page.waitForFunction(
      () => document.documentElement.scrollWidth <= innerWidth,
    );
    await page.locator(".solution-selector button").nth(1).click();
    await page.locator(".solution-selector button").nth(2).click();
    await page.locator(".solution-selector button").nth(3).click();
    await page.locator(".solution-selector button").nth(0).click();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const a = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      a.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
    );
  }
fs.mkdirSync("/tmp/monetcore-qa-browser", { recursive: true });
await context.close();
await browser.close();
console.log(
  "PASS SEO, headers, contacts, preview isolation, planner persistence, booking race, duplicate submission, false success, every AI Core capability detail and light/dark responsive accessibility.",
);
