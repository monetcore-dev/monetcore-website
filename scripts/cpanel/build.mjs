import { spawnSync } from 'node:child_process';
if (Number(process.versions.node.split('.')[0]) < 22)
  throw new Error('Installed dependencies require Node.js 22 or newer.');
const mode = process.env.MONETCORE_DEPLOYMENT_ENV || 'review';
if (!['review', 'production'].includes(mode)) throw new Error('Invalid build mode.');
if (process.env.VERCEL || process.env.VERCEL_ENV)
  throw new Error('Run the cPanel build separately from Vercel.');
const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, MONETCORE_BUILD_TARGET: 'cpanel', MONETCORE_DEPLOYMENT_ENV: mode,
    AI_ASSISTANT_ENABLED: 'false', AI_OWNER_TEST_ENABLED: 'false', STAGING_AI_ASSISTANT_ENABLED: 'false',
    AI_ASSISTANT_EMERGENCY_STOP: 'true', STAGING_BOOKING_ENABLED: 'false', STAGING_CONTACT_ENABLED: 'false' },
});
process.exit(result.status ?? 1);
