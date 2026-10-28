import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { copyIsolatedArtifact } from '../scripts/vps/review-artifact.mjs';
function fixture(run) {
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'monetcore-artifact-test-'));
  const source=path.join(temp,'source'),dest=path.join(temp,'output');fs.mkdirSync(source);
  try {run({temp,source,dest});} finally {fs.rmSync(temp,{recursive:true,force:true});}
}
test('materializes internal file and directory aliases as regular files',()=>fixture(({source,dest})=>{
  fs.mkdirSync(path.join(source,'pg'));fs.writeFileSync(path.join(source,'pg/index.js'),'approved');
  fs.symlinkSync('pg',path.join(source,'alias'));fs.symlinkSync('pg/index.js',path.join(source,'file.js'));
  copyIsolatedArtifact(source,dest);
  assert.equal(fs.readFileSync(path.join(dest,'alias/index.js'),'utf8'),'approved');
  assert.equal(fs.lstatSync(path.join(dest,'alias')).isSymbolicLink(),false);
  assert.equal(fs.lstatSync(path.join(dest,'file.js')).isFile(),true);
}));
test('nested link resolution stays relative to original target',()=>fixture(({source,dest})=>{
  fs.mkdirSync(path.join(source,'pg'));fs.mkdirSync(path.join(source,'traced'));
  fs.writeFileSync(path.join(source,'dependency.js'),'correct');
  fs.symlinkSync('../dependency.js',path.join(source,'pg/dependency.js'));
  fs.symlinkSync('../pg',path.join(source,'traced/alias'));
  copyIsolatedArtifact(source,dest);
  assert.equal(fs.readFileSync(path.join(dest,'traced/alias/dependency.js'),'utf8'),'correct');
}));
test('external aliases fail closed',()=>fixture(({temp,source,dest})=>{
  fs.writeFileSync(path.join(temp,'outside'),'do-not-copy');fs.symlinkSync('../outside',path.join(source,'escape'));
  assert.throws(()=>copyIsolatedArtifact(source,dest),/escapes/);
}));
test('ancestor directory cycles fail closed',()=>fixture(({source,dest})=>{
  fs.mkdirSync(path.join(source,'inner'));fs.symlinkSync('..',path.join(source,'inner/loop'));
  assert.throws(()=>copyIsolatedArtifact(source,dest),/cycle/);
}));
test('credential and Git metadata filenames are rejected',()=>{
  for(const name of ['.env.production','secret.key','.git'])fixture(({source,dest})=>{
    fs.writeFileSync(path.join(source,name),'synthetic');assert.throws(()=>copyIsolatedArtifact(source,dest),/Forbidden/);
  });
});
test('individual, total and entry budgets are bounded',()=>{
  for(const limits of [{maxFileBytes:1},{maxBytes:1},{maxFiles:1}])fixture(({source,dest})=>{
    fs.writeFileSync(path.join(source,'data'),'synthetic');assert.throws(()=>copyIsolatedArtifact(source,dest,limits),/limit|entries/);
  });
});
test('never overwrites a destination or copies into its own source',()=>fixture(({source,dest})=>{
  fs.mkdirSync(dest);assert.throws(()=>copyIsolatedArtifact(source,dest),/destination/);
  assert.throws(()=>copyIsolatedArtifact(source,path.join(source,'nested')),/destination/);
}));

test('staging copy preserves relative tracing aliases before materialization',()=>fixture(({temp,source,dest})=>{
  fs.mkdirSync(path.join(source,'pg'));fs.writeFileSync(path.join(source,'pg/index.js'),'relocatable');
  fs.symlinkSync('pg',path.join(source,'alias'));
  const staged=path.join(temp,'staged');
  fs.cpSync(source,staged,{recursive:true,dereference:false,verbatimSymlinks:true});
  copyIsolatedArtifact(staged,dest);
  assert.equal(fs.readFileSync(path.join(dest,'alias/index.js'),'utf8'),'relocatable');
}));
