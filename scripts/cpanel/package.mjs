import { cp, mkdir, readFile, readdir, lstat, realpath, readlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('../../', import.meta.url));
const source = path.join(root, '.next/standalone');
const output = process.argv[2];
if (!output || !path.isAbsolute(output)) throw new Error('Provide an absolute NEW output directory outside the repository.');
const target = path.join(await realpath(path.dirname(output)), path.basename(output));
const relative = path.relative(await realpath(root), target);
if (!relative.startsWith(`..${path.sep}`)) throw new Error('Artifact must be outside the repository.');
// mkdir without recursive ensures existing artifacts are never overwritten.
const config = JSON.parse(await readFile(path.join(source, '.next/required-server-files.json'), 'utf8'));
if (config.config.output !== 'standalone') throw new Error('Build with MONETCORE_BUILD_TARGET=cpanel first.');
const forbidden = name => name.startsWith('.env') || ['.git', '.vercel', 'docs', 'tests', 'scripts'].includes(name) || /\.(pem|key|sql|p12|pfx)$/i.test(name);
async function inspect(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (forbidden(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if ((await lstat(full)).isSymbolicLink()) {
      if (path.isAbsolute(await readlink(full))) throw new Error('Absolute symlink is not relocatable.');
      const resolved = await realpath(full);
      if (path.relative(source, resolved).startsWith('..')) throw new Error('External symlink in traced artifact.');
    } else if (entry.isDirectory()) await inspect(full);
  }
}
await inspect(source);
await mkdir(target);
await cp(source, target, { recursive: true, verbatimSymlinks: true, filter: p => !path.relative(source, p).split(path.sep).some(forbidden) });
await cp(path.join(root, '.next/static'), path.join(target, '.next/static'), { recursive: true });
await cp(path.join(root, 'public'), path.join(target, 'public'), { recursive: true, filter: p => !path.relative(path.join(root, 'public'), p).split(path.sep).some(forbidden) });
await cp(path.join(root, 'scripts/cpanel/start.cjs'), path.join(target, 'start.cjs'));
const routes = JSON.parse(await readFile(path.join(source, '.next/routes-manifest.json'), 'utf8'));
const deploymentMode = routes.headers.some(rule => rule.headers.some(h => h.key.toLowerCase() === 'x-robots-tag' && h.value.includes('noindex'))) ? 'review' : 'production';
const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
await writeFile(path.join(target, 'release.json'), JSON.stringify({ sourceCommit: sha, note: 'Includes current working-tree build; not a clean-commit attestation.', target: 'cpanel', deploymentMode, nodeMajor: process.versions.node.split('.')[0] }, null, 2));
console.log('Standalone review artifact prepared. No env files, deployment or integrations enabled.');
