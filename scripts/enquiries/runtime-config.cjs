/* eslint-disable @typescript-eslint/no-require-imports -- server-only generated launcher */
const fs = require('node:fs');
module.exports = function configure(role) {
  if (!['web','worker'].includes(role)) throw Error('Invalid enquiry role');
  const port = process.env.PORT;
  if (role === 'web' && !/^430[78]$/.test(port || '')) throw Error('Invalid production port');
  const enabled = process.env.MONETCORE_CONTACT_ENABLED === 'true';
  const proxy = process.env.MONETCORE_CONTACT_PROXY_VERIFIED === 'true';
  const directory = process.env.CREDENTIALS_DIRECTORY;
  const values = {};
  if (enabled) {
    if (!proxy) throw Error('Enquiry commissioning incomplete: trusted proxy verification required');
    const allowed = role === 'web' ? ['monetcore-production.service','monetcore-enquiries-candidate.service'] : ['monetcore-enquiry-worker.service'];
    if (!directory || !allowed.some(unit => directory === '/run/credentials/'+unit)) throw Error('Enquiry commissioning incomplete: role-specific systemd credentials required');
    const read = name => fs.readFileSync(directory+'/'+name,'utf8').replace(/\r?\n$/, '');
    values.MONETCORE_ENQUIRY_DB_PASSWORD = read('enquiry-db-password');
    if (!values.MONETCORE_ENQUIRY_DB_PASSWORD) throw Error('Missing enquiry database credential');
    if (role === 'web') {
      values.MONETCORE_ENQUIRY_RATE_SECRET = read('enquiry-rate-secret');
      if (values.MONETCORE_ENQUIRY_RATE_SECRET.length < 32) throw Error('Invalid enquiry rate secret');
    } else {
      const after = process.env.MONETCORE_ENQUIRY_NOTIFY_AFTER;
      if (!after || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(after) || !Number.isFinite(Date.parse(after))) throw Error('Enquiry notification activation time required');
      values.MONETCORE_ENQUIRY_NOTIFY_AFTER = after;
      values.MONETCORE_EMAIL = 'hello@monetcore.dev';
      values.MONETCORE_EMAIL_PASSWORD = read('enquiry-smtp-password');
      if (!values.MONETCORE_EMAIL_PASSWORD) throw Error('Missing enquiry SMTP credential');
    }
  } else if (role === 'worker') throw Error('Enquiry worker is disabled');
  for (const key of Object.keys(process.env)) delete process.env[key];
  Object.assign(process.env,{NODE_ENV:'production',MONETCORE_PUBLIC_LAUNCH:'true',HOSTNAME:'127.0.0.1',PORT:port || '4308',PATH:'/usr/local/bin:/usr/bin:/bin',MONETCORE_CONTACT_ENABLED:String(enabled),MONETCORE_CONTACT_PROXY_VERIFIED:String(proxy),AI_ASSISTANT_EMERGENCY_STOP:'true',AI_ASSISTANT_ENABLED:'false',AI_OWNER_TEST_ENABLED:'false',STAGING_AI_ASSISTANT_ENABLED:'false',STAGING_BOOKING_ENABLED:'false',STAGING_CONTACT_ENABLED:'false',CUSTOMER_PLATFORM_ENABLED:'false',CUSTOMER_REGISTRATION_ENABLED:'false',CUSTOMER_AUTH_EMAIL_ENABLED:'false',...values});
};
