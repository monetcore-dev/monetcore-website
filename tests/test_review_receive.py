"""Offline security regressions; no SSH, PM2, Nginx, or VPS operations."""
import hashlib
from contextlib import nullcontext
import importlib.util
import io
import os
import fcntl
import gzip
import json
from pathlib import Path
import stat
import tarfile
import tempfile
from types import SimpleNamespace
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('receiver', Path(__file__).parents[1] / 'scripts/vps/review_receive.py')
receiver = importlib.util.module_from_spec(spec)
spec.loader.exec_module(receiver)


def archive(extra=()):
    data = io.BytesIO()
    with tarfile.open(fileobj=data, mode='w:gz') as tar:
        for name in ['package.json', 'package-lock.json', 'scripts/vps/check-release.mjs', 'app/lib/postgres.ts']:
            member = tarfile.TarInfo(name)
            member.size = 2
            tar.addfile(member, io.BytesIO(b'{}'))
        for member in extra:
            tar.addfile(member, io.BytesIO(b''))
    return data.getvalue()


class ReceiverTests(unittest.TestCase):
    def check_payload_rejected(self, payload, **limits):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parents[1]) as directory:
            root = Path(directory)
            root.chmod(0o700)
            command = 'review-stage ' + 'a'*40 + ' ' + hashlib.sha256(payload).hexdigest()
            with patch.object(receiver, 'private_root'), (patch.multiple(receiver, **limits) if limits else nullcontext()), self.assertRaises((receiver.Rejected, tarfile.TarError, EOFError, OSError)):
                receiver.receive(io.BytesIO(payload), command, root)
            self.assertEqual([p.name for p in root.iterdir()], ['.upload.lock'])

    def test_command_rejects_shell_and_activation(self):
        for command in ['', 'bash', 'review-release ' + 'a'*40 + ' ' + 'b'*64,
                        'review-stage ' + 'a'*40 + ' ' + 'b'*64 + '; id']:
            with self.subTest(command=command), self.assertRaises(receiver.Rejected):
                receiver.parse_command(command)

    def test_rejects_unsafe_entries(self):
        for name in ['../escape', '/absolute', 'a/../../escape', '.env.local',
                     'node_modules/a', '.git/config', 'private.key', 'a\\b', 'a//b']:
            with self.subTest(name=name), self.assertRaises(receiver.Rejected):
                with tarfile.open(fileobj=io.BytesIO(archive([tarfile.TarInfo(name)])), mode='r:gz') as tar:
                    receiver.validate_members(tar)

    def test_rejects_links_devices_duplicates(self):
        for kind in [tarfile.SYMTYPE, tarfile.LNKTYPE, tarfile.CHRTYPE, tarfile.FIFOTYPE]:
            member = tarfile.TarInfo('link')
            member.type = kind
            member.linkname = '/etc/passwd'
            with self.subTest(kind=kind), self.assertRaises(receiver.Rejected):
                with tarfile.open(fileobj=io.BytesIO(archive([member])), mode='r:gz') as tar:
                    receiver.validate_members(tar)
        with self.assertRaises(receiver.Rejected):
            with tarfile.open(fileobj=io.BytesIO(archive([tarfile.TarInfo('package.json')])), mode='r:gz') as tar:
                receiver.validate_members(tar)

    def test_stages_without_execution_and_refuses_overwrite(self):
        # Only the upload policy is mocked; staging and extraction use real files.
        with tempfile.TemporaryDirectory(dir=Path(__file__).parents[1]) as directory:
            root = Path(directory)
            root.chmod(0o700)
            payload = archive()
            sha = 'a'*40
            command = 'review-stage ' + sha + ' ' + hashlib.sha256(payload).hexdigest()
            # Cloud workspace ancestors have a platform owner, unlike the target
            # /srv layout. Keep filesystem staging real, mock only that policy.
            with patch.object(receiver, 'private_root'):
                target = receiver.receive(io.BytesIO(payload), command, root)
            self.assertEqual((target / 'source/package.json').read_bytes(), b'{}')
            self.assertIn('staged-only', (target / 'release.json').read_text())
            self.assertFalse((target / 'source/.git').exists())
            with patch.object(receiver, 'private_root'), self.assertRaises(receiver.Rejected):
                receiver.receive(io.BytesIO(payload), command, root)

    def test_checksum_failure_leaves_no_release(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parents[1]) as directory:
            root = Path(directory)
            root.chmod(0o700)
            with patch.object(receiver, 'private_root'), self.assertRaises(receiver.Rejected):
                receiver.receive(io.BytesIO(archive()), 'review-stage ' + 'a'*40 + ' ' + '0'*64, root)
            self.assertEqual([p.name for p in root.iterdir()], ['.upload.lock'])

    def test_rejects_symlink_root(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parents[1]) as directory:
            link = Path(directory) / 'link'
            link.symlink_to(directory)
            with self.assertRaises(receiver.Rejected):
                receiver.private_root(link)

    def test_compressed_size_limit(self):
        self.check_payload_rejected(archive(), MAX_UPLOAD=10)

    def test_expanded_member_limit(self):
        self.check_payload_rejected(archive(), MAX_EXPANDED=1)

    def test_decompression_bomb_limit(self):
        payload = gzip.compress(b'\0' * (17 * 1024 * 1024))
        self.check_payload_rejected(payload, MAX_EXPANDED=1)

    def test_member_count_limit(self):
        self.check_payload_rejected(archive(), MAX_FILES=1)

    def test_malformed_archive_cleanup(self):
        for payload in [b'not gzip', gzip.compress(b'not tar')]:
            with self.subTest(payload=payload):
                self.check_payload_rejected(payload)

    def test_missing_prerequisites(self):
        data = io.BytesIO()
        with tarfile.open(fileobj=data, mode='w:gz'):
            pass
        self.check_payload_rejected(data.getvalue())

    def test_low_disk_and_retention_refuse_upload(self):
        payload = archive()
        command = 'review-stage ' + 'a'*40 + ' ' + hashlib.sha256(payload).hexdigest()
        with tempfile.TemporaryDirectory(dir=Path(__file__).parents[1]) as directory:
            root = Path(directory)
            with patch.object(receiver, 'private_root'), patch.object(receiver.shutil, 'disk_usage', return_value=SimpleNamespace(free=0)), self.assertRaises(receiver.Rejected):
                receiver.receive(io.BytesIO(payload), command, root)
            for i in range(20):
                (root / str(i)).mkdir()
            with patch.object(receiver, 'private_root'), self.assertRaises(receiver.Rejected):
                receiver.receive(io.BytesIO(payload), command, root)
            self.assertFalse((root / ('a'*40)).exists())

    def test_concurrent_upload_is_rejected(self):
        payload = archive()
        command = 'review-stage ' + 'a'*40 + ' ' + hashlib.sha256(payload).hexdigest()
        with tempfile.TemporaryDirectory(dir=Path(__file__).parents[1]) as directory:
            root = Path(directory)
            with (root / '.upload.lock').open('w') as lock:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
                with patch.object(receiver, 'private_root'), self.assertRaises(receiver.Rejected):
                    receiver.receive(io.BytesIO(payload), command, root)
            self.assertEqual([p.name for p in root.iterdir()], ['.upload.lock'])

    def test_interrupted_stream_cleans_temporary_files(self):
        stream = SimpleNamespace(read=lambda size: (_ for _ in ()).throw(OSError('interrupted')))
        with tempfile.TemporaryDirectory(dir=Path(__file__).parents[1]) as directory:
            root = Path(directory)
            with patch.object(receiver, 'private_root'), self.assertRaises(OSError):
                receiver.receive(stream, 'review-stage ' + 'a'*40 + ' ' + '0'*64, root)
            self.assertEqual([p.name for p in root.iterdir()], ['.upload.lock'])

    def test_private_root_owner_and_permission_policy(self):
        root = Path('/srv/monetcore-review/incoming')
        uid = os.geteuid()
        def metadata(path):
            return SimpleNamespace(st_uid=uid if path == root else 0,
                                   st_mode=stat.S_IFDIR | (0o700 if path == root else 0o755))
        with patch.object(Path, 'lstat', metadata), patch.object(Path, 'stat', metadata):
            receiver.private_root(root)
        for bad in [SimpleNamespace(st_uid=uid, st_mode=stat.S_IFDIR | 0o777),
                    SimpleNamespace(st_uid=uid + 10, st_mode=stat.S_IFDIR | 0o700)]:
            def bad_metadata(path):
                return bad if path == root else metadata(path)
            with patch.object(Path, 'lstat', bad_metadata), self.assertRaises(receiver.Rejected):
                receiver.private_root(root)

    def test_output_metadata_records_no_activation(self):
        payload = archive()
        digest = hashlib.sha256(payload).hexdigest()
        with tempfile.TemporaryDirectory(dir=Path(__file__).parents[1]) as directory:
            with patch.object(receiver, 'private_root'):
                target = receiver.receive(io.BytesIO(payload), 'review-stage ' + 'a'*40 + ' ' + digest, Path(directory))
            self.assertEqual(json.loads((target / 'release.json').read_text()), {
                'commit': 'a'*40, 'sha256': digest, 'status': 'staged-only', 'activated': False,
            })


if __name__ == '__main__':
    unittest.main()
