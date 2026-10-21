import { chromium } from "playwright-core";
import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const ctx = await b.newContext({
    viewport: { width: 1440, height: 1000 },
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
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  const apiRequests = [];
  p.on("request", (r) => {
    if (r.url().includes("/api/")) apiRequests.push(r.url());
  });
  await p.clock.install();
  await p.goto(base);
  await p.evaluate(() => document.fonts.ready);
  await p.getByRole("button", { name: "Dismiss preview notice" }).click();
  assert.deepEqual(
    await p
      .locator("main > section")
      .evaluateAll((items) =>
        items
          .map((e) => e.id)
          .filter((id) => ["faq", "explore-solutions", "contact"].includes(id)),
      ),
    ["faq", "explore-solutions", "contact"],
  );
  const selector = p.getByRole("group", { name: "Solution categories" });
  const names = [
    "AI Automation",
    "Custom Software Development",
    "Smart Website Solutions",
    "Business Integrations",
  ];
  let panelHeight;
  for (const width of [375, 390, 768, 1024, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    await p.clock.runFor(50);
    panelHeight = null;
    for (const [i, name] of names.entries()) {
      const trigger = selector.getByRole("button", { name, exact: true });
      await trigger.focus();
      await p.keyboard.press(i % 2 ? "Space" : "Enter");
      assert.equal(await trigger.getAttribute("aria-pressed"), "true");
      assert.equal(await selector.locator('[aria-pressed="true"]').count(), 1);
      const panel = p.getByRole("region", { name, exact: true });
      assert.ok(await panel.isVisible());
      assert.equal(
        await panel.locator(".solution-description h3").innerText(),
        name,
      );
      const h = (await panel.boundingBox()).height;
      if (panelHeight && width >= 1024) assert.equal(h, panelHeight);
      panelHeight = h;
      const href = await panel
        .locator(".solution-description > a")
        .first()
        .getAttribute("href");
      assert.equal(
        (await p.request.get(new URL(href, base).href)).status(),
        200,
      );
      assert.ok(
        await p.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "overflow " + width + " " + name,
      );
    }
  }
  console.log(
    "PASS four solution panels, keyboard selection, real CTAs, five widths and stable canvas.",
  );
  await selector
    .getByRole("button", { name: "AI Automation", exact: true })
    .click();
  const sim = p.locator(".automation-simulation");
  await sim.getByRole("button", { name: "Run Demo", exact: true }).click();
  assert.match(await sim.innerText(), /Stage 1 of 4/);
  await p.clock.fastForward(1400);
  await p.waitForFunction(() =>
    document
      .querySelector(".simulation-output")
      .textContent.includes("Stage 2 of 4"),
  );
  assert.match(await sim.innerText(), /predefined text/i);
  await sim.getByRole("button", { name: "Reset Demo", exact: true }).click();
  await p.clock.fastForward(6000);
  assert.match(await sim.innerText(), /Ready to explore/);
  assert.ok(
    await sim
      .getByRole("button", { name: "Reset Demo", exact: true })
      .isDisabled(),
  );
  await sim.getByRole("button", { name: "Run Demo", exact: true }).click();
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
  assert.match(await sim.innerText(), /Complete/);
  await sim.getByRole("button", { name: "Replay Demo", exact: true }).click();
  assert.match(await sim.innerText(), /Stage 1 of 4/);
  await selector
    .getByRole("button", { name: "Custom Software Development", exact: true })
    .click();
  await p.clock.fastForward(6000);
  await selector
    .getByRole("button", { name: "AI Automation", exact: true })
    .click();
  assert.match(await sim.innerText(), /Ready to explore/);
  assert.equal(apiRequests.length, 0, "simulation must never call an API");
  console.log(
    "PASS demo run, all four stages, reset cancellation, replay, category-switch cleanup and no API requests.",
  );
  const form = p.getByRole("form", { name: "Project enquiry", exact: true });
  await form.locator('[name="name"]').fill("Existing Name");
  await form.locator('[name="email"]').fill("test@example.invalid");
  const planner = p.getByRole("form", {
    name: "Smart project planner",
    exact: true,
  });
  assert.ok(
    await planner
      .getByRole("button", { name: "Discuss This Project", exact: true })
      .isDisabled(),
  );
  await planner.locator('[name="plannerGoal"]').selectOption("unsure");
  await planner
    .locator('[name="plannerChallenge"]')
    .selectOption("disconnected");
  await planner
    .locator('[name="plannerCapability"][value="connections"]')
    .check();
  await planner
    .locator('[name="plannerBudget"]')
    .selectOption("₦200,000 - ₦500,000");
  assert.equal(
    await planner.locator(".planner-recommendation h4").innerText(),
    "Business Integrations",
  );
  await planner
    .getByRole("button", { name: "Discuss This Project", exact: true })
    .click();
  await p.waitForURL("**/#project-enquiry");
  assert.equal(
    await form.locator('[name="service"]').inputValue(),
    "Business Automation",
  );
  assert.equal(
    await form.locator('[name="budget"]').inputValue(),
    "₦200,000 - ₦500,000",
  );
  assert.match(
    await form.locator('[name="message"]').inputValue(),
    /Tools and information do not connect/,
  );
  assert.match(
    await form.locator('[name="message"]').inputValue(),
    /Connect existing tools/,
  );
  assert.equal(
    await form.locator('[name="name"]').inputValue(),
    "Existing Name",
  );
  assert.equal(
    await form.locator('[name="email"]').inputValue(),
    "test@example.invalid",
  );
  assert.equal(apiRequests.length, 0, "planner must not submit");
  for (const [goal, expected, service] of [
    ["ai", "AI Automation", "AI Solution"],
    ["software", "Custom Software Development", "Software Development"],
    ["websites", "Smart Website Solutions", "Business Website"],
    ["integrations", "Business Integrations", "Business Automation"],
  ]) {
    await planner.locator('[name="plannerGoal"]').selectOption(goal);
    assert.equal(
      await planner.locator(".planner-recommendation h4").innerText(),
      expected,
    );
    await planner
      .getByRole("button", { name: "Discuss This Project", exact: true })
      .click();
    await p.waitForFunction(
      (service) =>
        document.querySelector('#project-enquiry [name="service"]').value ===
        service,
      service,
    );
  }
  await form.locator('[name="message"]').fill("Editable project outline.");
  assert.match(
    await form.locator(".enquiry-character-count").innerText(),
    /^25 \/ 5,000/,
  );
  console.log(
    "PASS planner rules, capability selection, NGN budget, in-memory handoff, preserved personal fields and editable character count.",
  );
  // Genuine preview backend must refuse the manual submission.
  await form
    .getByRole("button", { name: "Send Project Enquiry", exact: true })
    .click();
  await form.getByRole("alert").filter({ hasText: "Review preview" }).waitFor();
  assert.equal(
    await form
      .getByText(
        "Thank you. Your project enquiry has been sent to Monetcore.",
        { exact: true },
      )
      .count(),
    0,
  );
  let calls = 0;
  await p.route("**/api/contact", (route) => {
    calls++;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(
        calls === 1
          ? { success: false, error: "Not confirmed" }
          : { success: true },
      ),
    });
  });
  await form
    .getByRole("button", { name: "Send Project Enquiry", exact: true })
    .click();
  await form.getByRole("alert").filter({ hasText: "Not confirmed" }).waitFor();
  assert.equal(
    await form
      .getByText(
        "Thank you. Your project enquiry has been sent to Monetcore.",
        { exact: true },
      )
      .count(),
    0,
  );
  await form
    .getByRole("button", { name: "Send Project Enquiry", exact: true })
    .click();
  await form.getByRole("status").filter({ hasText: "Thank you." }).waitFor();
  assert.equal(await form.locator('[name="message"]').inputValue(), "");
  console.log(
    "PASS preview rejection, no false success on HTTP 200 without confirmation, confirmed-response UI and reset (intercepted).",
  );
  assert.deepEqual(errors, []);
  await p.unroute("**/api/contact");
  await p.clock.resume();
  const axe = await new AxeBuilder({ page: p })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  console.log(
    "Accessibility:",
    JSON.stringify(
      axe.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ),
  );
  assert.deepEqual(
    axe.violations.map((v) => v.id),
    [],
  );
  await p.evaluate(() => scrollTo(0, 0));
  await p.screenshot({
    path: "/tmp/monetcore-experience-desktop.png",
    fullPage: true,
  });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.screenshot({
    path: "/tmp/monetcore-experience-mobile.png",
    fullPage: true,
  });
  await b.close();
  console.log("PASS accessibility scan and no browser exceptions.");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
