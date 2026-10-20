import { chromium } from "playwright-core";
import assert from "node:assert/strict";
(async () => {
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const p = await b.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
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
  const packages = [
    ["starter", "Smart Starter", "₦99,000", "₦45,000"],
    ["business", "Smart Business", "₦179,000", "₦60,000"],
    ["pro", "Smart Business Pro", "From ₦299,000", "From ₦90,000"],
  ];
  await p.goto(base + "/website-packages");
  assert.equal(await p.locator("footer").count(), 1);
  assert.equal(await p.getByRole("table").count(), 1);
  assert.equal(await p.getByRole("columnheader").count(), 4);
  assert.doesNotMatch(await p.locator("body").innerText(), /\$\d|USD/);
  for (const [id, name, price, renewal] of packages) {
    const card = p.locator("#package-" + id);
    const text = await card.innerText();
    assert.ok(text.includes(price), name + " price");
    assert.ok(
      text.includes("Proposed annual renewal: " + renewal),
      name + " renewal",
    );
    const u = new URL(
      await card
        .getByRole("link", {
          name: "WhatsApp enquiry about " + name,
          exact: true,
        })
        .getAttribute("href"),
    );
    assert.equal(u.hostname, "wa.me");
    assert.equal(u.pathname, "/2347065880558");
    const msg = u.searchParams.get("text");
    for (const s of [name, price, renewal, "proposed"])
      assert.ok(msg.includes(s), s + " WhatsApp");
    for (const label of ["Request a Quotation: " + name]) {
      await card.getByRole("link", { name: label, exact: true }).click();
      await p.waitForURL((url) => url.searchParams.get("package") === id);
      await p.waitForFunction(
        (id) =>
          document.querySelector('select[name="packageId"]')?.value === id,
        id,
      );
      assert.equal(
        await p.locator('select[name="service"]').inputValue(),
        "Business Website",
      );
    }
  }
  console.log(
    "PASS prices, renewals, six package selection links and all WhatsApp messages.",
  );
  for (const width of [375, 390, 768, 1440]) {
    await p.setViewportSize({ width, height: 900 });
    await p.goto(base + "/website-packages");
    assert.ok(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "page overflow " + width,
    );
    const region = p.getByRole("region", {
      name: "Scrollable package comparison",
    });
    if (width < 768)
      assert.ok(await region.evaluate((el) => el.scrollWidth > el.clientWidth));
    await region.focus();
    assert.equal(await region.getAttribute("tabindex"), "0");
  }
  await p.screenshot({
    path: "/tmp/monetcore-phase3-desktop.png",
    fullPage: true,
  });
  await p.setViewportSize({ width: 390, height: 844 });
  await p.screenshot({
    path: "/tmp/monetcore-phase3-mobile.png",
    fullPage: true,
  });
  await p.goto(base + "/website-packages?package=invalid");
  assert.equal(await p.locator('[name="packageId"]').inputValue(), "");
  await p.goto(base + "/website-packages?package=starter&package=pro");
  assert.equal(await p.locator('[name="packageId"]').inputValue(), "");
  await p.goto(base + "/website-packages?package=business#quotation");
  let calls = 0,
    payload;
  await p.route("**/api/contact", async (route) => {
    calls++;
    payload = route.request().postDataJSON();
    await route.fulfill({
      status: calls === 1 ? 503 : 200,
      contentType: "application/json",
      body: JSON.stringify(
        calls === 1 ? { error: "Test service unavailable" } : { success: true },
      ),
    });
  });
  const form = p.getByRole("form", { name: "Website quotation enquiry" });
  await form.getByRole("button", { name: "Send Quotation Request" }).click();
  assert.equal(calls, 0);
  await form.locator('[name="name"]').fill("Local Browser Check");
  await form.locator('[name="email"]').fill("invalid");
  assert.equal(
    await form.locator('[name="email"]').evaluate((el) => el.checkValidity()),
    false,
  );
  await form.locator('[name="email"]').fill("test@example.invalid");
  await form
    .locator('[name="message"]')
    .fill("Interception test; no real message.");
  await form.getByRole("button", { name: "Send Quotation Request" }).click();
  assert.equal(calls, 0, "consent required");
  await form.locator('[name="consent"]').check();
  await form.getByRole("button", { name: "Send Quotation Request" }).click();
  await form
    .getByRole("alert")
    .filter({ hasText: "We couldn't send" })
    .waitFor();
  assert.equal(payload.packageId, "business");
  assert.equal(payload.consent, true);
  assert.equal(
    await form.locator('[name="message"]').inputValue(),
    "Interception test; no real message.",
  );
  await form.getByRole("button", { name: "Send Quotation Request" }).click();
  await form.getByRole("status").filter({ hasText: "Thank you." }).waitFor();
  assert.equal(calls, 2);
  console.log(
    "PASS responsive layouts, accessible comparison, invalid query handling, native validation, consent, package payload, form error/retry/success (intercepted; no email sent).",
  );
  await p.unroute("**/api/contact");
  const valid = {
    name: "Test",
    email: "test@example.invalid",
    message: "Invalid submission test",
    startedAt: Date.now() - 10000,
    packageId: "starter",
    consent: true,
  };
  await p.goto(base + "/website-packages?package=starter#quotation");
  await p.locator('[name="name"]').fill("QA preserved draft");
  await p.locator('[name="email"]').fill("qa@example.invalid");
  await p.locator('[name="message"]').fill("Keep this quotation outline.");
  await p.locator('[name="packageId"]').selectOption("pro");
  for (const [name, id] of [
    ["Smart Business", "business"],
    ["Smart Business Pro", "pro"],
    ["Smart Starter", "starter"],
  ]) {
    await p
      .getByRole("link", { name: "Request a Quotation: " + name, exact: true })
      .click();
    await p.waitForURL((url) => url.searchParams.get("package") === id);
    await p.waitForFunction(
      (id) => document.querySelector('[name="packageId"]').value === id,
      id,
    );
    assert.equal(await p.locator('[name="packageId"]').inputValue(), id);
    assert.ok(!new URL(p.url()).hash.includes("#quotation#"));
    assert.equal(
      await p.locator('[name="name"]').inputValue(),
      "QA preserved draft",
    );
    assert.equal(
      await p.locator('[name="email"]').inputValue(),
      "qa@example.invalid",
    );
    assert.equal(
      await p.locator('[name="message"]').inputValue(),
      "Keep this quotation outline.",
    );
  }
  await p.locator('[name="packageId"]').selectOption("pro");
  await p
    .getByRole("link", {
      name: "Request a Quotation: Smart Starter",
      exact: true,
    })
    .click();
  await p.waitForFunction(
    () => document.querySelector('[name="packageId"]').value === "starter",
  );
  assert.equal(
    await p.locator('[name="name"]').inputValue(),
    "QA preserved draft",
  );
  console.log(
    "PASS switching all three packages preserves entered quotation details.",
  );
  const cases = [
    {},
    { ...valid, packageId: "invalid" },
    { ...valid, packageId: { id: "starter" } },
    { ...valid, consent: false },
    { ...valid, consent: "true" },
    { ...valid, email: "invalid" },
    { ...valid, message: "x".repeat(5001) },
    { ...valid, startedAt: Date.now() },
  ];
  for (const data of cases) {
    const r = await p.request.post(base + "/api/contact", { data });
    assert.equal(r.status(), 403, JSON.stringify(data).slice(0, 100));
  }
  for (const route of [
    "/",
    "/services",
    "/products",
    "/about",
    "/contact",
    "/book",
    "/demo/fintech",
  ]) {
    const r = await p.goto(base + route);
    assert.equal(r.status(), 200);
    assert.equal(await p.locator("footer").count(), 1);
  }
  assert.deepEqual(errors, []);
  await b.close();
  console.log(
    "PASS preview guards for eight submission cases; seven existing routes; no browser exceptions.",
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
