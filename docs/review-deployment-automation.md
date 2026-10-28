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
SHA. Inspect the *actual* review site/upstream; do not assume 3003 or 3004. Confirm
no unrelated Nginx edits are pending on disk: a global graceful reload can load
them even when this tool changes only review routing.

Require Ubuntu 24.04 Linux x64, root-owned Node 24.19.0 or newer 24.x at
`/usr/bin/node`, root-owned PM2 at `/usr/local/bin/pm2`, Python 3, `ss`, systemd,
Nginx and a valid review TLS certificate. Do not upgrade/replace production binaries
to satisfy this. If paths differ, stop for a reviewed path adjustment. Require at
least 768 MiB available RAM and ~1.7 GiB disk headroom before each deployment.
Two review releases run concurrently during a switch; assess actual resource use.

The supported review file is intentionally narrow: a **dedicated, root-owned
regular file** in `/etc/nginx/sites-available` or `/etc/nginx/conf.d`, containing
one HTTPS server for exactly `review.monetcore.dev`, explicit Basic authentication,
existing certificates, one `/` proxy and exactly these API locations:

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
Multi-server/HTTP redirects should stay in a separate existing file. Complex
includes, auth changes, rewrites or extra locations require separate review; the
controller stops rather than guessing. API blocks and authentication must already
be verified before this automation can run. It never reads password/certificate
private-key contents.

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

Set `nginx_site` in the private root-only JSON to the verified review-only file.
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

GitHub requires a workflow_dispatch workflow to exist on the default branch before
it can be dispatched. If this workflow is not there, stop: separately approve how
to make its definition available. This task does not merge into/change main or the
default branch. Never use a write-token workaround. Dispatch must still select
`feature/phase2-clean-review`, not default/main or this automation proposal branch.

### 5. First controlled dispatch (separate approval required)

Select **Deploy isolated Monetcore review (manual)** → Run workflow, review branch,
operation `deploy`, exact reviewed current branch SHA, empty rollback ID, and
`DEPLOY <sha> REVIEW ONLY`. Approve the protected Environment after checking the
commit/artifact. The build is immutable even if the branch later moves. A missing
gate yields a skipped deploy job, never a successful deployment claim.

The root controller uses fresh ports 4300–4310; existing 3003/3004 is only observed
from the actual vhost. It proves a new candidate returns 200 and the exact marker,
checks disabled backend behavior, stores a private config backup/transaction,
changes only the literal review upstream, tests Nginx, gracefully reloads, then
rechecks HTTP health, TLS/Basic gate and API 403. Clear sanitized JSON phases and
final release ID appear in Actions. It preserves all earlier processes/files.
Only the isolated daemon's PM2 dump is saved; production PM2 state is never touched.

No successful claim is made for authenticated browser rendering through Nginx:
automated TLS checks intentionally send no Basic password and expect 401; candidate
pages/marker are tested directly on loopback. Owner must also inspect the protected
review homepage/navigation/contact/booking on desktop/mobile after commissioning.

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
resource capacity, sandbox enforcement, Basic auth, certificates, rollback and
GitHub Environment/default-branch availability require commissioning evidence.
