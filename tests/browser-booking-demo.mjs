import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
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
  await p.goto(base + "/demo/fintech");
  await p.getByRole("button", { name: "Dismiss preview notice" }).click();
  const opener = p
    .locator("#explore")
    .getByRole("button")
    .filter({ hasText: "Instant Transfer" });
  await opener.click();
  const d = p.getByRole("dialog", { name: "Send Money demonstration" });
  assert.ok(await d.isVisible());
  assert.ok(
    await d
      .getByRole("button", { name: "Close dialog" })
      .evaluate((el) => el === document.activeElement),
  );
  await p.keyboard.press("Shift+Tab");
  assert.ok(
    await d
      .getByRole("button", { name: "Confirm demo transfer" })
      .evaluate((el) => el === document.activeElement),
  );
  await d.getByRole("spinbutton").fill("0");
  await d.getByRole("button", { name: "Confirm demo transfer" }).click();
  await d
    .getByRole("status")
    .filter({ hasText: "Enter a whole-naira amount" })
    .waitFor();
  await d.getByRole("spinbutton").fill("10000");
  await d.getByRole("button", { name: "Confirm demo transfer" }).click();
  await d
    .getByRole("status")
    .filter({
      hasText: "Successful demo: ₦10,000.00. No real money was moved.",
    })
    .waitFor();
  const a = await new AxeBuilder({ page: p })
    .include('[role="dialog"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    a.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
  );
  await p.keyboard.press("Escape");
  assert.equal(await d.count(), 0);
  assert.ok(await opener.evaluate((el) => el === document.activeElement));
  await p
    .locator("#explore")
    .getByRole("button")
    .filter({ hasText: "Flexible Loans" })
    .click();
  const loan = p.getByRole("dialog", { name: "Loans demonstration" });
  await loan.getByRole("spinbutton").fill("500000");
  await loan.locator("select").selectOption("6");
  assert.match(await loan.innerText(), /₦/);
  await p.keyboard.press("Escape");
  const demoRequests = [];
  p.on("request", (request) => {
    if (request.url().includes("/api/")) demoRequests.push(request.url());
  });
  for (const [label, action] of [
    ["Instant Transfer", "Send Money"],
    ["Scan to Pay", "Scan & Pay"],
    ["Savings Goals", "Save & Invest"],
    ["Grow Wealth", "Grow Wealth"],
    ["Flexible Loans", "Loans"],
    ["Merchant Payments", "Business"],
    ["Pay Bills", "Pay Bills"],
    ["Airtime & Data", "Airtime & Data"],
  ]) {
    await p
      .locator("#explore")
      .getByRole("button")
      .filter({ hasText: label })
      .click();
    const panel = p.getByRole("dialog", {
      name: action + " demonstration",
      exact: true,
    });
    if (action === "Grow Wealth") {
      for (const tab of ["Funds", "Stocks", "Bonds"]) {
        const button = panel.getByRole("button", { name: tab, exact: true });
        await button.click();
        assert.equal(await button.getAttribute("aria-pressed"), "true");
      }
    } else if (action === "Loans") {
      await panel.getByRole("spinbutton").fill("500000");
      await panel.locator("select").selectOption("6");
      assert.match(await panel.innerText(), /₦88,333.33/);
    } else {
      await panel.getByRole("spinbutton").fill("100");
      if (action === "Pay Bills")
        await panel.locator("select").selectOption("Internet");
      const confirm = panel.getByRole("button", {
        name:
          action === "Save & Invest"
            ? "Add simulated savings"
            : action === "Send Money"
              ? "Confirm demo transfer"
              : "Confirm demo payment",
        exact: true,
      });
      await confirm.click();
      await panel
        .getByRole("status")
        .filter({ hasText: "Successful demo: ₦100.00" })
        .waitFor();
      assert.ok(await confirm.isDisabled());
    }
    const scan = await new AxeBuilder({ page: p })
      .include('[role="dialog"]')
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      scan.violations.map((v) => ({
        id: v.id,
        targets: v.nodes.map((n) => n.target),
      })),
      [],
    );
    await p.keyboard.press("Escape");
    assert.equal(await panel.count(), 0);
  }
  assert.equal(
    demoRequests.length,
    0,
    "Financial demonstrations must never call APIs",
  );
  // The miniature wallet's labelled shortcuts must open their matching concepts.
  await p
    .getByRole("group", { name: "Illustrative wallet phone", exact: true })
    .tap({ position: { x: 50, y: 50 } });
  for (const [label, action] of [
    ["Save", "Save & Invest"],
    ["Invest", "Grow Wealth"],
  ]) {
    await p
      .getByRole("button", { name: new RegExp(label + "$"), exact: false })
      .first()
      .click();
    await p
      .getByRole("dialog", { name: action + " demonstration", exact: true })
      .waitFor();
    await p.keyboard.press("Escape");
  }
  await p.getByRole("button", { name: "Toggle menu", exact: true }).click();
  assert.equal(
    await p
      .getByRole("button", { name: "Toggle menu", exact: true })
      .getAttribute("aria-expanded"),
    "true",
  );
  await p.getByRole("link", { name: "Personal", exact: true }).click();
  assert.equal(
    await p
      .getByRole("button", { name: "Toggle menu", exact: true })
      .getAttribute("aria-expanded"),
    "false",
  );
  console.log(
    "PASS all eight MonePay dialogs, payment/savings state, investment buttons, exact loan calculation, shortcut labels and demo mobile menu without API calls.",
  );
  assert.equal(
    (await p.request.post(base + "/api/book", { data: {} })).status(),
    403,
  );
  assert.equal(
    (await p.request.post(base + "/api/contact", { data: {} })).status(),
    403,
  );
  console.log(
    "PASS MonePay modal focus/keyboard, transfer validation and simulated state, NGN loan preview, dialog accessibility and preview guards.",
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
