// Read-only comparison. Never read env files, database dumps or customer records.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root = process.argv[2];
if (!root || !path.isAbsolute(root)) throw new Error('Supply the absolute ORIGINAL VPS source path.');
const baseline = JSON.parse(await readFile(new URL('./uploaded-source-baseline.json',import.meta.url),'utf8'));
const mismatches=[];
for (const [name,hash] of Object.entries(baseline.files)) {
  try {
    const bytes=await readFile(path.join(root,name));
    if (createHash('sha256').update(bytes).digest('hex')!==hash) mismatches.push(name);
  } catch { mismatches.push(name); }
}
if (mismatches.length) {
  console.error('STOP: VPS source differs from uploaded archive; preserve it and refresh/reconcile before release.',mismatches);
  process.exitCode=1;
} else console.log('PASS: original source files match the preserved upload. Inspect additional/untracked VPS files separately; this is not an environment/database check.');
