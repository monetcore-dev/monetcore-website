import { chromium } from "playwright-core";
import assert from "node:assert/strict";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:4600";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw new Error("Local preview only");
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  for (const width of [390, 1440]) {
    for (const refreshFails of [false, true]) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        reducedMotion: "reduce",
        ...(width === 390 ? { isMobile: true, hasTouch: true } : {}),
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      assert.equal(
        (await page.request.post(base + "/api/contact", { data: {} })).status(),
        403,
      );
      let availabilityCalls = 0;
      let submissions = 0;
      await page.route("**/api/book/availability?*", async (route) => {
        availabilityCalls++;
        const failed = refreshFails && availabilityCalls > 1;
        await route.fulfill({
          status: failed ? 503 : 200,
          contentType: "application/json",
          body: JSON.stringify(
            failed
              ? { error: "Unable to check availability." }
              : {
                  success: true,
                  bookedTimes: availabilityCalls > 1 ? ["10:00"] : [],
                  unavailableTimes: availabilityCalls > 1 ? ["10:00"] : [],
                },
          ),
        });
      });
      await page.route("**/api/book", async (route) => {
        submissions++;
        await route.fulfill({
          status: submissions === 1 ? 409 : 201,
          contentType: "application/json",
          body: JSON.stringify(
            submissions === 1
              ? { error: "Legacy conflict message" }
              : { success: true, calendar: { eventCreated: true } },
          ),
        });
      });
      await page.goto(base + "/book");
      await page
        .getByRole("button", { name: "Dismiss preview notice" })
        .click();
      await page
        .locator('[name="consultationType"]')
        .selectOption("Discovery Call - 30 minutes");
      await page.locator('input[type="date"]').fill("2030-01-07");
      const ten = page.getByRole("button", { name: /10:00/ });
      await page.waitForFunction(
        () =>
          !Array.from(document.querySelectorAll("button")).find((b) =>
            b.textContent.trim().startsWith("10:00"),
          )?.disabled,
      );
      await ten.click();
      await page.locator('[name="name"]').fill("Synthetic Conflict Check");
      await page.locator('[name="email"]').fill("conflict@example.invalid");
      const confirm = page.getByRole("button", {
        name: "Confirm Consultation",
      });
      await confirm.click();
      await page
        .getByRole("alert")
        .filter({
          hasText: refreshFails
            ? "Availability could not be refreshed"
            : "Availability has been refreshed",
        })
        .waitFor();
      assert.equal(availabilityCalls, 2);
      assert.equal(submissions, 1);
      assert.equal(await confirm.isDisabled(), true);
      assert.equal(await ten.isDisabled(), true);
      assert.equal(
        await page.locator('[name="name"]').inputValue(),
        "Synthetic Conflict Check",
      );
      assert.equal(
        await page.locator('[name="email"]').inputValue(),
        "conflict@example.invalid",
      );
      if (!refreshFails) {
        await page.getByRole("button", { name: /11:00/ }).click();
        await confirm.click();
        await page
          .getByRole("status")
          .filter({ hasText: "Your consultation has been booked" })
          .waitFor();
        assert.equal(submissions, 2);
      } else {
        assert.match(
          await page
            .getByRole("alert")
            .filter({ hasText: "The selected time is no longer available" })
            .innerText(),
          /choose a date.*select another available slot/i,
        );
      }
      assert.deepEqual(errors, []);
      console.log(
        `PASS booking conflict ${width}px, refresh ${refreshFails ? "failure" : "success"}; all API responses intercepted`,
      );
      await page.close();
    }
  }
} finally {
  await browser.close();
}
