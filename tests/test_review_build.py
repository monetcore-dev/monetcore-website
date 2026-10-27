"""Filesystem/Git fixtures only; never run npm, SSH, services, or database calls."""
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('review_build', Path(__file__).parents[1] / 'scripts/vps/prepare_review_build.py')
build = importlib.util.module_from_spec(spec)
spec.loader.exec_module(build)


class BuildPreparationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.repo = self.root / 'reference'
        self.repo.mkdir()
        self.git('init', '-q')
        for name in ['package-lock.json', 'scripts/vps/check-release.mjs', 'app/page.tsx']:
            path = self.repo / name
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text('reviewed source\n')
        self.git('add', '.')
        self.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Fixture')
        self.sha = self.git('rev-parse', 'HEAD').strip()
        self.staged = self.root / 'staged'
        shutil.copytree(self.repo, self.staged, ignore=shutil.ignore_patterns('.git'))
        self.output = self.root / 'builds'
        self.output.mkdir(mode=0o700)

    def git(self, *args):
        return subprocess.check_output(['git', '-C', str(self.repo), *args], text=True)

    def prepare(self):
        return build.prepare(self.repo, self.staged, self.sha, self.output)

    def test_exact_source_copied_without_build_or_activation(self):
        target = self.prepare()
        self.assertEqual((target / 'app/page.tsx').read_bytes(), (self.staged / 'app/page.tsx').read_bytes())
        manifest = json.loads((target / '.review-source.json').read_text())
        self.assertEqual(manifest['commit'], self.sha)
        self.assertFalse(manifest['built'])
        self.assertFalse(manifest['activated'])
        self.assertFalse((target / '.git').exists())

    def test_content_tampering_cleans_only_new_directory(self):
        (self.staged / 'app/page.tsx').write_text('changed')
        with self.assertRaises(ValueError):
            self.prepare()
        self.assertEqual(list(self.output.iterdir()), [])
        self.assertTrue(self.staged.exists())

    def test_existing_build_is_never_overwritten_or_removed(self):
        target = self.prepare()
        sentinel = target / 'operator-file'
        sentinel.write_text('keep')
        with self.assertRaises(FileExistsError):
            self.prepare()
        self.assertEqual(sentinel.read_text(), 'keep')

    def test_extra_secret_and_missing_source_refused(self):
        secret = self.staged / '.env.local'
        secret.write_text('fixture only')
        with self.assertRaises(ValueError):
            self.prepare()
        secret.unlink()
        (self.staged / 'app/page.tsx').unlink()
        with self.assertRaises(ValueError):
            self.prepare()

    def test_symlinked_source_and_build_root_refused(self):
        path = self.staged / 'app/page.tsx'
        path.unlink()
        path.symlink_to(self.repo / 'app/page.tsx')
        with self.assertRaises(ValueError):
            self.prepare()
        linked = self.root / 'link'
        linked.symlink_to(self.output)
        with self.assertRaises(ValueError):
            build.prepare(self.repo, self.staged, self.sha, linked)

    def test_source_overlap_and_public_build_root_refused(self):
        with self.assertRaises(ValueError):
            build.prepare(self.repo, self.staged, self.sha, self.staged)
        self.output.chmod(0o755)
        with self.assertRaises(ValueError):
            self.prepare()

    def test_runtime_and_unrelated_output_roots_are_not_allowed(self):
        for path in [
            '/home/monetcore/.pm2', '/home/monetcore/.ssh', '/home/monetcore/postgres-data',
            '/home/monetcore/monetcore-website', '/home/monetcore/monetcore-releases',
            '/srv/monetcore-review/incoming', '/etc/nginx', '/var/lib/postgresql',
            '/workspace/monetcore-website', '/tmp', '/workspace/scratch',
            '/tmp/../etc/nginx', '/workspace/scratch/../../home/monetcore/.pm2',
        ]:
            with self.subTest(path=path):
                self.assertFalse(build.allowed_build_root(Path(path)))
        for path in ['/home/monetcore/monetcore-review-builds',
                     '/workspace/scratch/private-build', '/tmp/private-build/root']:
            with self.subTest(path=path):
                self.assertTrue(build.allowed_build_root(Path(path)))

    def test_unpinned_reference_refused(self):
        with self.assertRaises(ValueError):
            build.prepare(self.repo, self.staged, 'HEAD', self.output)

    def test_protected_root_refused_without_writing(self):
        with patch.object(build, 'PROTECTED', (self.output,)), self.assertRaises(ValueError):
            self.prepare()
        self.assertEqual(list(self.output.iterdir()), [])

    def test_unreadable_extra_directory_is_not_silently_skipped(self):
        hidden = self.staged / 'unreadable'
        hidden.mkdir(mode=0o000)
        try:
            with self.assertRaises(PermissionError):
                self.prepare()
        finally:
            hidden.chmod(0o700)

    def test_receipt_cannot_overwrite_reviewed_source(self):
        (self.repo / '.review-source.json').write_text('{}')
        self.git('add', '.')
        self.git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'Receipt fixture')
        self.sha = self.git('rev-parse', 'HEAD').strip()
        with self.assertRaises(ValueError):
            self.prepare()

    def test_directory_component_links_not_followed(self):
        shutil.rmtree(self.staged / 'app')
        (self.staged / 'app').symlink_to(self.repo / 'app')
        with self.assertRaises((ValueError, OSError)):
            build.read_file(self.staged, 'app/page.tsx')


if __name__ == '__main__':
    unittest.main()
