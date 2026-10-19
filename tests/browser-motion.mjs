const base = process.env.QA_BASE_URL || "http://127.0.0.1:4600";
import { chromium } from "playwright-core";
import assert from "node:assert/strict";
(async () => {
  assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
  const b = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
  const c = await b.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "no-preference",
  });
  const p = await c.newPage();
  const fonts = [];
  p.on("request", (r) => {
    if (r.resourceType() === "font") fonts.push(r.url());
  });
  await p.addInitScript(() => {
    window.__layoutShift = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        if (!e.hadRecentInput) window.__layoutShift += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await p.clock.install();
  await p.goto(base);
  await p.evaluate(() => document.fonts.ready);
  await p.clock.runFor(100);
  const region = p.getByRole("region", {
    name: "Technology and product showcases",
  });
  await region
    .getByRole("button", { name: "Next showcase", exact: true })
    .click();
  assert.match(
    await region.getByRole("group").getAttribute("aria-label"),
    /Website Development/,
  );
  await region
    .getByRole("button", { name: "Previous showcase", exact: true })
    .click();
  assert.match(
    await region.getByRole("group").getAttribute("aria-label"),
    /AI Lead Automation/,
  );
  await region
    .getByRole("button", { name: "Resume rotation", exact: true })
    .click();
  await p.locator("h1").click();
  await p.mouse.move(0, 0);
  await p.clock.runFor(100);
  const initialBox = await region.boundingBox();
  await p.clock.fastForward(7000);
  await p.waitForFunction(() =>
    document
      .querySelector('[aria-roledescription="slide"]')
      .getAttribute("aria-label")
      .includes("Website Development"),
  );
  assert.ok(
    Math.abs((await region.boundingBox()).height - initialBox.height) < 2,
  );
  await region.hover();
  await p.clock.runFor(100);
  const name = await region.getByRole("group").getAttribute("aria-label");
  await p.clock.fastForward(14000);
  assert.equal(
    await region.getByRole("group").getAttribute("aria-label"),
    name,
  );
  await region
    .getByRole("button", { name: "Pause rotation", exact: true })
    .click();
  assert.equal(
    await region
      .getByRole("button", { name: "Resume rotation", exact: true })
      .getAttribute("aria-pressed"),
    "true",
  );
  await p.locator("h1").click();
  await p.mouse.move(0, 0);
  await p.clock.fastForward(14000);
  assert.equal(
    await region.getByRole("group").getAttribute("aria-label"),
    name,
  );
  await region
    .getByRole("button", { name: "Resume rotation", exact: true })
    .click();
  await p.locator("h1").click();
  await p.mouse.move(0, 0);
  await p.clock.runFor(100);
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.clock.runFor(100);
  const reduced = await region.getByRole("group").getAttribute("aria-label");
  await p.clock.fastForward(14000);
  assert.equal(
    await region.getByRole("group").getAttribute("aria-label"),
    reduced,
  );
  assert.ok(fonts.length >= 2);
  assert.ok(fonts.every((url) => new URL(url).hostname === "127.0.0.1"));
  const previousStep = p.getByRole("button", {
    name: "Previous Step",
    exact: true,
  });
  const nextStep = p.getByRole("button", { name: "Next Step", exact: true });
  assert.ok(await previousStep.isDisabled());
  await nextStep.click();
  assert.equal(
    await p.locator("#workflow-step-1").getAttribute("aria-pressed"),
    "true",
  );
  await previousStep.click();
  assert.equal(
    await p.locator("#workflow-step-0").getAttribute("aria-pressed"),
    "true",
  );
  for (let i = 0; i < 4; i++) {
    const step = p.locator("#workflow-step-" + i);
    await step.focus();
    await p.keyboard.press("Space");
    assert.equal(await step.getAttribute("aria-pressed"), "true");
    const q = p.locator("#faq-trigger-" + i);
    await q.focus();
    await p.keyboard.press("Enter");
    assert.equal(await q.getAttribute("aria-expanded"), "true");
    await p.keyboard.press("Space");
    assert.equal(await q.getAttribute("aria-expanded"), "false");
  }
  assert.ok(await nextStep.isDisabled());
  const cls = await p.evaluate(() => window.__layoutShift);
  assert.ok(cls < 0.01, "layout shift " + cls);
  console.log(
    "PASS automatic rotation, hover pause, reduced motion, stable height, local font requests; observed layout shift:",
    cls,
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
