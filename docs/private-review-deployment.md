# Solo-owner private-review source-staging workflow

## Current boundary and verified configuration

PR #9 remains unmerged. This workflow can validate and upload approved source into
an isolated incoming directory; it cannot build on the VPS, activate a release,
change routing, restart services, or operate the restored website, runtime secrets,
PostgreSQL, PM2, Nginx or production. No VPS access is part of this update.
`REVIEW_UPLOAD_ENABLED` must remain **unset** until commissioning evidence and the
applicable end-to-end tests have been accepted. It has not been set by this work.

Owner-reported completed commissioning: the receiver is installed and tested;
the dedicated restricted key authenticates, rejects arbitrary commands and passes
preliminary filesystem isolation checks. These are operator-reported results, not
new remote tests by Codex. Do not recreate the account, regenerate its key, reinstall
SSH settings or repeat completed setup unless a specific failed check requires it.

Read-only GitHub inspection confirms Environment `private-review` exists, has no
required-reviewer rule, has administrator bypass disabled, and allows only branch
`feature/monetcore-vps-completed`. No Environment settings or secrets were changed.
Only the owner is available, so independent review is deliberately not required.

Vercel's Ignored Build Step was verified on `dev/private-review-workflow` with
status **Canceled by Ignored Build Step**. This does not prove main/production or
VPS-branch exclusions. Keep PR #9 unmerged and do not push to main or change Vercel
production settings in this task. The repository is public: archives contain only
reviewed tracked source, never private backups, keys, env files or customer data.

## Authorization and security limitations

Source preparation is manual-only on the exact VPS branch. The owner supplies a
full lowercase 40-character `candidate_sha`. It must equal the immutable commit
GitHub captured for the selected branch at dispatch time; if the branch moved,
the run fails and the owner must review the new tip and dispatch again. Historical
or arbitrary cross-branch commits cannot be selected silently.

Staging requires all of these checks:

- `workflow_dispatch`, exact repository and exact VPS branch;
- both initial actor and rerun actor are `monetcore-dev`;
- explicit `stage=true`;
- exact confirmation `REVIEWED <candidate_sha> FOR STAGING ONLY`;
- successful authorization, receiver/security tests and secret-free release checks;
- exact-SHA source archive, artifact selection, commit metadata and SHA256 checks;
- repository variable `REVIEW_UPLOAD_ENABLED=true` (intentionally not set now);
- Environment branch policy, scoped SSH secrets and trusted host-key checking.

Pull requests run tests only. Pushes, schedules, workflow-completion events and
repository-dispatch events cannot authorize upload. No workflow job or receiver
command activates releases. The receiver remains unchanged and accepts only the
`review-stage <SHA> <SHA256>` protocol, rejecting shell/activation commands and
unsafe, oversized, duplicate, corrupt or concurrent archive uploads.

**This is weaker than independent approval.** The same owner can review code,
change the workflow, enable uploads and dispatch. A compromised owner account,
GitHub session or workflow definition can bypass these repository-side intent
checks. Typing a confirmation does not prove review or create a second approver.
Use strong MFA/passkeys, least-privilege access, audit logs and the restricted key.
The forced command and lack of runtime/production access limit the key's scope;
they do not make a compromised owner or malicious staged source trustworthy.
Checksum verification detects transfer corruption, not an independently signed
source identity. Do not describe Environment branch restrictions or manual dispatch
as equivalent to a required independent reviewer.

## Repository and Environment configuration

The workflow uses commit-pinned actions, read-only GitHub token permissions,
non-persisted checkout credentials and serialized runs. The authorization checker
is `scripts/vps/authorize_review_stage.py`. The validated SHA is passed through job
outputs into checkout, archive creation, artifact names, commit metadata and upload.
The preparation job also verifies the actual checkout SHA. Reruns retain the original
pin but are checked against the rerunning actor and the current upload gate.

The source validation runner on the VPS branch performs typecheck, server tests,
offline staging tests, lint and a flags-off review build with business credentials
removed. It needs the local VPS branch name; the workflow creates that name only
inside the disposable runner checkout. It never changes a VPS working tree.

Keep the existing Environment branch policy. Do not add a required-reviewer rule
that blocks the sole owner, and do not fall back to repository-wide credentials.
If adjusting an accidentally retained reviewer rule, do so through Settings →
Environments → private-review, preserving the exact branch policy and bypass
setting. No such adjustment was needed at the time of this update.

The administrator enters the existing NEW restricted deployment identity only
through the secure Environment-secret UI; never send keys to Codex or put them in
repository files, commands, logs, backup artifacts or PR comments:

| Environment secret | Intended binding |
| --- | --- |
| `REVIEW_SSH_HOST` | `159.198.41.188` |
| `REVIEW_SSH_PORT` | Actual privately verified SSH port |
| `REVIEW_SSH_USER` | `monetcore-review-deploy` |
| `REVIEW_SSH_KEY` | Dedicated restricted key, never existing application/root key |
| `REVIEW_SSH_KNOWN_HOSTS` | Host-key entry verified through the trusted console/channel |

No application/DB/Basic-auth/production credentials belong in Actions. The source
artifact is retained for seven days in a public repository; treat it as public
source. The SSH upload job does not check out or execute source from the artifact.

## Commissioning procedure: keep upload gate unset

1. Record the installed receiver's reviewed source revision/hash, forced-command
   path, account UID/groups, incoming path/mode, trusted host-key fingerprint and
   the owner's already completed restriction/isolation results. Store no private
   key or application secret in that evidence. Verify account separation from
   `monetcore`, no sudo/PM2/service privileges, root-owned receiver/key restrictions,
   and no read access to actual runtime-secret paths or write access to restored
   files. Preliminary checks do not prove all paths or service policies are covered.
   This task does not connect to or probe those protected resources.
2. Confirm the existing preservation evidence covers dirty, untracked and ignored
   booking/PostgreSQL/preview-safety files plus external Git/config metadata, and
   includes a successful isolated restore comparison. Do not choose a release SHA
   by resetting/pulling over the restored source. Reconcile approved source through
   a separate PR before it becomes a VPS release baseline. A GitHub branch alone
   is not proof of what is currently restored.
3. Run local tests without server access:

   ```sh
   python3 -B -m unittest discover -s tests -p 'test_review_*.py' -v
   actionlint .github/workflows/review-release.yml
   ```

   Authorization tests cover automatic events, wrong branches/repos/actors/reruns,
   malformed or moved pins, missing/mismatched review confirmation, and the separate
   upload-enable condition. All existing receiver security tests are retained.
4. Keep `REVIEW_UPLOAD_ENABLED` absent. An administrator can verify this via Settings
   → Secrets and variables → Actions → Variables. A 403 API response is not proof
   of absence. Do not enable the gate to work around an incomplete test or to make
   this PR runnable. No new manual dispatch is performed in this update.
5. Complete the approved isolated end-to-end SSH commissioning test with the owner
   through the already restricted identity, using a reviewed harmless source fixture
   and a unique test SHA, only in the incoming directory. Check successful staged-only
   metadata, matching checksum, no overwrite, wrong digest, interrupted/concurrent
   transfer, and unsafe-archive rejection. Verify no shell/SFTP/PTY/forwarding and no
   runtime/service privileges. Do not use real runtime credentials or invoke PM2,
   Nginx, database queries or release activation. Tests that were already completed
   only need their evidence recorded. This is not a claim that the GitHub upload job
   has executed end to end; the live upload gate is still closed.
6. The workflow must eventually be present on the default branch for manual dispatch
   registration and on the reconciled VPS branch for execution. PR #9 is deliberately
   unmerged, so do not merge just to test dispatch. Later publication requires separate
   approval and a verified way to avoid production/Vercel deployment. Once publication
   is approved, a `stage=false` validation run can exercise the GitHub preparation path
   while the gate stays unset. Review its exact SHA, artifact and all check results.
7. Only after commissioning and applicable end-to-end evidence are accepted, obtain
   explicit separate authorization for a bounded first GitHub upload test. Enabling
   `REVIEW_UPLOAD_ENABLED` and sending source are not authorized by this runbook update.
   If final GitHub-to-VPS transport remains untested, record that fact: do not call the
   system end-to-end verified merely because unit tests or direct SSH tests passed.

## Exact solo-owner dispatch procedure: future authorization only

Do not execute these dispatch commands in the current task. They are the repeatable
procedure after the publication/commissioning gates above are separately approved.
The owner reviews the candidate diff, tests and workflow from a trusted session:

```sh
REPO=monetcore-dev/monetcore-website
BRANCH=feature/monetcore-vps-completed
CANDIDATE_SHA=$(gh api "repos/$REPO/git/ref/heads/$BRANCH" --jq .object.sha)
printf 'Review this exact commit: %s\n' "$CANDIDATE_SHA"
# Inspect the complete source/workflow diff and checks for this commit first.
# Validation only; upload gate remains unset:
gh workflow run review-release.yml --repo "$REPO" --ref "$BRANCH" \
  -f candidate_sha="$CANDIDATE_SHA" -F stage=false
```

After successful validation, re-check that the branch still points to the reviewed
SHA. Do not silently update the pin if it moved. For an explicitly authorized later
staging-only run, owner confirmation is mandatory:

```sh
# Preconditions: approved candidate, accepted commissioning, upload explicitly
# authorized, and gate enabled through the owner's approved separate action.
test "$(gh api "repos/$REPO/git/ref/heads/$BRANCH" --jq .object.sha)" = "$CANDIDATE_SHA"
gh workflow run review-release.yml --repo "$REPO" --ref "$BRANCH" \
  -f candidate_sha="$CANDIDATE_SHA" -F stage=true \
  -f owner_confirmation="REVIEWED $CANDIDATE_SHA FOR STAGING ONLY"
```

Inspect the exact run SHA/actor, authorization output, all checks, artifact digest
and receiver response `activated=false`. Never treat a successful upload as an
activated release. Each new source candidate needs a new owner review and matching
confirmation; a rerun is not approval of a changed branch tip.

## Solo-owner abort and staging rollback

There is no live-release rollback in this workflow because it never switches a
release. On unexpected staging intent, remove the enable variable and cancel the
specific run from a trusted owner session:

```sh
REPO=monetcore-dev/monetcore-website
# Only if the variable exists; absence is the desired current state.
gh variable delete REVIEW_UPLOAD_ENABLED --repo "$REPO"
# Replace with the verified numeric run ID; do not cancel unrelated work.
gh run cancel RUN_ID --repo "$REPO"
```

Removing a variable does not stop an already-running SSH process. Cancellation may
arrive after extraction; inspect only the incoming release metadata through an
approved commissioning channel, retain evidence, and do not claim an in-flight
upload was undone. The receiver refuses overwrite, so retrying the same SHA is not
an idempotent replacement. Revoke the restricted key through the approved account
administrator if misuse is suspected; no root password is needed by Codex.

If a staged directory must be quarantined, an administrator may separately approve
this fixed incoming-only operation. It does not remove data or touch the restored
website. Replace the SHA only with the verified uploaded commit before execution;
do not run it in the current task:

```sh
sudo -u monetcore-review-deploy /usr/bin/python3 -I - <<'PY'
import json, os, re
from pathlib import Path
sha = 'REPLACE_WITH_VERIFIED_40_CHARACTER_SHA'
assert re.fullmatch('[a-f0-9]{40}', sha)
root = Path('/srv/monetcore-review/incoming')
assert root.is_dir() and not root.is_symlink() and root.resolve() == root
source = root / sha
assert source.is_dir() and not source.is_symlink()
metadata_path = source / 'release.json'
assert metadata_path.is_file() and not metadata_path.is_symlink()
metadata = json.loads(metadata_path.read_text())
assert metadata['commit'] == sha and metadata['activated'] is False
assert metadata['status'] == 'staged-only'
target = root / ('.quarantine-' + sha)
assert not os.path.lexists(target)
source.rename(target)
print('Quarantined incoming source only; no release activation or service change')
PY
```

Quarantine still consumes retention quota; do not automate deletion or weaken the
receiver's no-overwrite check. Reconcile before retrying. Any future activation and
its rollback require a separate reviewed adapter, exact known-good release/process
identity and configuration backup, explicit owner approval, and verified recovery.
The historical `private_review.py` on the customer-foundation branch pins an older
application commit and can modify Nginx: do not run it blindly, remove its prompts,
or call it from this workflow. Production, the restored source and live routing
remain outside all staging and abort procedures.

## Remaining blockers and next action

Owner reports receiver/key installation and preliminary isolation complete; GitHub
Environment branch policy and lack of reviewer rule were verified read-only. The
workflow and runbook are prepared for the solo-owner policy, but no live upload or
activation is performed. Keep PR #9 unmerged and `REVIEW_UPLOAD_ENABLED` unset.
Record remaining commissioning/preservation/restore evidence and validate the
candidate source baseline. Future workflow publication and any bounded GitHub-to-VPS
upload test need separate authorization and production-safe publication handling.
No independent reviewer or existing administrator password is required.

## Preservation reference: only if evidence is still missing

The following previously prepared inventory/backup plan is reference material for
the owner. Do not rerun completed work, connect to protected resources in this task,
or treat it as authorization to change the restored source. It has not been run by
Codex. Keep secret-bearing backups outside this public repository and Actions.

### A. Administrator-run read-only inventory

Run privately as the existing `monetcore` user through the trusted VPS console or
existing SSH session. These commands use no sudo, SQL, PM2 invocation or process
environment/argument dump. Return sanitized metadata only, never secret values.

```sh
SOURCE=/home/monetcore/monetcore-website
id
realpath -- "$SOURCE"
stat -c '%U %G %a %F %n' -- "$SOURCE" "$SOURCE/.git"
git -C "$SOURCE" branch --show-current
git -C "$SOURCE" rev-parse --verify 'HEAD^{commit}'
git -C "$SOURCE" status --short --untracked-files=all
find -P "$SOURCE" -maxdepth 1 -name '.env*' -printf '%u %g %m %y %f\n'
ps -u monetcore -o pid=,comm=
ss -ltnp '( sport = :3000 )'
du -sx --block-size=1 -- "$SOURCE"
df -PB1 -- /home/monetcore
```

Record the existing PM2 PID/cwd using `readlink /proc/VERIFIED_PID/cwd`; do not read
`/proc/PID/environ` or print `pm2 jlist`/`pm2 env`. Inventory runtime/config paths,
source symlinks and external Git metadata as names only. Confirm PostgreSQL and
preview-safety source files exist without printing credentials. File presence is
not proof of live DB connectivity. Inaccessible/external paths need an expanded
preservation plan before any account changes.

### B. Backup/recovery plan: approve after inventory, before account changes

The following non-root recipe writes only to a new private backup directory. It
has not run. Require enough free space for an archive plus extracted recovery
copy and headroom. A full-source archive contains ignored/untracked files and may
contain secrets; it stays on approved private recovery storage, never GitHub,
Actions, repository files or chat. Abort on tar/diff warnings or concurrent changes.

```sh
set -eu
umask 077
SOURCE=/home/monetcore/monetcore-website
# Supports an ordinary .git directory, not linked/external metadata.
test -d "$SOURCE/.git" && test ! -L "$SOURCE/.git"
BACKUP_ROOT=/home/monetcore/monetcore-preservation
test ! -L "$BACKUP_ROOT"
mkdir -p -- "$BACKUP_ROOT"
chmod 700 -- "$BACKUP_ROOT"
BACKUP=$(mktemp -d "$BACKUP_ROOT/restored-XXXXXXXX")
git -C "$SOURCE" status --porcelain=v1 --untracked-files=all > "$BACKUP/status.before"
tar --acls --xattrs --numeric-owner -czf "$BACKUP/source.tar.gz" -C /home/monetcore monetcore-website
sha256sum "$BACKUP/source.tar.gz" > "$BACKUP/source.sha256"
sha256sum --check "$BACKUP/source.sha256"
mkdir -- "$BACKUP/restore-check"
tar --no-same-owner -xzf "$BACKUP/source.tar.gz" -C "$BACKUP/restore-check"
diff --no-dereference -qr -- "$SOURCE" "$BACKUP/restore-check/monetcore-website" > "$BACKUP/restore.compare"
git -C "$SOURCE" status --porcelain=v1 --untracked-files=all > "$BACKUP/status.after"
cmp -- "$BACKUP/status.before" "$BACKUP/status.after"
printf 'Backup path (private): %s\n' "$BACKUP"
```

A checksum alone is insufficient: require successful isolated extraction/content
comparison and unchanged Git status. Verify ACL/xattr/ownership recovery separately;
restoring metadata may need administrator approval. Preserve external Git/config
paths separately if discovered. Record the existing database backup/recovery policy
without SQL, exports or migrations. This source archive is not a transactionally
consistent database backup or complete system snapshot. Never restore over the
running tree, remove the original, or claim backup verified before these checks run.
