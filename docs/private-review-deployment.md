# Private review deployment preparation

## Status and decision

This procedure prepares protected, repeatable source validation and upload. It
**does not activate a release**. Nothing here has been installed on the VPS;
no Nginx/PM2 changes, database operations or production deployment are authorized.
Leave `REVIEW_UPLOAD_ENABLED` unset until the upload account is approved and tested.

**Vercel exclusion verified:** the administrator saved an Ignored Build Step rule
for `dev/private-review-workflow`. A documentation-only test push at commit
`2b7a8db` returned Vercel status **Canceled by Ignored Build Step**. This verifies
that branch's build is skipped; it does not establish exclusions for main or other
branches. The earlier preparation commit `8ee48ec` had automatically created a
non-production Preview before the rule was saved. Keep PR #9 unmerged: a main
merge may still redeploy production. Do not change production integration settings
without separate approval. VPS review deployment remains unperformed.

The permanent boundary is: cloud development → reviewed Git commit → manual
GitHub Actions validation → approved private staging upload → separately approved
candidate and review-only upstream switch. Runtime secrets never enter Actions,
source archives or the upload account. Keep the restored source and old process
intact for comparison and rollback. Homepage/navigation work follows this setup.

## What was inspected

| Source | Finding |
| --- | --- |
| `main`, `804b687c87ceb70536099219adf9c3aaa038b4ce` | Older Supabase/Vercel implementation; not a VPS release baseline |
| `feature/monetcore-vps-completed`, `a67acee66ac3d0b602b4b98dceceab8440a5dba5` | PostgreSQL changes, secret-free release checker and uploaded-source fingerprint checker |
| `feature/monetcore-2-customer-foundation` | `scripts/vps/private_review.py`, example configuration, deployment guide and 27 existing Python tests |

All advertised remote branches were searched without switching over the cloud
checkout. The existing `private_review.py` pins application commit
`a1ca9ad6286e9c05b2271f7365acd3e753b33fb4`; it builds separate releases and checks
candidate health, private ingress, runtime compatibility, and rollback process
PID/cwd. Its switch/rollback prompts are interactive and it edits/reloads Nginx
using sudo install/mv commands. Do not grant those capabilities to an Actions key,
remove its confirmations, or use its old application pin over restored VPS work.
It is reference material for a later reviewed activation adapter.

The VPS branch checker runs typecheck, server tests, offline staging tests, lint
and a review build without business credentials. Its offline runner permits only
the VPS branches. The baseline verifier checks original uploaded files but misses
additional/untracked files: it is not a complete drift or preservation check.
No actual VPS Nginx, PM2, SSH, firewall or authentication configuration was read.

Operator-supplied baseline, still requiring private read-only verification:

| Item | Value |
| --- | --- |
| VPS | `159.198.41.188` |
| Existing account | `monetcore` — never reuse its SSH key in Actions |
| Restored source to preserve | `/home/monetcore/monetcore-website` |
| Existing review process | PM2 `monetcore-website`, port `3000` |
| Review domain | `review.monetcore.dev` |
| Production | `monetcore.dev` — excluded from every setup/switch operation |

## Automated repository work

The four files in this change are the manual workflow, this guide, upload receiver,
and receiver tests. No application logic or dependency declarations change.

`.github/workflows/review-release.yml` runs receiver security checks on pull
requests affecting these four files. Release preparation/upload run only by manual
dispatch on `feature/monetcore-vps-completed`. It uses exact action commit pins, read-only GitHub
permissions, no persisted checkout credential, and serialized runs. It validates
and packages source at the event SHA. Generated files, env files and node_modules
are not copied from the workspace into the archive. The repository is public. The source artifact is retained for seven days;
treat it as public source, not private storage. It must contain no secrets,
backups, customer data or dumps.
Review tracked source for secrets before packaging; git archive is not a scanner.

Default dispatch (`stage=false`) performs validation only. Upload additionally
requires `stage=true`, `REVIEW_UPLOAD_ENABLED=true`, and `private-review` Environment
approval. Its secrets are scoped to the upload step. SSH uses a separately issued
key and a trusted pinned known_hosts entry. No automatic upload on push/PR, arbitrary ref input,
production job, migration or activation command exists.

`scripts/vps/review_receive.py` accepts exactly:

```text
review-stage <40 lowercase hex commit SHA> <64 lowercase hex archive SHA256>
```

One gzip tar archive arrives on stdin. The receiver verifies checksum, size/count
limits and paths before extracting regular files/directories into a fresh private
staging directory. It rejects shell/activation commands, path traversal, links,
special files, sparse entries, duplicate paths, env/key patterns, existing releases
and simultaneous uploads. Compressed input is limited to 64 MiB, expanded files to
256 MiB, with a separate bounded tar-header allowance and 180-second deadline.
Staging holds at most 20 completed releases; administrator-managed disk quota and
retention provide a further boundary. It never runs npm, Git, PM2, Nginx, sudo,
application code, SQL or network calls. Success is **staged-only**, never deployed.
A supplied SHA is a source label, not independent proof that archive contents
match GitHub; provenance depends on trusted Actions and PR/Environment review.

## One-time administrator procedure — approval required before execution

Run these steps privately through the existing trusted administration channel,
not Actions. They are documented here; none has been executed by Codex. Do not
share passwords, existing SSH keys, env contents, database credentials or dumps.

### 1. Preserve and reconcile the restored source

Record current branch/status, process PID/cwd/port and relevant config paths
without printing environment values or raw PM2/nginx configuration. Make a private,
timestamped recoverable archive outside source/release roots covering the full
working tree, ignored/untracked files, Git metadata (including external metadata
if linked), and relevant review configuration. Protect the backup as secret-bearing
material: mode 0700 directory/0600 archive, separate recovery storage, no GitHub
artifact upload. Verify checksums, manifest completeness and restoration into an
isolated directory before any future switch. Maintain the existing database
backup/recovery policy; this task does not authorize SQL or customer-data exports.

Compare the preserved source with the completed VPS branch and uploaded fingerprint,
including all added booking/PostgreSQL/preview-safety files. Secret-scan locally.
Bring reviewed source changes into the VPS branch through a PR; omit secrets/data.
Keep the restored directory byte-for-byte unchanged. Never reset, clean, pull,
checkout over, or rsync into `/home/monetcore/monetcore-website`.

### 2. Create the dedicated upload account and private storage

Confirm these proposed names/paths do not already exist or overlap live resources.
Use an unprivileged `monetcore-review-deploy` account with no sudo, Docker/PM2
membership, database access, runtime secrets or write access to restored source.
Use a distinct UID from `monetcore`. Proposed layout:

```text
/srv/monetcore-review/                   root-owned, mode 0755
/srv/monetcore-review/incoming/          upload-account-owned, mode 0700
/srv/monetcore-review/releases/          reserved for future runtime identity
/usr/local/libexec/monetcore-review-receive   root-owned receiver, mode 0755
```

After review, an administrator can create only the account/incoming directory and
install the receiver from the reviewed commit. Do not create/switch a live release:

```sh
sudo useradd --create-home --shell /bin/sh monetcore-review-deploy
sudo install -d -o root -g root -m 0755 /srv/monetcore-review
sudo install -d -o monetcore-review-deploy -g monetcore-review-deploy -m 0700 /srv/monetcore-review/incoming
sudo install -o root -g root -m 0755 scripts/vps/review_receive.py /usr/local/libexec/monetcore-review-receive
```

These are not blindly rerunnable: inspect existing identities/paths first. The
receiver requires Python 3.12+ and real, non-group/world-writable ancestors owned
by root/upload account. Apply a dedicated disk quota and approved manual retention.
Do not give the upload account access to the existing PM2 home or runtime config.

### 3. Issue a new restricted key and configure SSH

Generate a NEW dedicated Ed25519 key on the administrator's trusted machine:

```sh
ssh-keygen -t ed25519 -f monetcore-review-actions -C monetcore-private-review-actions
```

For unattended Actions, use a dedicated key without an interactive passphrase;
its narrow forced-command authorization, protected Environment and rotation policy
are essential. Do not reuse/request the monetcore/root private key. Transfer only
the new public key to the VPS through the trusted administration channel.

Store the public key in a root-owned dedicated AuthorizedKeysFile outside the
account's home, e.g. `/etc/ssh/authorized_keys/monetcore-review-deploy`, mode 0644
with root-owned non-writable parents. The complete key entry is:

```text
restrict,command="/usr/bin/python3 -I /usr/local/libexec/monetcore-review-receive" ssh-ed25519 REPLACE_WITH_NEW_PUBLIC_KEY_BASE64 monetcore-private-review-actions
```

Replace only the public-key field. Python isolated mode excludes user Python
startup/import configuration. No user-writable wrapper or shell interpolation is
needed. In an approved dedicated sshd Match block, require the same ForceCommand
as defense in depth and disable alternate authentication, forwarding, PTY, user rc
and environment files. Example to adapt to the actual supported OpenSSH version:

```text
Match User monetcore-review-deploy
    AuthorizedKeysFile /etc/ssh/authorized_keys/%u
    AuthenticationMethods publickey
    PasswordAuthentication no
    KbdInteractiveAuthentication no
    PermitTTY no
    DisableForwarding yes
    PermitUserRC no
    ForceCommand /usr/bin/python3 -I /usr/local/libexec/monetcore-review-receive
Match all
```

Confirm the existing global `PermitUserEnvironment` is `no` and `AcceptEnv` does
not admit executable-loader or Python configuration variables.
`PermitUserEnvironment` is not valid inside a Match block. If global policy differs,
stop for a narrowly reviewed SSH policy adjustment; do not change other accounts
blindly. Inspect effective settings for this account with `sshd -T -C user=...` and validate
with `sshd -t` before a separately approved SSH reload. Preserve unrelated SSH
settings and the current administrator session. Confirm account lock/expiry/PAM
policy permits the intended key-only login on this OS. Never relax production
access or grant general shell, SFTP, sudo, agent forwarding or TCP forwarding.

Obtain the VPS host public-key fingerprint through the trusted VPS console/provider,
then compare it out of band with the intended SSH endpoint. Store the verified
known_hosts line; do not trust ssh-keyscan alone or disable host-key checking.
Use `159.198.41.188` for port 22, or `[159.198.41.188]:PORT` for another verified port.

### 4. Protect GitHub before supplying the new key

Protect `feature/monetcore-vps-completed` with PR review, applicable required checks,
no force pushes, and trusted review of workflow/receiver changes. Require separate
review for later changes to activation code. Place the reviewed four files on the
default branch so manual dispatch is registered, and copy those files through a
separate PR to the reconciled VPS branch. Do not merge the older main application
into the VPS source or vice versa just to distribute tooling. The dedicated PR
against main only introduces these four files and does not deploy anything.

Create GitHub Environment **private-review**, restrict deployment branches to the
exact VPS branch, require an independent reviewer, prevent self-review, and disable
administrator bypass where supported. Verify the repository's GitHub plan actually
enforces these rules. If equivalent approval protection is unavailable, keep upload
disabled; do not fall back to unrestricted repository secrets.

Add these **Environment secrets**, never repository-wide application credentials:

| Secret | Value to enter securely |
| --- | --- |
| `REVIEW_SSH_HOST` | `159.198.41.188` |
| `REVIEW_SSH_PORT` | Privately verified SSH port, explicitly including `22` if applicable |
| `REVIEW_SSH_USER` | `monetcore-review-deploy` |
| `REVIEW_SSH_KEY` | Only the newly generated restricted private key |
| `REVIEW_SSH_KNOWN_HOSTS` | Host public-key line verified through the trusted channel |

No database, review Basic auth, production API or existing account secrets belong
in Actions. Retain/revoke/rotate this new key separately from production access.
Leave repository variable `REVIEW_UPLOAD_ENABLED` unset/false during commissioning.

### 5. Commission staging only

Run the receiver security suite in a disposable test account/layout and test SSH
restriction enforcement with a temporary test key before connecting the Actions
key. Attempt shell/id, SFTP, PTY and forwarding; all must fail. Test a valid archive,
wrong digest, unsafe archive, same-SHA retry, interrupted transfer and simultaneous
upload; verify only incoming changes. Delete/revoke the temporary test key.
Confirm source, Nginx, old PM2 PID/cwd/port and production configuration are unchanged.

Run the Actions dispatch on the reconciled VPS branch with `stage=false`; inspect
checks, exact SHA and artifact. After explicit upload-account commissioning approval,
set repository variable `REVIEW_UPLOAD_ENABLED=true`, request `stage=true`, and
approve through the protected Environment. Verify `activated=false`, exact metadata,
private directory permissions and unchanged live state. This uploads source only.

## Future activation and rollback — not connected to Actions

No activation adapter is installed or invoked by this change. Before later approval:
verify actual review-only Nginx file, Basic auth on every route/assets/API, TLS,
trusted overwritten proxy headers, Node loopback binding, memory/CPU/disk capacity,
and a genuinely unused candidate port distinct from 3000. Do not modify DNS,
production server blocks or production process. Noindex alone is not private access.

Build an approved release as an unprivileged build identity in a NEW directory,
without runtime/production secrets. Use compatible Node 24/Linux architecture/glibc
and the existing secret-free release checker. Never run uploaded build scripts as
root, the privileged activation helper, or a user with production credentials.
Runtime settings must be allowlisted with booking/contact/customer/AI flags false,
AI emergency stop true, review markers true, no Vercel metadata, and no existing
live `.env` loaded wholesale. Proxy attestation requires verified ingress.

Adapt the inspected interactive tool's fixed source pin and branch handling only
through reviewed changes. Keep its candidate health, ownership, private-ingress,
configuration-digest checks, explicit switch confirmation and rollback checks.
Preserve the exact original review configuration and old PM2 PID/cwd/port before
switching. A future narrowly scoped activation helper must accept only verified
review releases and never arbitrary sudo/PM2 commands or source paths.

Candidate checks must verify exact release/build marker, expected routes/noindex,
robots/sitemap, disabled APIs and no unexpected browser errors. After a separately
approved review-only switch, check unauthenticated HTTPS 401/403 and authenticated
homepage 200, exact marker and disabled synthetic API requests; make no real
bookings/emails/provider calls. Keep the old process online and avoid `pm2 save`.

On failed switch/health: restore only the exact saved review upstream/configuration
if current digest still matches the expected state; verify the original process
PID/cwd/port still match, run nginx validation and approved review reload, and
recheck authenticated/private health. Preserve both processes if recovery is
uncertain; do not overwrite later operator edits or claim rollback succeeded.
For operator rollback after acceptance, use the exact recorded state/config backup;
do not blindly run the old pinned tool on a new source release. Power loss/SIGKILL
requires inspecting retained state. Production and restored source stay untouched.

## Validation and next action

Executed locally: all 17 receiver tests passed; all 27 existing deployment-tool
tests passed from an isolated copy of the customer-foundation branch (mocked
PM2/Nginx only); actionlint 1.7.7 passed (official release checksum verified).
The documented SSH Match block also passed local `sshd -T` parsing/effective-policy
assertions using a temporary test host key; the actual VPS policy was not changed.
A real source archive from the VPS branch passed checksum, extraction and
staged-only metadata checks in a disposable directory. These results are also
recorded in PR #9. Its GitHub receiver-security job also passed; prepare and
stage jobs were skipped as intended on the PR. These checks do not prove VPS
SSH/Nginx/PM2 health. Review does not require server access; merging remains blocked
until production auto-deployment behavior is addressed separately.

Next required setup approval: authorize **preservation/read-only VPS inventory
and dedicated upload-account commissioning only**, following the administrator
procedure above. Configure the new restricted key and protected `private-review`
Environment; keep `REVIEW_UPLOAD_ENABLED` unset until commissioning checks pass.
Do not merge PR #9 or change production auto-deployment settings as part of this
approval. Before any later merge, separately verify that tooling-only main changes
will not redeploy production. Activation remains
separately unapproved. Obtain preservation/drift evidence before choosing a first
release commit. Once the account, host key and protected Environment are configured,
the staging procedure is reusable; later homepage fixes use reviewed commits rather
than repeated manual setup.

## Commissioning checkpoint: blocked on administrator access

PR #9 remains unmerged. No VPS connection, inventory, backup, account creation or
live isolation test has occurred. The cloud has no SSH key/agent, no trusted VPS
host-key entry and no configured TCP destination grant. Do not infer VPS state from
the GitHub branch. Existing website, uncommitted work, database, PM2 and Nginx have
not been touched. Do not supply existing private keys or passwords to Codex.

GitHub inspection found no `private-review` Environment and only one collaborator,
`monetcore-dev`. The integration rejected Environment creation and variable access
with HTTP 403, Resource not accessible by integration. No Environment, protection,
secret or variable was changed. `REVIEW_UPLOAD_ENABLED` has not been set by Codex;
its actual absence cannot be established through the denied API. The repository is
public, so source artifacts must never be treated as private backup storage.

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

### C. GitHub administrator actions: no secrets supplied to Codex

Use the existing administrator GitHub session, not a new shared token. Inspect
current settings first; PUT replaces supplied protection fields. These exact
non-secret requests prepare a blocking Environment with no secrets:

```sh
gh api --method PUT repos/monetcore-dev/monetcore-website/environments/private-review --input - <<'JSON'
{"wait_timer":0,"prevent_self_review":true,"reviewers":[{"type":"User","id":320996694}],"deployment_branch_policy":{"protected_branches":false,"custom_branch_policies":true},"can_admins_bypass":false}
JSON
gh api --method POST repos/monetcore-dev/monetcore-website/environments/private-review/deployment-branch-policies --input - <<'JSON'
{"name":"feature/monetcore-vps-completed","type":"branch"}
JSON
```

Only the owner exists as a collaborator. With self-review prevention the owner
cannot approve their own dispatch: nominate/invite an independent trusted reviewer
and update required reviewers before operational use. If approval protection cannot
be enforced, keep uploads disabled. Use an authorized administrator request for
`GET repos/monetcore-dev/monetcore-website/actions/variables/REVIEW_UPLOAD_ENABLED`:
404 confirms absence only when access is authorized; 403 does not. Keep it unset.
Do not set any secret yet. After isolation is verified, the administrator alone
enters only the NEW restricted key directly through GitHub's secure Environment
UI. The agent must never receive/copy private keys. Existing application/DB and
production credentials remain outside GitHub.

### D. Elevated server approval boundary and isolation tests

Stop before the exact `sudo useradd` and `sudo install` commands already listed
in steps 2–3 above. They are the next server mutations requiring administrator
approval, and may run only after preservation is verified. SSH policy installation
and any SSH reload also need explicit approval; no reload is authorized here.
Keep the new key unusable until restrictions are verified. No sudo/PM2/DB privilege
may be assigned to the upload identity.

After administrator provisioning, these exact inspections require administrator
approval and must be run privately, not by Codex under this task:

```sh
id monetcore
id monetcore-review-deploy
sudo -l -U monetcore-review-deploy
sudo /usr/sbin/sshd -t
sudo /usr/sbin/sshd -T -C user=monetcore-review-deploy,host=localhost,addr=127.0.0.1
```

Require a distinct UID, approved unprivileged groups, no sudo capability, effective
forced command, no passwords/PTY/forwarding/user rc/environment-file access, and
root-owned non-writable receiver/key policy. Inspect full SSH settings privately;
share only restriction outcomes. Do not invoke PM2 as the upload identity: it may
start a competing daemon.

For access probes, the following impersonation command also needs administrator
approval. It never opens secret files, sends signals or contacts services:

```sh
sudo -u monetcore-review-deploy /usr/bin/python3 -I - <<'PY'
import os
from pathlib import Path
source = Path('/home/monetcore/monetcore-website')
assert os.geteuid() != 0
for path in [source, source / '.git', Path('/home/monetcore/.pm2'),
             Path('/etc/nginx'), Path('/etc/ssh/authorized_keys/monetcore-review-deploy'),
             Path('/usr/local/libexec/monetcore-review-receive')]:
    assert not os.access(path, os.W_OK), 'STOP: upload identity can modify a protected path'
for name in ['.env', '.env.local', '.env.production', '.env.production.local']:
    assert not os.access(source / name, os.R_OK), 'STOP: readable secret path'
assert not os.access('/home/monetcore/.pm2/rpc.sock', os.R_OK | os.W_OK), 'STOP: accessible PM2 socket'
assert os.access('/srv/monetcore-review/incoming', os.R_OK | os.W_OK | os.X_OK)
print('PASS listed path probes; actual secret paths and service policies still need review')
PY
```

Extend probes to actual runtime secrets, custom PM2 home/socket and ACLs discovered
in inventory; inspect sudo/polkit/service and DB auth policy privately. These checks
are necessary, not a complete proof. A failed check requires a separate reviewed
correction; do not chmod or alter restored files under this task. Test shell/SFTP,
PTY/forwarding rejection and staged-only upload with a new temporary key after
approved restriction installation. Existing disposable receiver tests do not prove
real VPS identity isolation. Live isolation and backup verification remain pending.
