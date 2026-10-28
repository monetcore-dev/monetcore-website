// Local/CI artifact check only. Never uses SSH, PM2, Nginx or real credentials.
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
const archive = path.resolve(process.argv[2] || '');
const sha = process.argv[3];
assert.match(sha || '', /^[a-f0-9]{40}$/);
assert.ok(fs.statSync(archive).isFile());
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'monetcore-review-smoke-'));
const app = path.join(temp, 'app');
const controller = fileURLToPath(new URL('./review-deploy.py', import.meta.url));
let child;
try {
  execFileSync('python3', ['-B','-I','-c', `
import gzip,importlib.util,pathlib,shutil,sys,tarfile
spec=importlib.util.spec_from_file_location('review_controller',sys.argv[1])
m=importlib.util.module_from_spec(spec);sys.modules[spec.name]=m;spec.loader.exec_module(m)
archive=pathlib.Path(sys.argv[2]);dest=pathlib.Path(sys.argv[3]);raw=dest.parent/'artifact.tar'
assert archive.stat().st_size<=m.MAX_UPLOAD
size=0
with gzip.open(archive,'rb') as src,raw.open('xb') as out:
 while chunk:=src.read(1024*1024):
  size+=len(chunk);assert size<=m.MAX_EXPANDED+32*1024*1024;out.write(chunk)
m.validate_tar_headers(raw)
dest.mkdir(mode=0o700)
with tarfile.open(raw,'r:') as t:
 for member,name in m.archive_members(t):
  target=dest/name
  if member.isdir():target.mkdir(parents=True,exist_ok=True)
  else:
   target.parent.mkdir(parents=True,exist_ok=True)
   with t.extractfile(member) as src,target.open('xb') as out:shutil.copyfileobj(src,out)
raw.unlink()
`, controller, archive, app], {stdio:'pipe'});
  assert.equal(JSON.parse(fs.readFileSync(path.join(app,'release.json'),'utf8')).commit,sha);
  let port;
  for(let p=4300;p<=4310;p++) {
    const probe=net.createServer();
    try { await new Promise((resolve,reject)=>probe.once('error',reject).listen(p,'127.0.0.1',resolve)); await new Promise(resolve=>probe.close(resolve));port=p;break; }
    catch { probe.close(); }
  }
  assert.ok(port,'No disposable review smoke port available');
  const guard=path.join(temp,'deny-external.cjs');
  fs.writeFileSync(guard, `const net=require('node:net');let denied=0;
const allowed=h=>['127.0.0.1','localhost','::1'].includes(h);
const original=net.Socket.prototype.connect;
net.Socket.prototype.connect=function(...args){let a=args[0];if(Array.isArray(a))a=a[0];let h;
if(typeof a==='object'){if(a.path){denied++;throw Error('Smoke denies socket paths');}h=a.host||'localhost';}
else if(typeof a==='string'&&!/^\\d+$/.test(a)){denied++;throw Error('Smoke denies socket paths');}
else h=typeof args[1]==='string'?args[1]:'localhost';
if(!allowed(h)){denied++;throw Error('Smoke denies external network');}return original.apply(this,args);};
const originalFetch=globalThis.fetch;globalThis.fetch=(input,options)=>{const u=new URL(typeof input==='string'||input instanceof URL?input:input.url);if(!allowed(u.hostname)){denied++;throw Error('Smoke denies external fetch');}return originalFetch(input,options);};
module.exports=()=>denied;`);
  const forbidden=['OPENAI_API_KEY','MONETCORE_DB_PASSWORD','MONETCORE_EMAIL_PASSWORD','GOOGLE_PRIVATE_KEY','UPSTASH_REDIS_REST_TOKEN','NODE_OPTIONS','MONETCORE_VPS_PROXY_VERIFIED'];
  const off=['STAGING_BOOKING_ENABLED','STAGING_CONTACT_ENABLED','AI_ASSISTANT_ENABLED','AI_OWNER_TEST_ENABLED','STAGING_AI_ASSISTANT_ENABLED','CUSTOMER_PLATFORM_ENABLED','CUSTOMER_REGISTRATION_ENABLED','CUSTOMER_AUTH_EMAIL_ENABLED'];
  const wrapper=path.join(temp,'launch.cjs');
  fs.writeFileSync(wrapper, `require(process.argv[2]);process.on('message',()=>process.send({kind:'guard',clean:${JSON.stringify(forbidden)}.every(k=>process.env[k]===undefined),denied:require(${JSON.stringify(guard)})(),guarded:${JSON.stringify(off)}.every(k=>process.env[k]==='false')&&process.env.AI_ASSISTANT_EMERGENCY_STOP==='true'&&process.env.MONETCORE_STAGING==='true'&&process.env.MONETCORE_VPS_REVIEW==='true'}));`);
  // Sentinels prove the launcher strips dangerous/integration variables; none are real secrets.
  const sentinels=Object.fromEntries(forbidden.filter(k=>k!=='NODE_OPTIONS').map(k=>[k,'synthetic-not-a-credential']));
  child=spawn(process.execPath,['--require',guard,wrapper,path.join(app,'review-start.cjs')],{
    env:{PATH:process.env.PATH,PORT:String(port),...sentinels,NODE_OPTIONS:'--no-deprecation',...Object.fromEntries(off.map(k=>[k,'true']))},stdio:['ignore','pipe','pipe','ipc'],
  });
  let output='';child.stdout.on('data',b=>{output=(output+b).slice(-4096);});child.stderr.on('data',b=>{output=(output+b).slice(-4096);});
  const base=`http://127.0.0.1:${port}`;
  let ready=false;
  for(let i=0;i<60;i++) {
    if(child.exitCode!==null)throw Error('Artifact process exited before readiness');
    try {const r=await fetch(base+'/__monetcore_review_release.json',{signal:AbortSignal.timeout(1000)});if(r.status===200){assert.deepEqual(await r.json(),{commit:sha,integrations:'disabled'});ready=true;break;}}
    catch { /* bounded readiness polling only */ }
    await new Promise(r=>setTimeout(r,200));
  }
  assert.ok(ready,'Artifact readiness failed');
  let count=1;
  let html;
  for(const route of ['/','/services','/products','/contact','/book','/privacy','/website-packages']) {
    const r=await fetch(base+route,{signal:AbortSignal.timeout(5000)});assert.equal(r.status,200,route);
    if(route==='/')html=await r.text();else await r.arrayBuffer();count++;
  }
  const assets=[...new Set(html.match(/\/_next\/static\/[^"\s<>]+\.(?:js|css)/g))];
  assert.ok(assets.length>0,'No compiled assets in rendered page');
  for(const asset of assets.slice(0,3)) {assert.equal((await fetch(base+asset,{signal:AbortSignal.timeout(5000)})).status,200,asset);count++;}
  for(const route of ['/api/contact','/api/book','/api/assistant']) {
    const r=await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000)});
    assert.equal(r.status,route==='/api/assistant'?503:403,route);count++;
  }
  assert.equal((await fetch(base+'/api/book/availability?date=2030-01-07')).status,403);count++;
  const report=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('No sandbox report')),3000);child.on('message',msg=>{if(msg.kind==='guard'){clearTimeout(timeout);resolve(msg);}});child.send('check');});
  assert.equal(report.clean,true,'Integration variables were not stripped');
  assert.equal(report.guarded,true,'Activation flags were not forced off');
  assert.equal(report.denied,0,'An unexpected outbound request was attempted');count++;
  console.log(`PASS ${count} standalone smoke checks: pages/assets, exact SHA, stripped synthetic credentials, disabled APIs, no external network attempts.`);
} finally {
  if(child && child.exitCode===null) {
    const exited=once(child,'exit');child.kill('SIGTERM');
    await Promise.race([exited,new Promise(resolve=>setTimeout(resolve,3000))]);
    if(child.exitCode===null){child.kill('SIGKILL');await exited;}
  }
  fs.rmSync(temp,{recursive:true,force:true});
}
