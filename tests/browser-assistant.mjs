import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
const base = process.env.QA_BASE_URL || "http://127.0.0.1:6240";
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({ reducedMotion: "reduce" }),
  page = await context.newPage();
const errors = [],
  external = [];
page.on("pageerror", (e) => errors.push(e.message));
await context.route("**/*", (route) => {
  if (new URL(route.request().url()).origin !== new URL(base).origin) {
    external.push(route.request().url());
    return route.abort();
  }
  return route.continue();
});
try {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(base + "/assistant");
    const preview = page.getByRole("button", {
      name: "Dismiss preview notice",
    });
    if (await preview.count()) await preview.click();
    assert.equal(await page.locator("h1").count(), 1);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.ok(
      await page
        .getByRole("link", { name: "Privacy Policy", exact: true })
        .count(),
    );
    const question = page.getByRole("textbox", { name: "Your question" });
    await question.focus();
    assert.equal(
      await question.evaluate((e) => e === document.activeElement),
      true,
    );
    if (width === 390 || width === 1440) {
      const result = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze();
      assert.deepEqual(
        result.violations.map((v) => v.id),
        [],
      );
    }
  }
  await page
    .getByRole("button", { name: "What services do you offer?", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Ask Monetcore", exact: true })
    .click();
  await page.getByRole("alert").filter({ hasText: "unavailable" }).waitFor();
  const caseSelector = page.getByRole("combobox", {
    name: "Synthetic staging test case",
  });
  const stagingSelectorVisible = (await caseSelector.count()) > 0;
  if (stagingSelectorVisible) await caseSelector.selectOption("case-03");
  let payload, caseHeader;
  await page.route("**/api/assistant", async (route) => {
    payload = route.request().postDataJSON();
    caseHeader = route.request().headers()["x-monetcore-test-case"];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        answers: [
          {
            text: "Approved company answer.",
            links: [
              { label: "Contact Monetcore", href: "/contact#consultation" },
            ],
          },
        ],
      }),
    });
  });
  await page
    .getByRole("button", { name: "Ask Monetcore", exact: true })
    .click();
  await page
    .getByRole("log")
    .getByText("Approved company answer.", { exact: false })
    .waitFor();
  assert.deepEqual(payload.messages, ["What services do you offer?"]);
  assert.equal(caseHeader, stagingSelectorVisible ? "case-03" : undefined);
  await page.getByRole("button", { name: "Clear Conversation" }).click();
  assert.equal(await page.getByRole("log").innerText(), "");
  await page.reload();
  assert.equal(
    await page.getByRole("textbox", { name: "Your question" }).inputValue(),
    "",
  );
  assert.deepEqual(external, []);
  assert.deepEqual(errors, []);
  console.log(
    "PASS assistant 320/390/768/1440px, keyboard, axe, disabled endpoint, mocked success, clear and reload; zero external requests/errors",
  );
} finally {
  await browser.close();
}
