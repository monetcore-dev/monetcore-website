#!/usr/bin/env python3
"""Forced SSH command: bounded source staging only. Never build or activate code."""
from __future__ import annotations

import fcntl
import gzip
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import signal
import stat
import sys
import tarfile
import tempfile

ROOT = Path('/srv/monetcore-review/incoming')
MAX_UPLOAD = 64 * 1024 * 1024
MAX_EXPANDED = 256 * 1024 * 1024
MAX_FILES = 10000
FORBIDDEN = {'.git', 'node_modules', '.next', '.ssh', '.aws', '.vercel'}


class Rejected(Exception):
    pass


def require(condition, message):
    if not condition:
        raise Rejected(message)


def parse_command(command):
    match = re.fullmatch(r'review-stage ([a-f0-9]{40}) ([a-f0-9]{64})', command)
    require(match is not None, 'Only the review-stage protocol is accepted')
    return match.groups()


def validate_members(archive):
    seen = set()
    members = []
    total = 0
    for member in archive:
        require(len(members) < MAX_FILES, 'Too many archive entries')
        name = member.name.rstrip('/')
        path = PurePosixPath(name)
        require(name and not path.is_absolute() and '\\' not in name and
                not any(ord(c) < 32 for c in name) and
                all(part not in ('', '.', '..') for part in name.split('/')),
                'Unsafe archive path')
        require(name not in seen, 'Duplicate archive path')
        require(not any(part in FORBIDDEN or part.startswith('.env') or
                        part.lower().endswith(('.pem', '.key', '.sql.gz', '.dump'))
                        for part in path.parts), 'Forbidden archive entry')
        require(member.isdir() or member.isreg(), 'Links and special entries are forbidden')
        require(not member.issparse(), 'Sparse entries are forbidden')
        total += member.size
        require(0 <= member.size and total <= MAX_EXPANDED, 'Expanded archive too large')
        seen.add(name)
        members.append(member)
    require({'package.json', 'package-lock.json', 'scripts/vps/check-release.mjs',
             'app/lib/postgres.ts'} <= seen, 'Missing VPS release prerequisites')
    return members


def private_root(root):
    # Every ancestor must be a real directory; no configurable escape paths.
    for path in [root, *root.parents]:
        info = path.lstat()
        require(stat.S_ISDIR(info.st_mode), 'Staging path must not contain symlinks')
        require(not info.st_mode & 0o022, 'Staging ancestors must not be group/world writable')
        require(info.st_uid in (0, os.geteuid()), 'Untrusted staging directory owner')
    info = root.stat()
    require(info.st_uid == os.geteuid() and stat.S_IMODE(info.st_mode) == 0o700,
            'Staging root must be owned by upload account with mode 0700')


def receive(stream, command, root=ROOT):
    sha, expected = parse_command(command)
    private_root(root)
    # Root is private to this dedicated upload account. Never share its UID with PM2.
    lockfd = os.open(root / '.upload.lock', os.O_CREAT | os.O_RDWR | os.O_NOFOLLOW, 0o600)
    with os.fdopen(lockfd, 'w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise Rejected('Another upload is in progress') from None
        target = root / sha
        require(not os.path.lexists(target), 'Release already staged; never overwrite')
        # Bound retained storage; administrator handles retention after review.
        require(len(list(root.iterdir())) <= 20, 'Staging retention limit reached')
        require(shutil.disk_usage(root).free > MAX_UPLOAD + 2 * MAX_EXPANDED + 16 * 1024 * 1024,
                'Insufficient staging disk space')
        temporary = Path(tempfile.mkdtemp(prefix='.upload-', dir=root))
        try:
            archive_path = temporary / 'source.tar.gz'
            digest = hashlib.sha256()
            size = 0
            with archive_path.open('xb') as output:
                while block := stream.read(1024 * 1024):
                    size += len(block)
                    require(size <= MAX_UPLOAD, 'Upload too large')
                    digest.update(block)
                    output.write(block)
            require(digest.hexdigest() == expected, 'Archive checksum mismatch')
            # Bound decompression before tarfile parses attacker-controlled PAX
            # headers, which can otherwise allocate memory before member checks.
            tar_path = temporary / 'source.tar'
            expanded = 0
            with gzip.open(archive_path, 'rb') as incoming, tar_path.open('xb') as output:
                while block := incoming.read(1024 * 1024):
                    expanded += len(block)
                    require(expanded <= MAX_EXPANDED + 16 * 1024 * 1024,
                            'Decompressed archive too large')
                    output.write(block)
            source = temporary / 'source'
            source.mkdir(mode=0o700)
            with tarfile.open(tar_path, 'r:') as archive:
                members = validate_members(archive)
                # Extract only validated regular files/directories; no tar metadata.
                for member in members:
                    destination = source / member.name
                    if member.isdir():
                        destination.mkdir(mode=0o700, parents=True, exist_ok=True)
                    else:
                        destination.parent.mkdir(mode=0o700, parents=True, exist_ok=True)
                        with archive.extractfile(member) as incoming, destination.open('xb') as output:
                            shutil.copyfileobj(incoming, output)
                        destination.chmod(0o700 if member.mode & 0o111 else 0o600)
            archive_path.unlink()
            tar_path.unlink()
            (temporary / 'release.json').write_text(json.dumps({
                'commit': sha, 'sha256': expected, 'status': 'staged-only',
                'activated': False,
            }) + '\n')
            temporary.rename(target)
            return target
        finally:
            if temporary.exists():
                shutil.rmtree(temporary)


def main():
    os.umask(0o077)
    require(os.geteuid() != 0, 'Do not run the receiver as root')
    require(len(sys.argv) == 1, 'Receiver takes no command-line arguments')
    # Slow/incomplete uploads cannot occupy a session indefinitely.
    def timeout(signum, frame):
        raise Rejected('Upload timed out')
    signal.signal(signal.SIGALRM, timeout)
    signal.alarm(180)
    target = receive(sys.stdin.buffer, os.environ.get('SSH_ORIGINAL_COMMAND', ''))
    print(json.dumps({'commit': target.name, 'status': 'staged-only', 'activated': False}))


if __name__ == '__main__':
    try:
        main()
    except (Rejected, OSError, ValueError, tarfile.TarError, EOFError) as error:
        print('STOP: ' + (str(error) if isinstance(error, Rejected) else
                         'Upload could not be verified'), file=sys.stderr)
        sys.exit(1)
