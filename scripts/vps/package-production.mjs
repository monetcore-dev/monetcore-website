// Production public-launch artifact. Not the review launcher. No integration credentials.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';
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
  fs.writeFileSync(path.join(app,'public/__monetcore_production_release.json'), JSON.stringify({commit:sha,mode:'production-contact-candidate',contact:'explicit-opt-in',booking:'disabled',ai:'disabled'})+'\n',{flag:'wx'});
  fs.copyFileSync('scripts/enquiries/runtime-config.cjs',path.join(app,'enquiry-config.cjs'));
  fs.writeFileSync(path.join(app,'production-start.cjs'), "require('./enquiry-config.cjs')('web');require('./server.js');\n",{flag:'wx'});
  // The worker is outside Next's import trace; include its locked SMTP package explicitly.
  fs.cpSync('node_modules/nodemailer',path.join(app,'node_modules/nodemailer'),{recursive:true});
  const worker=path.join(app,'enquiry-worker');fs.mkdirSync(path.join(worker,'runtime'),{recursive:true});
  fs.writeFileSync(path.join(worker,'runtime/package.json'),JSON.stringify({type:'commonjs'}));
  for (const name of ['access','database','repository','notifications']) {
    const source=fs.readFileSync('app/lib/enquiries/'+name+'.ts','utf8').replace(/^import "server-only";\r?\n/gm,'');
    const result=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}});
    fs.writeFileSync(path.join(worker,'runtime',name+'.js'),result.outputText);
  }
  fs.copyFileSync('scripts/enquiries/worker.mjs',path.join(worker,'worker.mjs'));
  fs.writeFileSync(path.join(app,'enquiry-worker-start.cjs'),"require('./enquiry-config.cjs')('worker');import('./enquiry-worker/worker.mjs');\n",{flag:'wx'});
  const operations=path.join(app,'enquiry-operations');fs.mkdirSync(operations);
  fs.copyFileSync('scripts/migrations/004_create_enquiries.sql',path.join(operations,'004_create_enquiries.sql'));
  fs.copyFileSync('scripts/enquiries/inspect.sql',path.join(operations,'inspect.sql'));
  for (const name of ['monetcore-enquiries-candidate.service','monetcore-enquiry-worker.service','monetcore-enquiry-worker.timer'])
    fs.copyFileSync('scripts/enquiries/'+name,path.join(operations,name));
  fs.copyFileSync('docs/contact-quotation-activation.md',path.join(operations,'INSTALL.md'));
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
  const target=path.join(output,'production.tar.gz');
  if(fs.existsSync(target))throw Error('Never overwrite a prepared archive');
  execFileSync('tar',['--format=ustar','-czf',target,'-C',normalized,'.']);
  fs.writeFileSync(path.join(output,'production.sha256'), createHash('sha256').update(fs.readFileSync(target)).digest('hex')+'\n');
  console.log('PASS production standalone artifact prepared for '+sha);
} finally { fs.rmSync(root,{recursive:true,force:true}); }
