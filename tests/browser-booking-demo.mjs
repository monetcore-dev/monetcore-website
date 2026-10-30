import { chromium } from "playwright-core";
import assert from "node:assert/strict";
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const ctx = await b.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const p = await ctx.newPage();
  const base = process.env.QA_BASE_URL || "http://127.0.0.1:4600";
  if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
    throw new Error("QA requires a local preview server");
  assert.equal(
    (await p.request.post(base + "/api/contact", { data: {} })).status(),
    403,
    "Preview safeguards must be active",
  );
  await p.goto(base + "/book");
  await p.getByRole("button", { name: "Dismiss preview notice" }).click();
  let payload;
  await p.route("**/api/book/availability?*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        bookedTimes: ["09:00"],
        unavailableTimes: ["09:00"],
      }),
    }),
  );
  await p.route("**/api/book", (route) => {
    payload = route.request().postDataJSON();
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
  await p
    .locator('[name="consultationType"]')
    .selectOption("Discovery Call - 30 minutes");
  await p.locator('input[type="date"]').fill("2030-01-07");
  await p.waitForFunction(
    () =>
      !Array.from(document.querySelectorAll("button")).find((b) =>
        b.textContent.trim().startsWith("10:00"),
      )?.disabled,
  );
  assert.equal(
    await p.getByRole("button", { name: /09:00/ }).isDisabled(),
    true,
  );
  await p.getByRole("button", { name: /10:00/ }).click();
  await p.locator('[name="name"]').fill("Local Browser Check");
  await p.locator('[name="email"]').fill("test@example.invalid");
  await p.locator('[name="phone"]').fill("08000000000");
  await p.getByRole("button", { name: "Confirm Consultation" }).click();
  await p
    .getByText("Your consultation has been booked for 2030-01-07 at 10:00 WAT.")
    .waitFor();
  assert.equal(payload.time, "10:00");
  console.log(
    "PASS booking availability, disabled occupied slot, selection and success UI (intercepted; no booking/calendar/email created).",
  );
  const retired = await p.request.get(base + "/demo/fintech", {
    maxRedirects: 0,
  });
  assert.equal(retired.status(), 308);
  assert.equal(retired.headers().location, "/products/fintech-products");
  await p.goto(base + "/demo/fintech");
  await p.waitForURL("**/products/fintech-products");
  assert.equal(await p.locator("h1").innerText(), "Fintech Products");
  assert.equal(await p.getByRole("dialog").count(), 0);
  assert.ok(
    await p
      .getByRole("link", { name: "Request a Quotation", exact: true })
      .isVisible(),
  );
  assert.ok(
    await p
      .getByRole("link", { name: "Book a Consultation", exact: true })
      .first()
      .isVisible(),
  );
  console.log(
    "PASS retired fintech redirect, category positioning and enquiry CTAs; no public payment demo.",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
