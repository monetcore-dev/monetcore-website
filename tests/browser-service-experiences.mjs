import { chromium } from "playwright-core";
import assert from "node:assert/strict";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:6000";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw new Error("Local preview only");
const b = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const p = await b.newPage({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: "reduce",
});
const errors = [],
  api = [];
p.on("pageerror", (e) => errors.push(e.message));
p.on("request", (r) => {
  if (new URL(r.url()).pathname.startsWith("/api/")) api.push(r.url());
});
try {
  assert.equal(
    (await p.request.post(base + "/api/contact", { data: {} })).status(),
    403,
  );
  await p.goto(base + "/services/ai-automation");
  for (const name of [
    "AI Customer Support",
    "AI Receptionist",
    "AI Lead Qualification",
    "WhatsApp Automation",
    "Appointment Scheduling",
  ]) {
    await p.getByRole("button", { name, exact: true }).click();
    await p.locator(".demo-prompt").first().click();
    assert.equal(await p.getByRole("log").locator(".demo-message").count(), 3);
    await p.getByLabel("Your fictional enquiry").fill("Please hand me over");
    await p.getByRole("button", { name: "Send in demo", exact: true }).click();
    await p
      .getByRole("log")
      .getByText(/No person has been notified/)
      .waitFor();
    await p.getByRole("button", { name: "Reset conversation" }).click();
    assert.equal(await p.getByRole("log").locator(".demo-message").count(), 1);
  }
  console.log(
    "PASS five conversation modes, prompts, input, handoff and reset",
  );
  await p.goto(base + "/services/software-development");
  await p.getByLabel("Stage for Abuja Studio").selectOption("Won");
  await p.getByLabel("Pipeline filter").selectOption("Won");
  assert.equal(await p.locator(".demo-records article").count(), 2);
  await p.getByLabel("Search sample businesses").fill("no-match");
  await p.getByText("No sample records match.", { exact: false }).waitFor();
  await p.getByRole("button", { name: "Reset workspace" }).click();
  await p.getByRole("button", { name: "Inventory", exact: true }).click();
  await p.getByRole("button", { name: "Add 5 demo units" }).first().click();
  await p
    .getByRole("status")
    .filter({ hasText: "Added 5 fictional units" })
    .waitFor();
  await p.getByRole("button", { name: "Sales analytics", exact: true }).click();
  assert.equal(await p.locator("meter").count(), 4);
  await p.getByRole("button", { name: "Operations", exact: true }).click();
  await p.getByRole("button", { name: "Complete sample task" }).first().click();
  await p.getByRole("status").filter({ hasText: "marked complete" }).waitFor();
  console.log(
    "PASS workspace views, search/empty, filter, pipeline, inventory, charts and tasks",
  );
  await p.goto(base + "/services/business-integrations");
  await p.getByRole("button", { name: "Run workflow", exact: true }).click();
  for (let i = 0; i < 7; i++) {
    const replay = p.getByRole("button", {
      name: "Replay workflow",
      exact: true,
    });
    if (await replay.count()) break;
    await p
      .getByRole("button", {
        name: /^(Advance workflow|Approve sample request)$/,
      })
      .click();
  }
  await p
    .getByRole("status")
    .filter({ hasText: "Simulation complete" })
    .waitFor();
  await p.getByRole("button", { name: "Replay workflow" }).click();
  await p.getByRole("button", { name: "Reset workflow" }).click();
  await p.getByLabel("Simulate a recoverable handoff failure").check();
  await p.getByRole("button", { name: "Run workflow", exact: true }).click();
  await p.getByRole("button", { name: "Advance workflow" }).click();
  await p.getByRole("button", { name: "Advance workflow" }).click();
  await p.getByRole("button", { name: "Retry simulated handoff" }).click();
  await p.getByRole("button", { name: "Reset workflow" }).click();
  for (const t of ["CRM", "Email", "Accounting"])
    await p
      .locator(".demo-switches")
      .getByRole("button", { name: t, exact: true })
      .click();
  assert.equal(
    await p
      .getByRole("button", { name: "Run workflow", exact: true })
      .isDisabled(),
    true,
  );
  console.log(
    "PASS workflow progression, approval, replay/reset, failure/retry and empty-system validation",
  );
  await p.goto(base + "/services/website-development");
  for (const name of [
    "Professional practice",
    "Retail business",
    "Appointment business",
  ]) {
    await p.getByRole("button", { name, exact: true }).click();
    await p.getByRole("button", { name: "Explore sample services" }).click();
    await p.locator(".sample-website .demo-records button").first().click();
    await p.getByRole("button", { name: "Preview enquiry action" }).click();
    await p
      .getByRole("status")
      .filter({ hasText: "Nothing was submitted" })
      .waitFor();
  }
  await p.getByRole("button", { name: "Reset website" }).click();
  assert.equal(
    await p
      .getByRole("link", { name: "Compare website packages" })
      .getAttribute("href"),
    "/website-packages",
  );
  console.log(
    "PASS three website mockups, section navigation, local enquiry and package links",
  );
  await p.goto(base + "/services/mobile-app-development");
  await p.getByRole("button", { name: "Browse sample services" }).click();
  await p.getByRole("button", { name: "Add Business advisory" }).click();
  await p.getByRole("button", { name: "Request", exact: true }).click();
  await p.getByText("1 sample item selected.", { exact: true }).waitFor();
  await p.getByRole("button", { name: "Preview request", exact: true }).click();
  await p
    .getByText("Local request preview complete. No appointment was created.", {
      exact: true,
    })
    .waitFor();
  await p.getByRole("button", { name: "Reset app" }).click();
  console.log(
    "PASS mobile app screens, selection, local request/activity and reset",
  );
  await p.goto(base + "/services/digital-marketing");
  await p.getByLabel("Business industry").selectOption("Education");
  await p.getByLabel("Campaign goal").selectOption("Awareness");
  await p.getByLabel("Illustrative duration").selectOption("6");
  await p.getByRole("button", { name: "Generate sample strategy" }).click();
  for (const name of [
    "Strategy",
    "Content calendar",
    "Content preview",
    "Lead follow-up",
    "Sample metrics",
  ]) {
    await p.getByRole("button", { name, exact: true }).click();
    if (name === "Content calendar")
      assert.equal(await p.locator(".demo-calendar li").count(), 6);
    if (name === "Lead follow-up") {
      for (let i = 0; i < 3; i++)
        await p.getByRole("button", { name: "Explore next handoff" }).click();
      await p.getByRole("button", { name: "Replay follow-up" }).click();
    }
  }
  await p.getByRole("button", { name: "Reset campaign" }).click();
  await p.getByLabel("Instagram", { exact: true }).uncheck();
  await p.getByLabel("WhatsApp", { exact: true }).uncheck();
  await p.getByRole("button", { name: "Generate sample strategy" }).click();
  await p
    .getByRole("alert")
    .filter({ hasText: "Choose at least one platform" })
    .waitFor();
  console.log(
    "PASS campaign inputs, all five result views, calendar/copy/metrics, handoff and validation/reset",
  );
  await p.goto(base + "/services/technology-consulting");
  await p.getByRole("button", { name: "Build illustrative roadmap" }).click();
  await p
    .getByRole("alert")
    .filter({ hasText: "Select at least one challenge" })
    .waitFor();
  await p.getByLabel("Scattered customer records").check();
  await p.getByLabel("Low online visibility").check();
  await p.getByRole("button", { name: "Build illustrative roadmap" }).click();
  await p.getByText(/^Organise: define/).waitFor();
  await p.getByText(/^Establish: create/).waitFor();
  await p.getByRole("button", { name: "Reset assessment" }).click();
  assert.equal(await p.locator(".demo-result").count(), 0);
  console.log(
    "PASS assessment validation, challenge-specific roadmap and reset",
  );
  assert.deepEqual(api, []);
  assert.deepEqual(errors, []);
  console.log(
    "PASS service simulations made zero API requests and raised no browser exceptions",
  );
} finally {
  await b.close();
}
