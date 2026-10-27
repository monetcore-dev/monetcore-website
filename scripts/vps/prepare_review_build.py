#!/usr/bin/env python3
"""Verify staged source against reviewed Git objects and copy to a NEW build directory.

Never executes source, installs packages, contacts services, or starts a process.
Use a trusted reference checkout; its Git commit is independent of upload metadata.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess

PROTECTED = tuple(map(Path, (
    '/home/monetcore/monetcore-website', '/home/monetcore/monetcore-vps-release',
    '/home/monetcore/monetcore-releases', '/srv/monetcore-review/incoming',
    '/etc', '/var', '/root',
)))


def require(condition, reason):
    if not condition:
        raise ValueError(reason)


def real_directory(path):
    path = Path(os.path.abspath(path))
    for item in (path, *path.parents):
        require(stat.S_ISDIR(item.lstat().st_mode), 'Directory path contains a link or non-directory')
    return path


def git_files(repo, commit):
    require(re.fullmatch('[a-f0-9]{40}', commit), 'Use a complete reviewed commit SHA')
    resolved = subprocess.check_output(['git', '-C', str(repo), 'rev-parse', '--verify', commit + '^{commit}'], text=True).strip()
    require(resolved == commit, 'Commit mismatch')
    rows = subprocess.check_output(['git', '-C', str(repo), 'ls-tree', '-rz', commit])
    files = {}
    for row in rows.split(b'\0'):
        if not row:
            continue
        metadata, raw_name = row.split(b'\t', 1)
        mode, kind, oid = metadata.decode().split()
        name = raw_name.decode()
        parts = name.split('/')
        require(name != '.review-source.json', 'Build receipt path is reserved')
        require(mode in ('100644', '100755') and kind == 'blob', 'Links/submodules are not build source')
        require(all(part not in ('', '.', '..', '.git', 'node_modules', '.next') and
                    not part.startswith('.env') and not part.endswith(('.pem', '.key', '.dump'))
                    for part in parts), 'Forbidden build source path')
        files[name] = (mode, oid)
    require('package-lock.json' in files and 'scripts/vps/check-release.mjs' in files,
            'Missing locked VPS release prerequisites')
    return files


def read_file(root, name):
    # Open each directory component without following symlinks, not just the leaf.
    descriptor = os.open(root, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    try:
        for part in name.split('/')[:-1]:
            next_descriptor = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=descriptor)
            os.close(descriptor)
            descriptor = next_descriptor
        fd = os.open(name.split('/')[-1], os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=descriptor)
        with os.fdopen(fd, 'rb') as source:
            require(stat.S_ISREG(os.fstat(source.fileno()).st_mode), 'Source must be a regular file')
            data = source.read(256 * 1024 * 1024 + 1)
            require(len(data) <= 256 * 1024 * 1024, 'Source file too large')
            return data
    finally:
        os.close(descriptor)


def prepare(repo, staged, commit, build_root):
    repo, staged, build_root = map(real_directory, (repo, staged, build_root))
    require(os.geteuid() != 0, 'Never prepare source as root')
    require(build_root.stat().st_uid == os.geteuid() and stat.S_IMODE(build_root.stat().st_mode) == 0o700,
            'Build root must be owned by this user with mode 0700')
    for parent in build_root.parents:
        permissions = parent.stat().st_mode
        require(not permissions & 0o022 or (parent == Path('/tmp') and permissions & stat.S_ISVTX),
                'Build root has an untrusted writable ancestor')
    for protected in (*PROTECTED, repo, staged):
        require(not (build_root == protected or build_root.is_relative_to(protected) or protected.is_relative_to(build_root)),
                'Build root overlaps protected or source directories')
    manifest = git_files(repo, commit)
    observed = set()
    def unreadable(error):
        raise error
    for directory, directories, filenames in os.walk(staged, followlinks=False, onerror=unreadable):
        for name in directories + filenames:
            path = Path(directory) / name
            info = path.lstat()
            require(stat.S_ISDIR(info.st_mode) or stat.S_ISREG(info.st_mode), 'Links/special source entries rejected')
        observed.update((Path(directory) / name).relative_to(staged).as_posix() for name in filenames)
    require(observed == set(manifest), 'Staged source differs from reviewed file inventory')
    output = build_root / commit
    output.mkdir(mode=0o700)  # Atomic no-overwrite; never remove a pre-existing release.
    try:
        for name, (mode, oid) in manifest.items():
            data = read_file(staged, name)
            actual = hashlib.sha1(b'blob ' + str(len(data)).encode() + b'\0' + data).hexdigest()
            require(actual == oid, 'Staged file content differs from reviewed Git blob: ' + name)
            destination = output / name
            destination.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
            destination.write_bytes(data)
            destination.chmod(0o700 if mode == '100755' else 0o600)
        (output / '.review-source.json').write_text(json.dumps({
            'commit': commit, 'files_verified': len(manifest), 'built': False,
            'activated': False,
        }, indent=2) + '\n')
        return output
    except BaseException:
        shutil.rmtree(output)
        raise


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reference-repo', type=Path, required=True)
    parser.add_argument('--staged-source', type=Path, required=True)
    parser.add_argument('--commit', required=True)
    parser.add_argument('--build-root', type=Path, required=True)
    args = parser.parse_args()
    try:
        result = prepare(args.reference_repo, args.staged_source, args.commit, args.build_root)
        print(json.dumps({'prepared': str(result), 'built': False, 'activated': False}))
    except (ValueError, OSError, subprocess.CalledProcessError):
        parser.exit(1, 'STOP: source or destination could not be verified; no build/service executed\n')
