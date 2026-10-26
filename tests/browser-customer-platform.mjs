// Actual app + real isolated PostgreSQL; no SMTP, provider calls or live settings.
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import { Pool } from "pg";
import { hashPassword } from "better-auth/crypto";
import { randomUUID } from "node:crypto";
import net from "node:net";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import fs from "node:fs";
if (process.argv[2] !== "--disposable-local-only" || process.argv.length !== 3)
  throw new Error("Explicit disposable-local test required");
const socket = "/tmp/monetcore-customer-pg-socket";
const admin = new Pool({
  host: socket,
  user: "postgres",
  database: "monetcore_customer_staging",
});
const bridge = net.createServer((client) => {
  const upstream = net.connect({ path: socket + "/.s.PGSQL.5432" });
  client.pipe(upstream).pipe(client);
  client.on("error", () => upstream.destroy());
  upstream.on("error", () => client.destroy());
});
let server, browser, context;
let closing=false;
const errors = [];
try {
  const marker = (
    await admin.query("SELECT current_setting('cluster_name') AS name")
  ).rows[0].name;
  assert.equal(marker, "monetcore_customer_disposable");
  const id = randomUUID(),
    email = `browser-${id}@example.invalid`,
    password = "Synthetic browser password 123!";
  const org = (
    await admin.query(
      "SELECT id FROM customer.organizations WHERE name='Synthetic A'",
    )
  ).rows[0].id;
  await admin.query(
    'INSERT INTO customer_auth.auth_user(id,name,email,"emailVerified") VALUES($1,$2,$3,true)',
    [id, "Synthetic Browser", email],
  );
  await admin.query(
    'INSERT INTO customer_auth.auth_account(id,"accountId","providerId","userId",password) VALUES($1,$2,$3,$4,$5)',
    [randomUUID(), id, "credential", id, await hashPassword(password)],
  );
  await admin.query(
    "INSERT INTO customer.memberships(organization_id,user_id,role) VALUES($1,$2,'organization_member')",
    [org, id],
  );
  await new Promise((resolve, reject) => {
    bridge.once("error", reject);
    bridge.listen(5432, "127.0.0.1", resolve);
  });
  const names = [
    "PATH",
    "HOME",
    "TMPDIR",
    "HTTP_PROXY",
    "HTTPS_PROXY",
    "NO_PROXY",
    "NODE_EXTRA_CA_CERTS",
  ];
  const neutral = Object.fromEntries(
    names
      .filter((name) => process.env[name] !== undefined)
      .map((name) => [name, process.env[name]]),
  );
  server = spawn(
    process.execPath,
    [
      "node_modules/next/dist/bin/next",
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      "4603",
    ],
    {
      env: {
        ...neutral,
        NODE_ENV: "production",
        MONETCORE_STAGING: "true",
        MONETCORE_VPS_REVIEW: "true",
        MONETCORE_VPS_PROXY_VERIFIED: "true",
        CUSTOMER_PLATFORM_ENABLED: "true",
        CUSTOMER_DATABASE_NAME: "monetcore_customer_staging",
        CUSTOMER_AUTH_DB_PASSWORD: "synthetic",
        CUSTOMER_APP_DB_PASSWORD: "synthetic",
        CUSTOMER_AUTH_SECRET: "synthetic-browser-secret-at-least-32-characters",
        CUSTOMER_AUTH_TEST_EMAILS: email,
        CUSTOMER_REGISTRATION_ENABLED: "false",
        CUSTOMER_AUTH_EMAIL_ENABLED: "false",
        STAGING_BOOKING_ENABLED: "false",
        STAGING_CONTACT_ENABLED: "false",
        AI_ASSISTANT_ENABLED: "false",
        AI_OWNER_TEST_ENABLED: "false",
        STAGING_AI_ASSISTANT_ENABLED: "false",
        AI_ASSISTANT_EMERGENCY_STOP: "true",
      },
      stdio: "ignore",
    },
  );
  for (let n = 0; n < 60; n++) {
    if (server.exitCode !== null) throw new Error("Disposable Next process exited before readiness");
    try {
      if ((await fetch("http://127.0.0.1:4603/customer/login")).ok) break;
    } catch {}
    await delay(250);
    if (n === 59) throw new Error("Local review server unavailable");
  }
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
    args: ["--no-sandbox"],
    proxy: { server: "http://127.0.0.1:9", bypass: "127.0.0.1,localhost" },
  });
  context = await browser.newContext({ reducedMotion: "reduce" });
  context.setDefaultNavigationTimeout(20000);
  context.setDefaultTimeout(20000);
  // Public-looking test origin is intercepted and fulfilled only from loopback.
  await context.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (url.origin !== "https://review.monetcore.dev") return route.abort();
    const headers = {
      ...request.headers(),
      host: "review.monetcore.dev",
      "x-forwarded-host": "review.monetcore.dev",
      "x-forwarded-proto": "https",
      "x-forwarded-for": `2001:db8:${id.replaceAll("-", "").match(/.{4}/g).slice(0,6).join(":")}`,
    };
    try {
      const response = await route.fetch({
        url: "http://127.0.0.1:4603" + url.pathname + url.search,
        headers, maxRedirects: 0, timeout: 15000,
      });
      await route.fulfill({ response });
    } catch {
      // Prefetch routes can be cancelled as the browser closes. Keep the network
      // deny rule installed until disposal; only post-test cancellation is ignored.
      if (!closing) errors.push("local_http_bridge_failed");
      try { await route.abort(); } catch { /* Request already disposed. */ }
    }
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("https://review.monetcore.dev/customer/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .first()
    .click();
  await page.waitForURL("https://review.monetcore.dev/customer");
  await page
    .getByRole("heading", { name: "Welcome, Synthetic Browser" })
    .waitFor();
  assert.equal(await page.getByText("B project", { exact: true }).count(), 0);
  for (const width of [320, 360, 375, 390, 430, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `dashboard overflow ${width}`,
    );
  }
  assert.deepEqual(
    (
      await new AxeBuilder({ page })
        .include(".customer-platform")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
    [],
  );
  await page
    .getByRole("link", { name: "New project request", exact: true })
    .last()
    .click();
  const projectTitle=`Synthetic browser project ${id.slice(0,8)}`;
  await page.getByLabel("Project title").fill(projectTitle);
  await page
    .getByLabel("Business objectives")
    .fill("A clear synthetic business objective for this test");
  await page
    .getByLabel("Requirements", { exact: true })
    .fill("A clear synthetic requirements statement for this test");
  await page.getByLabel("Additional notes").fill("Synthetic data only");
  await page.getByRole("button", { name: "Submit project request" }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Your request has been recorded" })
    .waitFor();
  assert.deepEqual(
    (
      await new AxeBuilder({ page })
        .include(".customer-platform")
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
    [],
  );
  await page.getByRole("link", { name: "View request history" }).click();
  await page.getByText(projectTitle, { exact: true }).waitFor();
  fs.mkdirSync("/workspace/artifacts/customer-foundation", { recursive: true });
  await page.screenshot({
    path: "/workspace/artifacts/customer-foundation/dashboard-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "/workspace/artifacts/customer-foundation/dashboard-mobile.png",
    fullPage: true,
  });
  await page.getByRole("link", { name: "Account settings" }).click();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL("https://review.monetcore.dev/customer/login");
  assert.deepEqual(errors, []);
  console.log(
    "PASS real PostgreSQL/Better Auth browser login, authorized dashboard, tenant-B concealment, project submission/history, account signout, eight widths and axe; SMTP/registration/inference disabled.",
  );
} finally {
  closing=true;
  await browser?.close();
  if (server) {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("exit", resolve));
  }
  await new Promise((resolve) =>
    bridge.listening ? bridge.close(resolve) : resolve(),
  );
  await admin.end();
}
