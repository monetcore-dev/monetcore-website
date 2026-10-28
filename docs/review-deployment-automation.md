# Manual-only isolated review deployment proposal

Target: **https://review.monetcore.dev only**, source branch
`feature/phase2-clean-review`. This proposal does not activate anything. Do not
merge PR #10, enable either gate, change production, or run the setup until the
owner has separately reviewed the actual VPS and approved commissioning.

## What is reused and what changes

The existing source-only workflow, its restricted upload receiver and
`REVIEW_UPLOAD_ENABLED` are unchanged. The new workflow shares its GitHub
concurrency group and adds a server-side exclusive lock. No push event deploys.
Pull requests run offline Python security tests only. Deployment/rollback require
manual dispatch by `monetcore-dev`, exact immutable intent, the review source
branch, `REVIEW_DEPLOY_ENABLED=true`, and the protected `review-deploy` Environment.
Actions are pinned to commit IDs; permissions are contents-read only.

Dependencies, TypeScript, 63 application/artifact tests (55 existing plus 8 new),
9 offline tests, ESLint and Next.js
production build run in a secret-free GitHub build job. The packaged artifact
is smoke-tested on loopback with synthetic sentinels and an external-network deny
preload before upload. An opt-in standalone output
is enabled only for non-Vercel review builds; ordinary Next/Vercel builds remain
unchanged. Node is pinned to 24.19.0, runner Ubuntu 24.04. The server refuses older
Node, wrong architecture, incompatible glibc, malformed artifacts and missing
runtime prerequisites. Runtime is currently Linux x64 only.

The artifact contains standalone Node modules/server, static assets, public files,
an exact-SHA marker and a fixed flags-off launcher. It contains no source env
files, SSH credentials or inherited application settings. SHA-256 is verified
before extraction; traversal, links, devices, sparse files, duplicate names,
forbidden credential filenames, oversized uploads/decompression and overwrites
are rejected. Next.js internal tracing aliases are materialized into regular files
by the packager only after verifying their targets remain inside the artifact;
escaping links and cycles fail. The server still accepts no links. Root-owned releases are new UTC-timestamp/nonce directories under
`/srv/monetcore-review-deploy/releases`; only `.next/cache` is runtime-writable.

### Why separate accounts

Do **not** put the deployment key on the existing `monetcore` account or reuse its
PM2 home. A forced command on that account does not isolate production secrets
from application code running under the same UID. Existing `monetcore` source,
uncommitted changes and processes remain intact.

- `monetcore_review_deploy`: dedicated SSH-only principal, root-owned forced
  command; sudo allows only this reviewed controller with narrowly matched args.
- `monetcore_review_runtime`: separate PM2 daemon and systemd unit; no SSH/sudo.
  The daemon startup environment is cleared with `env -i`, so manager-level
  production variables are not inherited. Home/production process views are hidden, filesystem is read-only except its
  own runtime/cache paths, outbound IP traffic is denied except localhost.
- The fixed root controller never executes application/npm code as root. It only
  validates/extracts a bounded artifact, invokes the pre-existing isolated PM2
  daemon as the runtime UID, and replaces one literal review upstream.

No application environment/secret files are copied. The generated launcher clears
inherited variables and forces contact, booking, customer and AI activation off,
review mode on and AI emergency stop on. No proxy attestation or provider/database
credential enters this application. Nginx still blocks **all `/api` and `/api/…`
methods with 403**, including GET, POST and OPTIONS. Direct loopback guard checks
also verify application-level disabling.

## One-time owner setup (not executed)

### 1. Inventory, preservation and compatibility

Use the existing private-console source inventory/verified-backup procedure in
`docs/private-review-deployment.md`. Preserve the original source/uncommitted
changes, process and config. Reconcile VPS-only source before selecting any release
SHA. The owner reports the current review listener at `127.0.0.1:3004`; the
controller re-reads the actual upstream and verifies its process each run. Confirm
no unrelated Nginx edits are pending on disk: a global graceful reload can load
them even when this tool changes only review routing.

Require Ubuntu 24.04 Linux x64, root-owned Node 24.19.0 or newer 24.x at
`/usr/bin/node`, root-owned PM2 at `/usr/bin/pm2`, Python 3, `ss`, systemd,
Nginx and a valid review TLS certificate. Do not upgrade/replace production binaries
to satisfy this. If paths differ, stop for a reviewed path adjustment. Require at
least 768 MiB available RAM and ~1.7 GiB disk headroom before each deployment.
Two review releases run concurrently during a switch; assess actual resource use.

The owner's 28 October 2026 commissioning follow-up reports PM2 v7.1.1 at
`/usr/bin/pm2`. Controller, daemon launcher and service stop command use that exact
path; do not relocate or reinstall the shared PM2 installation. The controller
still checks root ownership/non-writable ancestry of the resolved binary before
use, and invokes only the separate review UID/PM2_HOME. This workspace has not
independently connected to the VPS to repeat that inventory.

The supported review file is intentionally narrow: a **dedicated, root-owned
regular file**. The verified active path is exactly
`/etc/nginx/sites-enabled/monetcore-review`, **not a symbolic link**. It is accepted
in place; do not move it to sites-available, create a symlink, or replace other
sites-enabled files. Only this exact sites-enabled filename is allowlisted; the
previous regular-file support in sites-available/conf.d remains compatible.
All file/ancestor root-ownership and non-writable checks still apply. It contains
one HTTPS server for exactly `review.monetcore.dev`, public access (`auth_basic off`
or no local auth directive),
existing certificates, one `/` proxy and both an exact `/api` block and a `/api/` prefix block:

```nginx
location = /api { return 403; }
location ^~ /api/ { return 403; }
location / {
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_pass http://127.0.0.1:ACTUAL_CURRENT_REVIEW_PORT;
}
```

This is a validation shape, **not a command to overwrite the existing site**.
The current review app must already have an unambiguous `127.0.0.1` listener
with a verifiable PID/cwd; otherwise commissioning must stop for review.
The existing Certbot HTTP redirect may remain in the **same file**, before or after
HTTPS. The controller accepts the standard review-only `if ($host =
review.monetcore.dev) { return 301 https://$host$request_uri; }` plus `return 404`
shape, or a simple review-only 301/308 HTTPS redirect. It changes neither the HTTP
block nor comments/certificate directives; only the HTTPS loopback upstream changes.
A separate existing redirect file also stays untouched. Production/mixed-domain,
extra HTTPS, arbitrary conditional/redirect, regex-location or complex routing
layouts are rejected for manual review. No silent vhost splitting or rewriting.

A plain `location /api/ { return 403; }` is supported as well as `^~`: the parser
admits no extra/regex locations which could override it. An exact
`location = /api { return 403; }` is also mandatory. If inventory shows it missing
or either URL not returning 403, commissioning stops; obtain separate approval for
that review-only repair. The deployment does not silently add API locations.
The latest owner update confirms public HTTPS 200 and both `/api` and `/api/`
returning 403 at the verified active path. This supersedes the earlier missing-exact-
API report; that is no longer an owner-reported blocker. The controller still
verifies both blocks and HTTP behavior before any switch. This is owner-provided
inventory, not a new remote inspection by this workspace.

The homepage stays public, with HTTPS 200 and no login challenge. Non-off Basic
Auth is rejected rather than introduced; no Basic password secret is needed.
The controller never reads password/certificate private-key contents.

Before proceeding past this section, the owner must have **read-only VPS evidence**
for Ubuntu/version/architecture, resolved Node and PM2 paths with root ownership,
actual loaded Nginx/Certbot file layout, free memory/disk, and current review
listener PID/cwd/port. Public access and both API blocks must be confirmed. This
workspace has no secure VPS connection; those host facts are not yet verified.
No account, key, unit or config installation is authorized by this document alone.

Read-only inventory examples for an already-authorized private VPS console (not
executed here):

```sh
cat /etc/os-release
uname -m
realpath -e /usr/bin/node /usr/bin/pm2
stat -Lc '%U %G %a %F %n' /usr/bin/node /usr/bin/pm2
free -m
df -h /srv /home/monetcore
ls -l /etc/nginx/sites-enabled
test ! -L /etc/nginx/sites-enabled/monetcore-review
stat -c '%U %G %a %F %n' /etc/nginx/sites-enabled/monetcore-review
ss -ltnp
curl --head --silent --show-error --max-time 10 https://review.monetcore.dev/
curl --head --silent --show-error --max-time 10 https://review.monetcore.dev/api
curl --head --silent --show-error --max-time 10 https://review.monetcore.dev/api/
```

Inspect the actual selected review vhost and associated Certbot redirect read-only
in that private console, correlate its port with the listener PID and `/proc/PID/cwd`,
and verify resolved binary ancestors are root-owned/non-writable. Do not dump
process environments, PM2 JSON, private keys or raw full Nginx configuration into
chat/Actions logs. Return sanitized paths/ownership, listener/layout facts and
HTTP statuses only. Missing exact `/api` protection, unexpected auth, unsupported
layout, uncommitted source reconciliation or insufficient resources is a stop
condition before account/key installation, not a reason to rewrite live config.


### 2. Install dedicated identities and trusted files

After approving the inventory, an administrator uses the reviewed automation
checkout (not a pipe from a moving URL). Example one-time commands:

```sh
sudo useradd --system --create-home --home-dir /var/lib/monetcore-review-runtime --shell /usr/sbin/nologin monetcore_review_runtime
sudo useradd --system --no-create-home --home-dir /var/lib/monetcore-review-deploy --shell /bin/sh monetcore_review_deploy
sudo install -d -o root -g root -m 0755 /srv/monetcore-review-deploy /srv/monetcore-review-deploy/releases /usr/local/libexec
sudo install -d -o root -g root -m 0700 /srv/monetcore-review-deploy/state /srv/monetcore-review-deploy/incoming
sudo install -d -o root -g root -m 0755 /var/lib/monetcore-review-deploy /var/lib/monetcore-review-deploy/.ssh
sudo chmod 0700 /var/lib/monetcore-review-runtime
sudo install -o root -g root -m 0755 scripts/vps/review-deploy.py /usr/local/libexec/monetcore-review-deploy
sudo install -o root -g root -m 0755 scripts/vps/review-deploy-ssh.py /usr/local/libexec/monetcore-review-ssh
sudo install -o root -g root -m 0755 scripts/vps/review-pm2-start.sh /usr/local/libexec/monetcore-review-pm2-start
sudo install -o root -g root -m 0644 scripts/vps/monetcore-review-pm2.service /etc/systemd/system/monetcore-review-pm2.service
sudo install -o root -g root -m 0600 scripts/vps/review-deploy.config.example.json /etc/monetcore-review-deploy.json
```

Stop if any proposed account/path already exists until ownership and prior use
are confirmed. Do not reuse a differently configured account. Verify that all
production secrets outside `/home` are inaccessible to the review runtime UID.
`ProtectHome=true` hides `/home/monetcore`; it does not magically hide arbitrary
world-readable secrets elsewhere. No production permission changes are automated.

Use `sudo visudo -f /etc/sudoers.d/monetcore-review-deploy` to install **only**:

```sudoers
monetcore_review_deploy ALL=(root) NOPASSWD: /usr/local/libexec/monetcore-review-deploy ^deploy [a-f0-9]{40} [a-f0-9]{64}$, /usr/local/libexec/monetcore-review-deploy ^rollback [0-9]{8}T[0-9]{6}Z-[a-f0-9]{8}$
```

Ubuntu 24.04 sudo supports anchored argument regexes; validate with
`sudo visudo -cf /etc/sudoers.d/monetcore-review-deploy`. Do not grant wildcard
shells, generic sudo, Nginx editors, systemctl or PM2 to the SSH/runtime accounts.

### 3. Restricted key, runtime and baseline fingerprint

Generate a **new dedicated Ed25519 deployment key on the owner's computer**. Put
only its public key in root-owned mode-0644
`/var/lib/monetcore-review-deploy/.ssh/authorized_keys`, prefixed exactly:

```text
restrict,command="/usr/bin/python3 -I /usr/local/libexec/monetcore-review-ssh" ssh-ed25519 REPLACE_WITH_PUBLIC_KEY review-actions
```

The account's home/SSH directories must stay root-owned (not writable by the SSH
principal). Keep password login disabled under the existing SSH policy. Do not
change production SSH keys. A non-deployment command such as `whoami` must be
rejected; do not test the deployment verb yet. Never paste the private key in chat.

Set `nginx_site` in the private root-only JSON to exactly
`/etc/nginx/sites-enabled/monetcore-review` (the example now uses this path).
No symlink conversion, relocation or Nginx edit is required for path compatibility.
Run `sudo /usr/local/libexec/monetcore-review-deploy inspect`. It outputs only the
review port/domain and SHA-256 fingerprint of other loaded configuration. Review
that evidence, then set `other_nginx_sha256` to that exact hash in the JSON.
Any later unrelated Nginx change stops deployment until re-inventoried/approved.

Only after account/unit/config review:

```sh
sudo systemd-analyze verify /etc/systemd/system/monetcore-review-pm2.service
sudo systemctl daemon-reload
sudo systemctl enable --now monetcore-review-pm2.service
```

This starts only a **new empty review daemon**, not the application or production
PM2. Verify its UID, cgroup, RPC socket, root-owned Node/PM2 paths and effective
sandbox. Check journald for unsupported IP-firewall/sandbox warnings; verify the
unit really cannot reach an external test destination or production secret files
before commissioning. Unsupported eBPF/network enforcement is a launch blocker,
not permission to drop these controls. Do not restart the existing PM2 daemon.

### 4. GitHub Environment and four secrets

After PR approval/integration, create Environment **`review-deploy`**, restricted
to `feature/phase2-clean-review`, with the owner as required reviewer. For a solo
owner, leave prevent-self-review off; otherwise a different approver is needed.
Store these **Environment secrets only**:

| Name | Value |
| --- | --- |
| `REVIEW_DEPLOY_HOST` | Verified VPS hostname/IP |
| `REVIEW_DEPLOY_PORT` | Verified SSH port |
| `REVIEW_DEPLOY_KEY` | Dedicated private SSH key, entered securely in GitHub |
| `REVIEW_DEPLOY_KNOWN_HOSTS` | Exact host-key line verified independently through the VPS console |

For non-22 SSH ports, use `[host]:port` in known_hosts. Verify the host-key
fingerprint against `/etc/ssh/ssh_host_ed25519_key.pub` through the trusted VPS
console; do not trust a network `ssh-keyscan` result by itself. SSH enforces strict
host-key checking. No SMTP, Calendar, database, Redis or OpenAI secrets are needed.

Keep `REVIEW_DEPLOY_ENABLED` **absent/false** during setup; never enable the old
`REVIEW_UPLOAD_ENABLED` gate for this proposal. After separate activation approval,
set the **repository variable** `REVIEW_DEPLOY_ENABLED=true` (a repository variable
is deliberate: the job-level gate is evaluated before Environment secrets load).
Do not set any automatic push deployment trigger.

### Default-branch dispatch bootstrap — separate approval, not performed

GitHub requires the workflow file with `workflow_dispatch` on the default branch.
Read-only Git inspection on 28 October 2026 found default branch `main` at
`804b687c87ceb70536099219adf9c3aaa038b4ce`, without
`.github/workflows/review-deploy.yml` (and without the older review-release file).
A branch-only file or a registered-looking Actions entry does not remove this
requirement. Do not try repository_dispatch, a write token, a new push/tag trigger,
changing the default branch, or merging the application into main to bypass it.

Minimal proposed solution, **requiring separate owner approval**:

1. Finish this PR's compatibility review and the read-only inventory; keep PR #11
   **draft** until live commissioning checks pass. Do not install accounts/keys yet.
2. Before ANY main commit, separately verify/approve how the existing Vercel Git
   integration will skip this exact workflow-only bootstrap change. A main push can
   trigger Production even when only YAML changes. The review-branch exclusion
   does **not** cover main. Do not assume `[skip ci]` prevents Vercel deployment.
   If no production-safe publication path is verified, stop: bootstrap stays blocked.
3. In a separately reviewed one-file default-branch change, copy
   `docs/examples/review-deploy-default-branch.stub.yml` to the **same path**
   `.github/workflows/review-deploy.yml` on main. Do not merge/cherry-pick this PR or
   any application/backend code into main. No main/settings changes are made here.
   The inert stub has no checkout, secrets, Environment, upload or deployment;
   dispatching its own main version prints a message and fails immediately.
4. Confirm Actions is enabled, the owner can manually run workflows, official
   pinned Actions are allowed, and `review-deploy.yml` is now dispatchable. Its
   full implementation must also exist on `feature/phase2-clean-review` after a
   separately approved integration. The bootstrap and branch version have identical
   input names/types/defaults so the UI/API accepts the same form.
5. Keep `REVIEW_DEPLOY_ENABLED` false and upload gate unchanged until separate
   commissioning/activation approval. Then select **feature/phase2-clean-review**
   in Run workflow (or API `ref`), never main. GitHub runs the branch's full version;
   owner/ref/SHA/confirmation/Environment gates remain unchanged. Dispatch on main
   runs only the fail-closed stub, never privileged deployment logic.

Precise GitHub preconditions: registered default-branch path and dispatch event;
review branch containing the full workflow at the approved source SHA; repository
Actions policy permitting pinned checkout/setup/artifact Actions; owner permissions
to dispatch and approve; protected `review-deploy` Environment restricted to the
review branch with the four Environment secrets; repository enable variable
explicitly approved. The required reviewer must be able to approve (solo-owner
self-review policy must be chosen deliberately). Credentials/environment creation,
bootstrap publication, merging/integration and activation each remain unperformed.

After those separate approvals only, an example dispatch is:

```sh
gh workflow run review-deploy.yml --repo monetcore-dev/monetcore-website \
  --ref feature/phase2-clean-review \
  -f operation=deploy -f candidate_sha=REVIEWED_FULL_SHA \
  -f rollback_release= -f 'confirmation=DEPLOY REVIEWED_FULL_SHA REVIEW ONLY'
```

There is no legitimate way to activate this repository's workflow_dispatch before
the default-branch precondition. This PR supplies the inert template/plan, not a
claim that dispatch already works or permission to publish it to main.

### 5. First controlled dispatch (separate approval required)

Select **Deploy isolated Monetcore review (manual)** → Run workflow, review branch,
operation `deploy`, exact reviewed current branch SHA, empty rollback ID, and
`DEPLOY <sha> REVIEW ONLY`. Approve the protected Environment after checking the
commit/artifact. The build is immutable even if the branch later moves. A missing
gate yields a skipped deploy job, never a successful deployment claim.

The root controller uses fresh ports 4300–4310; the owner-reported existing
3004 listener is verified again from the actual vhost, not hardcoded. It proves a new candidate returns 200 and the exact marker,
checks disabled backend behavior, stores a private config backup/transaction,
changes only the literal review upstream in that same regular file (atomic replace,
mode/group preserved), tests Nginx, gracefully reloads, then
rechecks public HTTPS pages (200), the exact new release marker and API 403. Clear sanitized JSON phases and
final release ID appear in Actions. It preserves all earlier processes/files.
Only the chosen review file is excluded from the other-configuration fingerprint,
not its directory: production/other sites in sites-enabled remain included.
The enabled review file must appear directly and exactly once in Nginx's loaded
configuration; aliases, duplicate loading, unrelated edits and changed directory
entries stop the operation. Backups/transaction files stay in root-only state under
`/srv/monetcore-review-deploy/state`, outside Nginx's include directories. Rollback
restores the same active filename, never a relocated copy.
Only the isolated daemon's PM2 dump is saved; production PM2 state is never touched.

The review site is intentionally public. Automated TLS checks use no credentials
and require 200 for the homepage and other public pages. After switching, the
HTTPS release marker must match the exact new SHA; all checked GET, HEAD, POST,
PUT, PATCH, DELETE and OPTIONS API requests must return 403 for both `/api` and
`/api/…`. Rollback again requires public pages 200 and blocked APIs. No new password
or HTTP 401 expectation is introduced. Owner must also inspect desktop/mobile
rendering/navigation after separately approved live commissioning.

### 6. Rollback

For ordinary switch/test/reload/post-health failure, automatic recovery verifies
backup checksum, unchanged other config files/directories and the same old process
identity before restoring, testing, reloading and rechecking. No old process is
stopped. A failed candidate is removed only from the isolated review PM2 daemon;
its release files remain. An unconfirmed rollback emits **CRITICAL** and keeps both
processes for operator recovery; it never reports success.

Manual rollback uses the **same workflow**, operation `rollback`, empty candidate
SHA, the deployment ID to undo (from its successful log), and
`ROLLBACK <release-id> REVIEW ONLY`. Approve its Environment. It only permits the
currently active deployment and verified prior live process; stale IDs, config
edits, missing backup or restarted/replaced prior process stop it. Do not guess
ports or point at another app. The first rollback to an original pre-automation
process depends on that process still running.

Host power loss, SIGKILL, OOM, certificate expiry, disk failure and simultaneous
administrator changes cannot guarantee automatic recovery. Root-only transaction
and `.nginx` backup survive for reviewed console recovery. Keep the original PM2
release and source intact. After any daemon restart, process identities change and
manual inspection may be required. PM2 dump persistence is review-only; the first
pre-automation process remains managed by its original unchanged mechanism.

No automatic retention cleanup: 12 releases/11 ports cause a safe stop. Owner may
separately approve pruning **only** obsolete review processes/releases after
checking active and rollback targets. Do not delete directories or processes just
to make a failed check pass.

## Verification boundary

Local tests use temporary archives/files and mocked sudo/PM2/Nginx/health calls.
The standalone artifact is built and smoke-tested locally with integrations off.
No actual SSH, privileged installation, Nginx reload, PM2 switch, provider call,
Actions deployment or rollback has been executed on the VPS. Live host layout,
resource capacity, sandbox enforcement, public HTTPS/API blocking, certificates, rollback and
GitHub Environment/default-branch availability require commissioning evidence.
