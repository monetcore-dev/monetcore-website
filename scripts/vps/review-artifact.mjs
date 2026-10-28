// Materialize Next's internal tracing aliases without admitting external links.
import fs from 'node:fs';
import path from 'node:path';
export function copyIsolatedArtifact(source, destination, limits = {}) {
  const root = fs.realpathSync(source);
  const target = path.resolve(destination);
  if (target === root || target.startsWith(root + path.sep) || fs.existsSync(target)) throw Error('Artifact destination must be new and outside source');
  const maxFiles = limits.maxFiles ?? 30000;
  const maxBytes = limits.maxBytes ?? 768 * 1024 * 1024;
  const maxFileBytes = limits.maxFileBytes ?? 128 * 1024 * 1024;
  let files = 0, bytes = 0;
  function copy(from, to, active) {
    const real = fs.realpathSync(from);
    if (real !== root && !real.startsWith(root + path.sep)) throw Error('Artifact link escapes source');
    const info = fs.statSync(real);
    if (++files > maxFiles) throw Error('Too many artifact entries');
    if (info.isDirectory()) {
      if (active.has(real)) throw Error('Artifact directory cycle');
      const next = new Set([...active, real]);
      fs.mkdirSync(to, {mode:0o700});
      for (const name of fs.readdirSync(real)) {
        if (name.startsWith('.env') || ['.git','.ssh','.aws','.vercel'].includes(name) || /\.(pem|key|dump)$/i.test(name)) throw Error('Forbidden artifact entry');
        copy(path.join(real,name),path.join(to,name),next);
      }
    } else if (info.isFile()) {
      bytes += info.size;
      if (info.size > maxFileBytes || bytes > maxBytes) throw Error('Artifact size limit');
      fs.copyFileSync(real,to,fs.constants.COPYFILE_EXCL);
      fs.chmodSync(to,info.mode & 0o111 ? 0o755 : 0o644);
    } else throw Error('Special artifact file forbidden');
  }
  copy(root,target,new Set());
  return {files,bytes};
}
