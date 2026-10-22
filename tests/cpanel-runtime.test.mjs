import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { ownerTestAccess, assistantRequestOrigin, isControlledTestEnabled } from '../app/lib/assistant/access.ts';
import { trustedCpanelRequest, cpanelClientAddress } from '../app/lib/cpanelRuntime.ts';
import { enforceRateLimit } from '../app/lib/submissionSafety.ts';
import { pricingPolicy, pricingApprovalId } from '../app/lib/assistant/pricing.ts';
import { POST } from '../app/api/assistant/route.ts';

const password = 'synthetic-owner-password-at-least-thirty-two-characters';
const token = 'synthetic-private-ingress-token-over-thirty-two-characters';
const env = { MONETCORE_HOSTING_TARGET: 'cpanel', MONETCORE_DEPLOYMENT_ENV: 'production',
  CPANEL_INGRESS_CONFIGURED: 'true', CPANEL_INGRESS_SECRET: token,
  AI_ASSISTANT_ENABLED: 'true', AI_OWNER_TEST_ENABLED: 'true', AI_ASSISTANT_EMERGENCY_STOP: 'false',
  AI_OWNER_PASSWORD_SHA256: createHash('sha256').update(password).digest('hex'),
  OPENAI_API_KEY: 'synthetic-only-key', OPENAI_MODEL: pricingPolicy.model, AI_PRICING_APPROVAL: pricingApprovalId };
function request(patch = {}) {
  return new Request('http://localhost:3000/api/assistant', { method: 'POST', headers: {
    host: 'monetcore.dev', 'x-monetcore-https': '1', 'x-monetcore-ingress': token,
    'x-monetcore-client-ip': '192.0.2.5', 'x-forwarded-for': '198.51.100.8',
    authorization: `Basic ${Buffer.from(`owner:${password}`).toString('base64')}`,
    origin: 'https://monetcore.dev', 'content-type': 'application/json',
    'x-monetcore-request-id': randomUUID(), 'x-monetcore-test-case': 'case-01', ...patch,
  }, body: JSON.stringify({ messages: ['Tell me about Monetcore'] }) });
}
test('cPanel uses authenticated ingress, keeps owner auth, and preserves constrained provider path', async () => {
  const saved = { ...process.env }, fetch = global.fetch, info = console.info;
  let calls = 0;
  try {
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, env);
    console.info = () => {};
    global.fetch = async (url, options) => {
      calls++; assert.equal(url, 'https://api.openai.com/v1/responses');
      const body = JSON.parse(options.body); assert.equal(body.model, pricingPolicy.model);
      assert.equal(body.max_output_tokens, 300); assert.equal(body.store, false);
      assert.doesNotMatch(options.body, /synthetic-private-ingress|synthetic-owner-password/);
      return Response.json({ status: 'completed', output: [{ type: 'message', role: 'assistant', content: [
        { type: 'output_text', text: JSON.stringify({ topics: ['company'] }) } ] }], usage: { input_tokens: 1000, output_tokens: 10 } });
    };
    assert.equal(isControlledTestEnabled(), true);
    assert.equal(trustedCpanelRequest(request()), true);
    assert.equal(assistantRequestOrigin(request()), 'https://monetcore.dev');
    assert.equal(cpanelClientAddress(request()), '192.0.2.5');
    assert.equal(ownerTestAccess(request({ authorization: '' })).status, 401);
    for (const patch of [{ host: 'evil.example' }, { 'x-monetcore-ingress': '' },
      { 'x-monetcore-ingress': 'synthetic-wrong-token-more-than-thirty-two-characters' }, { 'x-monetcore-https': '0' }]) {
      assert.equal(trustedCpanelRequest(request(patch)), false);
      assert.equal(ownerTestAccess(request(patch)).status, 403);
      assert.equal((await POST(request(patch))).status, 403);
    }
    assert.equal((await POST(request({ origin: 'https://evil.example' }))).status, 400);
    assert.equal((await enforceRateLimit(request({ 'x-monetcore-ingress': '' }), 'cpanel-test')).status, 503);
    for (const flag of ['AI_ASSISTANT_ENABLED','AI_OWNER_TEST_ENABLED','CPANEL_INGRESS_CONFIGURED']) {
      delete process.env[flag]; assert.equal((await POST(request())).status, 503); process.env[flag] = env[flag];
    }
    process.env.AI_ASSISTANT_EMERGENCY_STOP = 'true'; assert.equal((await POST(request())).status, 503);
    process.env.AI_ASSISTANT_EMERGENCY_STOP = 'false';
    delete process.env.CPANEL_INGRESS_SECRET; assert.equal((await POST(request())).status, 503);
    process.env.CPANEL_INGRESS_SECRET = token;
    assert.equal(calls, 0);
    assert.equal((await POST(request())).status, 200); assert.equal(calls, 1);
  } finally {
    global.fetch = fetch; console.info = info;
    for (const key of Object.keys(process.env)) delete process.env[key]; Object.assign(process.env, saved);
  }
});
