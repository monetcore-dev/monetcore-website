// Build verification only. No restart, deploy, activation or live integration call.
import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
if ((await readdir(process.cwd())).some(name=>name.startsWith('.env')))
  throw new Error('Build/test the clean source release without env files. Configure secrets separately at runtime.');
const names=['PATH','HOME','TMPDIR','TMP','TEMP','HTTP_PROXY','HTTPS_PROXY','NO_PROXY','ALL_PROXY','http_proxy','https_proxy','no_proxy','NODE_EXTRA_CA_CERTS','SSL_CERT_FILE','SSL_CERT_DIR'];
const neutral=Object.fromEntries(names.filter(k=>process.env[k]!==undefined).map(k=>[k,process.env[k]]));
for (const task of ['typecheck','test','test:staging:local','lint','build']) {
  const env=task==='build'?{...neutral,NODE_ENV:'production',MONETCORE_STAGING:'true',MONETCORE_VPS_REVIEW:'true',
    STAGING_BOOKING_ENABLED:'false',STAGING_CONTACT_ENABLED:'false',AI_ASSISTANT_ENABLED:'false',AI_OWNER_TEST_ENABLED:'false',STAGING_AI_ASSISTANT_ENABLED:'false',AI_ASSISTANT_EMERGENCY_STOP:'true'}:neutral;
  const result=spawnSync('npm',['run',task],{env,stdio:'inherit'});
  if (result.error) throw new Error('Verification process failed');
  if (result.status!==0) process.exit(result.status??1);
}
console.log('PASS clean source checks and review build. No service/environment changes.');
