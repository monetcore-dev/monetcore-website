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
    for (const outcome of ["reserved_incomplete", "unknown", "confirmed"]) {
      const page = await browser.newPage({
        viewport: { width, height: 1000 },
        reducedMotion: "reduce",
      });
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      assert.equal(
        (await page.request.post(base + "/api/book", { data: {} })).status(),
        403,
      );
      assert.equal(
        (
          await page.request.get(
            base + "/api/book/availability?date=2030-01-07",
          )
        ).status(),
        403,
      );
      let calls = 0;
      await page.route("**/api/book/availability?*", (route) =>
        route.fulfill({
          status: 200,
          json: { success: true, unavailableTimes: [], bookedTimes: [] },
        }),
      );
      await page.route("**/api/book", (route) => {
        calls++;
        return route.fulfill({
          status:
            outcome === "confirmed" ? 201 : outcome === "unknown" ? 500 : 202,
          json: {
            success: outcome === "confirmed",
            outcome,
            booking: { id: "synthetic-only" },
            error:
              outcome === "unknown" ? "Unable to verify booking." : undefined,
          },
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
      const time = page.getByRole("button", { name: /10:00/ });
      await time.waitFor();
      await page.waitForFunction(
        () =>
          !Array.from(document.querySelectorAll("button")).find((b) =>
            b.textContent.trim().startsWith("10:00"),
          )?.disabled,
      );
      await time.click();
      await page.locator('[name="name"]').fill("Synthetic Outcome Test");
      await page.locator('[name="email"]').fill("test@example.invalid");
      const submit = page.getByRole("button", { name: "Confirm Consultation" });
      await submit.click();
      if (outcome === "confirmed") {
        await page
          .getByRole("status")
          .filter({ hasText: "Your consultation has been booked" })
          .waitFor();
      } else {
        const alert = page
          .getByRole("alert")
          .filter({ hasText: /Do not resubmit or choose another slot/ });
        await alert.waitFor();
        assert.equal(await submit.isDisabled(), true);
        assert.equal(
          await page.getByText(/Your consultation has been booked/).count(),
          0,
        );
        await page.getByRole("button", { name: /11:00/ }).click();
        assert.equal(await submit.isDisabled(), true);
        assert.equal(await alert.isVisible(), true);
        assert.equal(
          await page.locator('[name="name"]').inputValue(),
          "Synthetic Outcome Test",
        );
      }
      assert.equal(calls, 1);
      assert.deepEqual(errors, []);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.close();
    }
    console.log(
      `PASS ${width}px saved-incomplete/unknown/confirmed outcomes, persistent retry lock, preview guards and no overflow`,
    );
  }
} finally {
  await browser.close();
}
