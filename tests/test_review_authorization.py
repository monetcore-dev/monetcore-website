"""Exercise the actual intent gate without credentials, GitHub, or VPS access."""
import importlib.util
from pathlib import Path
import os
import subprocess
import tempfile
import unittest

ROOT = Path(__file__).parents[1]
spec = importlib.util.spec_from_file_location('authorization', ROOT / 'scripts/vps/authorize_review_stage.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)
SHA = 'a' * 40


def context(**changes):
    values = dict(GITHUB_EVENT_NAME='workflow_dispatch', GITHUB_REPOSITORY=gate.REPOSITORY,
                  GITHUB_REF=gate.REF, GITHUB_ACTOR=gate.OWNER, GITHUB_TRIGGERING_ACTOR=gate.OWNER,
                  GITHUB_SHA=SHA, CANDIDATE_SHA=SHA, STAGE_REQUESTED='false', OWNER_CONFIRMATION='')
    values.update(changes)
    return values


class AuthorizationTests(unittest.TestCase):
    def test_validation_dispatch_never_authorizes_upload(self):
        self.assertEqual(gate.authorize(context()), (SHA, False))

    def test_exact_review_confirmation_authorizes_staging_intent_only(self):
        self.assertEqual(gate.authorize(context(STAGE_REQUESTED='true',
                         OWNER_CONFIRMATION=f'REVIEWED {SHA} FOR STAGING ONLY')), (SHA, True))

    def test_automatic_events_rejected(self):
        for event in ['push', 'pull_request', 'pull_request_target', 'schedule', 'workflow_run', 'repository_dispatch', '']:
            with self.subTest(event=event), self.assertRaises(gate.Denied):
                gate.authorize(context(GITHUB_EVENT_NAME=event))

    def test_forks_and_wrong_branches_rejected(self):
        for changes in [dict(GITHUB_REPOSITORY='someone/monetcore-website'),
                        dict(GITHUB_REF='refs/heads/main'), dict(GITHUB_REF='refs/pull/9/merge')]:
            with self.subTest(changes=changes), self.assertRaises(gate.Denied):
                gate.authorize(context(**changes))

    def test_non_owner_dispatch_or_rerun_rejected(self):
        for key in ['GITHUB_ACTOR', 'GITHUB_TRIGGERING_ACTOR']:
            with self.subTest(key=key), self.assertRaises(gate.Denied):
                gate.authorize(context(**{key: 'someone-else'}))

    def test_invalid_pin_rejected(self):
        for pin in ['', 'main', 'a'*7, 'A'*40, 'g'*40, SHA+'\n', SHA+';id']:
            with self.subTest(pin=pin), self.assertRaises(gate.Denied):
                gate.authorize(context(CANDIDATE_SHA=pin))

    def test_branch_movement_or_different_commit_rejected(self):
        with self.assertRaises(gate.Denied):
            gate.authorize(context(GITHUB_SHA='b'*40))

    def test_staging_needs_matching_confirmation(self):
        for confirmation in ['', 'yes', f'REVIEWED {"b"*40} FOR STAGING ONLY',
                             f'REVIEWED {SHA} FOR STAGING ONLY\n']:
            with self.subTest(confirmation=confirmation), self.assertRaises(gate.Denied):
                gate.authorize(context(STAGE_REQUESTED='true', OWNER_CONFIRMATION=confirmation))

    def test_no_implicit_truthy_staging(self):
        for stage in ['', 'yes', '1', 'TRUE']:
            with self.subTest(stage=stage), self.assertRaises(gate.Denied):
                gate.authorize(context(STAGE_REQUESTED=stage))

    def test_cli_outputs_only_validated_pin_and_intent(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'output'
            result = subprocess.run(['python3', '-B', str(ROOT / 'scripts/vps/authorize_review_stage.py')],
                env={**context(), 'GITHUB_OUTPUT': str(output), 'PATH': os.environ['PATH']}, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(output.read_text(), f'sha={SHA}\nstage_authorized=false\n')

    def test_cli_failure_writes_no_authorization(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / 'output'
            result = subprocess.run(['python3', '-B', str(ROOT / 'scripts/vps/authorize_review_stage.py')],
                env={**context(STAGE_REQUESTED='true'), 'GITHUB_OUTPUT': str(output), 'PATH': os.environ['PATH']}, capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse(output.exists())

    def test_workflow_has_separate_manual_and_upload_enable_gates(self):
        workflow = (ROOT / '.github/workflows/review-release.yml').read_text()
        stage = workflow.split('\n  stage:\n', 1)[1]
        self.assertIn("github.event_name == 'workflow_dispatch'", stage)
        self.assertIn("needs.authorize.outputs.stage_authorized == 'true'", stage)
        self.assertIn("vars.REVIEW_UPLOAD_ENABLED == 'true'", stage)
        self.assertIn('needs: [authorize, prepare]', stage)
        self.assertIn('StrictHostKeyChecking=yes', stage)
        self.assertIn('sha256sum --check source.sha256', stage)
        self.assertNotIn('\n  schedule:', workflow)
        self.assertNotIn('\n  push:', workflow)


if __name__ == '__main__':
    unittest.main()
