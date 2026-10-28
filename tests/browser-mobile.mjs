const base = process.env.QA_BASE_URL || "http://127.0.0.1:4600";
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
(async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const ctx = await b.newContext({
    viewport: { width: 320, height: 800 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const p = await ctx.newPage();
  await p.clock.install();
  assert.equal(
    (await p.request.post(base + "/api/contact", { data: {} })).status(),
    403,
  );
  await p.goto(base);
  for (const width of [320, 360, 375, 390, 430, 768, 1024]) {
    await p.setViewportSize({ width, height: 844 });
    await p
      .getByRole("button", { name: "Open navigation menu", exact: true })
      .tap();
    await p
      .getByRole("button", { name: "Solutions & Services", exact: true })
      .tap();
    const bookingLink = p
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Book a Consultation", exact: true });
    await bookingLink.scrollIntoViewIfNeeded();
    assert.ok(
      await bookingLink.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return element.contains(
          document.elementFromPoint(
            box.x + box.width / 2,
            box.y + box.height / 2,
          ),
        );
      }),
      "Preview notice obscures consultation link at " + width,
    );
    await bookingLink.tap();
    await p.waitForURL("**/book");
    await p.goto(base);
  }
  console.log(
    "PASS preview notice does not cover mobile/tablet consultation links at seven widths.",
  );
  await p.getByRole("button", { name: "Dismiss preview notice" }).click();
  for (const width of [320, 360, 375, 390, 430]) {
    await p.setViewportSize({ width, height: 844 });
    await p.clock.runFor(50);
    const sim = p.locator(".automation-simulation");
    await sim.getByRole("button", { name: "Run Demo", exact: true }).tap();
    for (let stage = 2; stage <= 4; stage++) {
      await p.clock.fastForward(1400);
      await p.waitForFunction(
        (stage) =>
          document
            .querySelector(".simulation-output")
            .textContent.includes(`Stage ${stage} of 4`),
        stage,
      );
    }
    await sim.getByRole("button", { name: "Replay Demo", exact: true }).tap();
    await sim.getByRole("button", { name: "Reset Demo", exact: true }).tap();
    assert.match(await sim.innerText(), /Ready to explore/);
    for (const name of [
      "Understand",
      "Define",
      "Build & Review",
      "Launch & Support",
    ]) {
      const step = p.locator(".workflow-card-mobile").filter({ hasText: name });
      await step.tap();
      assert.equal(await step.getAttribute("aria-expanded"), "true");
      const panel = p.locator("#" + await step.getAttribute("aria-controls"));
      assert.ok(await panel.isVisible());
      assert.ok(await panel.evaluate(e => e.scrollHeight <= e.clientHeight + 1));
    }
    for (let i = 0; i < 4; i++) {
      const t = p.locator("#faq-trigger-" + i);
      await t.tap();
      assert.equal(await t.getAttribute("aria-expanded"), "true");
      await t.tap();
    }
    const planner = p.getByRole("form", { name: "Smart project planner" });
    await planner.locator('[name="plannerGoal"]').selectOption("ai");
    await planner
      .locator('[name="plannerChallenge"]')
      .selectOption("disconnected");
    await planner
      .locator('[name="plannerBudget"]')
      .selectOption("₦200,000 - ₦500,000");
    await planner
      .getByRole("button", { name: "Discuss This Project", exact: true })
      .tap();
    const form = p.getByRole("form", { name: "Project enquiry", exact: true });
    assert.equal(
      await form.locator('[name="service"]').inputValue(),
      "AI Solution",
    );
    assert.match(
      await form.locator('[name="message"]').inputValue(),
      /Tools and information do not connect/,
    );
    assert.equal(
      await p
        .locator(".site-header")
        .evaluate((element) => Math.round(element.getBoundingClientRect().top)),
      0,
      "Sticky header must remain at the viewport top",
    );
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await p
      .getByRole("button", { name: "Open navigation menu", exact: true })
      .tap();
    assert.equal(
      await p.evaluate(() => document.body.style.overflow),
      "hidden",
    );
    for (const menu of ["Solutions & Services", "Products", "Company"])
      await p.getByRole("button", { name: menu, exact: true }).tap();
    await p
      .locator("#primary-navigation")
      .evaluate((e) => (e.scrollTop = e.scrollHeight));
    assert.ok(
      await p
        .getByRole("navigation", { name: "Main navigation" })
        .getByRole("link", { name: "Book a Consultation", exact: true })
        .isVisible(),
    );
    await p
      .getByRole("button", { name: "Close navigation menu", exact: true })
      .tap();
    assert.equal(await p.evaluate(() => document.body.style.overflow), "");
  }
  await b.close();
  console.log(
    "PASS touch workflow, process, FAQ, planner and nested menu at all five phone widths.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
