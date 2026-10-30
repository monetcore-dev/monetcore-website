// Pure configuration check: no connections, secrets printed or files changed.
import { pathToFileURL } from 'node:url';
export function validateRuntime(e) {
  const fail = (category) => { throw new Error(category); };
  if (e.NODE_ENV !== 'production' || e.MONETCORE_VPS_PRODUCTION !== 'true' || e.MONETCORE_VPS_PROXY_VERIFIED !== 'true') fail('vps_attestation_missing');
  for (const key of ['VERCEL','VERCEL_ENV','VERCEL_GIT_COMMIT_REF','MONETCORE_STAGING','MONETCORE_VPS_REVIEW','BOOKING_DATABASE_URL']) if (e[key] !== undefined) fail('foreign_deployment_configuration');
  for (const key of ['AI_ASSISTANT_ENABLED','AI_OWNER_TEST_ENABLED','STAGING_AI_ASSISTANT_ENABLED','STAGING_BOOKING_ENABLED','STAGING_CONTACT_ENABLED']) if (e[key] && e[key] !== 'false') fail('activation_not_approved');
  if (e.AI_ASSISTANT_EMERGENCY_STOP !== 'true') fail('ai_stop_required');
  for (const key of ['MONETCORE_DB_PASSWORD','MONETCORE_EMAIL_PASSWORD','GOOGLE_CALENDAR_ID','GOOGLE_SERVICE_ACCOUNT_EMAIL','GOOGLE_PRIVATE_KEY','UPSTASH_REDIS_REST_URL','UPSTASH_REDIS_REST_TOKEN']) if (!e[key]) fail('required_configuration_missing');
  if (e.MONETCORE_EMAIL !== 'hello@monetcore.dev' || e.RATE_LIMIT_REQUIRED !== 'true' || (e.RATE_LIMIT_KEY_SECRET?.length ?? 0) < 32) fail('communications_or_limiter_invalid');
  if (!/^https:\/\/[^/?#]+$/.test(e.UPSTASH_REDIS_REST_URL)) fail('limiter_endpoint_invalid');
  return true;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { validateRuntime(process.env); console.log('PASS runtime configuration shape; connectivity and provider permissions NOT tested'); }
  catch (error) { console.error('Runtime preflight:', error.message); process.exitCode = 1; }
}
