// Run after the guarded standalone build. Never reads environment/credential files.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyIsolatedArtifact } from './review-artifact.mjs';
const sha = process.argv[2];
const output = process.argv[3];
if (!/^[a-f0-9]{40}$/.test(sha || '') || !output || !path.isAbsolute(output)) throw Error('Expected exact SHA and absolute output directory');
if (execFileSync('git', ['rev-parse','HEAD'], {encoding:'utf8'}).trim() !== sha) throw Error('Checkout must match approved SHA');
if (execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim()) throw Error('Refuse a dirty source checkout');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'monetcore-review-package-'));
try {
  const app = path.join(root, 'app');
  fs.cpSync('.next/standalone', app, {recursive:true, dereference:false, verbatimSymlinks:true});
  fs.cpSync('.next/static', path.join(app,'.next/static'), {recursive:true});
  fs.cpSync('public', path.join(app,'public'), {recursive:true});
  fs.rmSync(path.join(app,'.next/cache'),{recursive:true,force:true});
  for (const name of ['server.js','.next/BUILD_ID']) if (!fs.statSync(path.join(app,name)).isFile()) throw Error('Missing standalone build');
  const header=process.report.getReport().header;
  const manifest={commit:sha,node:process.versions.node,platform:process.platform,arch:process.arch,glibc:header.glibcVersionRuntime};
  fs.writeFileSync(path.join(app,'release.json'), JSON.stringify(manifest)+'\n', {flag:'wx'});
  fs.writeFileSync(path.join(app,'public/__monetcore_review_release.json'), JSON.stringify({commit:sha,integrations:'disabled'})+'\n',{flag:'wx'});
  const off=['STAGING_BOOKING_ENABLED','STAGING_CONTACT_ENABLED','AI_ASSISTANT_ENABLED','AI_OWNER_TEST_ENABLED','STAGING_AI_ASSISTANT_ENABLED','CUSTOMER_PLATFORM_ENABLED','CUSTOMER_REGISTRATION_ENABLED','CUSTOMER_AUTH_EMAIL_ENABLED'];
  fs.writeFileSync(path.join(app,'review-start.cjs'), `// Generated review-only launcher; no inherited integration environment.\nconst port=process.env.PORT;\nif(!/^43(?:0[0-9]|10)$/.test(port||''))throw Error('Invalid review port');\nfor(const key of Object.keys(process.env))delete process.env[key];\nObject.assign(process.env,${JSON.stringify({NODE_ENV:'production',MONETCORE_STAGING:'true',MONETCORE_VPS_REVIEW:'true',AI_ASSISTANT_EMERGENCY_STOP:'true',HOSTNAME:'127.0.0.1',...Object.fromEntries(off.map(k=>[k,'false']))})},{PORT:port,PATH:'/usr/local/bin:/usr/bin:/bin'});\nrequire('./server.js');\n`,{flag:'wx'});
  function inspect(dir) {
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      if(entry.name.startsWith('.env') || /\.(pem|key|dump)$/.test(entry.name) || ['.git','.ssh','.aws','.vercel'].includes(entry.name)) throw Error('Forbidden artifact entry');
      if(entry.isSymbolicLink() || !(entry.isDirectory()||entry.isFile())) throw Error('Only regular artifact files supported');
      if(entry.isDirectory())inspect(path.join(dir,entry.name));
    }
  }
  const normalized=path.join(root,'normalized');
  copyIsolatedArtifact(app,normalized);
  inspect(normalized);
  fs.mkdirSync(output,{recursive:true,mode:0o700});
  const target=path.join(output,'review.tar.gz');
  if(fs.existsSync(target))throw Error('Never overwrite a prepared archive');
  execFileSync('tar',['--format=ustar','-czf',target,'-C',normalized,'.']);
  fs.writeFileSync(path.join(output,'review.sha256'), createHash('sha256').update(fs.readFileSync(target)).digest('hex')+'\n');
  console.log('PASS review standalone artifact prepared for '+sha);
} finally { fs.rmSync(root,{recursive:true,force:true}); }
