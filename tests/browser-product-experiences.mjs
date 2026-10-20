import { chromium } from "playwright-core";
import assert from "node:assert/strict";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:6102";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw new Error("Local preview only");
const b = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const p = await b.newPage({
  viewport: { width: 390, height: 844 },
  reducedMotion: "reduce",
  isMobile: true,
  hasTouch: true,
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
  await p.goto(base + "/products/ai-lead-automation");
  await p.getByRole("button", { name: "Capture sample enquiry" }).click();
  await p
    .locator(".demo-records")
    .getByText(/Nurture/)
    .waitFor();
  await p.getByLabel("Budget readiness").selectOption("Budget allocated");
  await p.getByRole("button", { name: "Capture sample enquiry" }).click();
  await p.getByLabel("Lead pipeline filter").selectOption("Discovery ready");
  assert.equal(await p.locator(".demo-records article").count(), 1);
  await p.getByRole("button", { name: "Preview follow-up for lead 2" }).click();
  await p
    .getByRole("status")
    .filter({ hasText: "No response or message was sent" })
    .waitFor();
  await p.getByRole("button", { name: "Review sample lead 2" }).click();
  assert.equal(await p.locator(".demo-records article").count(), 0);
  await p.getByLabel("Lead pipeline filter").selectOption("Reviewed");
  assert.equal(await p.locator(".demo-records article").count(), 1);
  await p.getByRole("button", { name: "Reset leads" }).click();
  assert.equal(await p.locator(".demo-records article").count(), 0);
  console.log(
    "PASS lead capture, qualification, pipeline filters, review, follow-up preview/reset",
  );
  await p.goto(base + "/products/smart-booking");
  assert.equal(
    await p
      .getByLabel("Demo appointment time")
      .locator('option[value="09:00"]')
      .evaluate((element) => element.disabled),
    true,
  );
  await p.getByLabel("Demo appointment time").selectOption("10:00");
  await p.getByRole("button", { name: "Reserve demo slot" }).click();
  assert.equal(await p.locator(".demo-records article").count(), 2);
  assert.equal(
    await p
      .getByLabel("Demo appointment time")
      .locator('option[value="10:00"]')
      .evaluate((element) => element.disabled),
    true,
  );
  await p.getByRole("button", { name: "Simulate calendar step 2" }).click();
  await p
    .getByRole("status")
    .filter({ hasText: "No event was created" })
    .waitFor();
  assert.equal(
    await p
      .getByRole("button", { name: "Simulate calendar step 2" })
      .evaluate((element) => element.disabled),
    true,
  );
  await p.getByRole("button", { name: "Preview notification 2" }).click();
  await p
    .getByRole("status")
    .filter({ hasText: "No email or reminder sent" })
    .waitFor();
  await p.getByRole("button", { name: "Cancel demo reservation 2" }).click();
  assert.equal(
    await p
      .getByLabel("Demo appointment time")
      .locator('option[value="10:00"]')
      .evaluate((element) => element.disabled),
    false,
  );
  await p.getByLabel("Demo appointment time").selectOption("10:00");
  await p.getByRole("button", { name: "Reserve demo slot" }).click();
  assert.equal(await p.locator(".demo-records article").count(), 3);
  await p.getByRole("button", { name: "Reset booking demo" }).click();
  assert.equal(await p.locator(".demo-records article").count(), 1);
  console.log(
    "PASS local reservation, occupied slots, Calendar/notification previews, cancellation/rebooking/reset",
  );
  await p.goto(base + "/products/ai-receptionist");
  assert.equal(
    await p
      .getByRole("button", { name: "AI Receptionist", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await p
    .getByRole("button", { name: /Please hand me over/ })
    .click();
  await p
    .getByRole("log")
    .getByText(/No person has been notified/)
    .waitFor();
  await p.goto(base + "/products/crm");
  await p.getByLabel("Search sample businesses").fill("LAGOS");
  assert.equal(await p.locator(".demo-records article").count(), 1);
  await p.goto(base + "/products/business-automation");
  await p.getByLabel("Workflow template").selectOption("Approval request");
  await p.getByRole("button", { name: "Run workflow", exact: true }).click();
  await p.getByRole("status").filter({ hasText: "Step 1 of" }).waitFor();
  await p.goto(base + "/products/ai-marketing-manager");
  await p.getByRole("button", { name: "Generate sample strategy" }).click();
  await p.getByRole("button", { name: "Sample metrics", exact: true }).click();
  await p.getByText("Fictional enquiries", { exact: true }).waitFor();
  assert.deepEqual(errors, []);
  assert.deepEqual(api, []);
  console.log(
    "PASS all six product demos, honest local actions, zero API calls/browser exceptions",
  );
} finally {
  await b.close();
}
