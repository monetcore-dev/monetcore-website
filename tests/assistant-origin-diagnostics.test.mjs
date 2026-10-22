import test from "node:test";
import assert from "node:assert/strict";
import { assistantRequestOrigin } from "../app/lib/assistant/access.ts";

test("temporary origin telemetry identifies each rejection without exposing raw values", () => {
  const saved = { ...process.env }, warn = console.warn;
  const entries = [];
  console.warn = (...args) => entries.push(args);
  Object.assign(process.env, { VERCEL: "1", VERCEL_ENV: "production", VERCEL_GIT_COMMIT_REF: "main",
    VERCEL_GIT_COMMIT_SHA: "77e67c8512a019a9dbb7dd30f097b9f07efc09a0" });
  const cases = [
    [{ host: "sensitive.invalid" }, "host_mismatch"],
    [{ host: "monetcore.dev", "x-forwarded-host": "sensitive.invalid" }, "forwarded_host_mismatch"],
    [{ host: "monetcore.dev", "x-forwarded-proto": "https,http" }, "forwarded_protocol_mismatch"],
    [{}, "fallback_host_missing"],
    [{ host: "monetcore.dev" }, "fallback_protocol_missing"],
  ];
  try {
    for (const [headers, reason] of cases) {
      const before = entries.length;
      assert.equal(assistantRequestOrigin(new Request("http://localhost:3000/assistant?private=synthetic-url-secret", {
        headers: { ...headers, authorization: "Basic synthetic-auth-secret", cookie: "synthetic-cookie-secret" },
      })), null);
      assert.equal(entries.length, before + 1);
      const [marker, event] = entries.at(-1);
      assert.equal(marker, "Monetcore assistant origin diagnostic v1");
      assert.equal(event.reason, reason);
      assert.equal(event.url_protocol, "http"); assert.equal(event.url_hostname, "loopback");
      assert.equal(event.deployment_environment, "production");
      assert.equal(event.deployment_revision, "pr4_merge");
      assert.deepEqual(Object.keys(event).sort(), ["reason", "url_protocol", "url_hostname", "url_port", "host",
        "forwarded_protocol", "forwarded_host", "vercel_runtime", "deployment_environment",
        "deployment_branch", "deployment_revision"].sort());
    }
    delete process.env.VERCEL;
    assert.equal(assistantRequestOrigin(new Request("http://localhost/assistant", {
      headers: { host: "monetcore.dev", "x-forwarded-proto": "https" },
    })), null);
    assert.equal(entries.at(-1)[1].reason, "fallback_not_vercel");
    process.env.VERCEL_ENV = "synthetic-env-secret";
    process.env.VERCEL_GIT_COMMIT_REF = "synthetic-branch-secret";
    process.env.VERCEL_GIT_COMMIT_SHA = "synthetic-revision-secret";
    assert.equal(assistantRequestOrigin(new Request("http://sensitive.invalid/assistant")), null);
    assert.equal(entries.at(-1)[1].reason, "nonproduction_non_https");
    assert.equal(entries.at(-1)[1].deployment_environment, "other");
    assert.equal(entries.at(-1)[1].deployment_branch, "other");
    assert.equal(entries.at(-1)[1].deployment_revision, "other");
    assert.doesNotMatch(JSON.stringify(entries), /sensitive\.invalid|synthetic-|authorization|cookie|private=/i);
    process.env.VERCEL = "1"; process.env.VERCEL_ENV = "production";
    const before = entries.length;
    assert.equal(assistantRequestOrigin(new Request("https://monetcore.dev/assistant")), "https://monetcore.dev");
    assert.equal(assistantRequestOrigin(new Request("http://localhost/assistant", {
      headers: { host: "monetcore.dev", "x-forwarded-proto": "https" },
    })), "https://monetcore.dev");
    assert.equal(entries.length, before, "No success telemetry");
    console.warn = () => { throw new Error("synthetic logger failure"); };
    assert.equal(assistantRequestOrigin(new Request("http://localhost/assistant")), null);
  } finally {
    console.warn = warn;
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, saved);
  }
});
