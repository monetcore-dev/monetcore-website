/* eslint-disable @typescript-eslint/no-require-imports -- Passenger startup uses CommonJS. */
/* cPanel Passenger startup adapter; copied beside generated standalone server.js. */
const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');

function validate(env) {
  if (env.VERCEL || env.VERCEL_ENV || env.VERCEL_GIT_COMMIT_REF)
    throw new Error('Do not impersonate a Vercel deployment on cPanel.');
  if (env.MONETCORE_DEPLOYMENT_ENV && !['review', 'production'].includes(env.MONETCORE_DEPLOYMENT_ENV))
    throw new Error('Invalid deployment mode.');
  if (['STAGING_AI_ASSISTANT_ENABLED', 'STAGING_CONTACT_ENABLED', 'STAGING_BOOKING_ENABLED'].some(key => env[key] === 'true'))
    throw new Error('Vercel staging activation is not supported on cPanel.');
  if ((env.MONETCORE_DEPLOYMENT_ENV === 'production' || env.AI_ASSISTANT_ENABLED === 'true' || env.AI_OWNER_TEST_ENABLED === 'true') &&
      (env.MONETCORE_DEPLOYMENT_ENV !== 'production' || env.CPANEL_INGRESS_CONFIGURED !== 'true' || (env.CPANEL_INGRESS_SECRET?.length ?? 0) < 32))
    throw new Error('Production requires verified authenticated Apache ingress.');
  if (env.PORT && (!/^\d+$/.test(env.PORT) || Number(env.PORT) < 1 || Number(env.PORT) > 65535))
    throw new Error('Invalid application port.');
}
function start() {
  validate(process.env);
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major !== 24 || minor < 13) throw new Error("This target requires Node.js 24.13 or newer in the 24.x line.");
  process.env.NODE_ENV = 'production';
  // No Vercel variables are fabricated. Review is the safe default on a new host.
  process.env.MONETCORE_DEPLOYMENT_ENV ||= 'review';
  const manifest = JSON.parse(readFileSync(path.join(__dirname, 'release.json'), 'utf8'));
  if (manifest.deploymentMode !== process.env.MONETCORE_DEPLOYMENT_ENV ||
      manifest.nodeMajor !== process.versions.node.split('.')[0])
    throw new Error('Artifact build mode/Node major differs from runtime; rebuild instead of promoting.');
  process.env.MONETCORE_HOSTING_TARGET = 'cpanel';
  if (process.env.MONETCORE_DEPLOYMENT_ENV !== 'production') process.env.AI_ASSISTANT_EMERGENCY_STOP = 'true';
  process.env.HOSTNAME = '127.0.0.1';
  const server = path.join(__dirname, 'server.js');
  if (!existsSync(server)) throw new Error('Missing standalone server.js; use the packaged artifact.');
  require(server);
}
module.exports = { validate };
if (require.main === module) start();
