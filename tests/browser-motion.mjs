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
  const region = p.locator("#corporate-hero");
  const initialBox = await region.boundingBox();
  await region
    .getByRole("button", { name: "Pause background animation", exact: true })
    .click();
  assert.equal(await region.getAttribute("data-motion"), "paused");
  await p.clock.fastForward(14000);
  assert.equal((await region.boundingBox()).height, initialBox.height);
  await region
    .getByRole("button", { name: "Resume background animation", exact: true })
    .click();
  await p.locator("h1").click();
  await p.mouse.move(0, 0);
  assert.equal(await region.getAttribute("data-motion"), "running");
  await p.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await region.evaluate(el => el.getAnimations({ subtree: true }).length), 0);
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
    "PASS continuous hero pause/resume, reduced motion, stable height, local fonts and existing workflow/FAQ keys; observed layout shift:",
    cls,
  );
  await b.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
