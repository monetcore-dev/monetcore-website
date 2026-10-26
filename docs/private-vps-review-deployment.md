# Private Monetcore 2.0 review deployment

## Status and scope

Application source is pinned to **a1ca9ad6286e9c05b2271f7365acd3e753b33fb4**, branch `feature/monetcore-2-customer-foundation`. It includes Phase 1 and Phase 2. Deployment tooling may be a later commit; the tool always checks out the approved application commit, not the latest moving branch head.

There is no configured VPS/SSH identity or TCP access in the Codex environment. No live port, PM2 process, Nginx vhost, TLS certificate, Basic Authentication or deployment has been inspected here. `https://review.monetcore.dev` is the **target**, not a newly verified/deployed preview. Production `https://monetcore.dev` remains untouched on Vercel.

The owner authorizes a reversible private visual review update only. This guide does not authorize customer database creation/migration, registration, authentication emails, contact/booking activation, AI inference, payments or agents. No migration or provider test is performed by the tool. Disabled customer pages show an unavailable state; they are not a functioning dashboard preview.

## Tool behavior and safety limits

`python3 scripts/vps/private_review.py --help`

Actions:

- `inspect`: validates the current Node24 runtime, existing same-account PM2 daemon, effective dedicated Nginx review file, current upstream, and displays sanitized process/port information. It does not print PM2 environment data, raw `nginx -T`, password files or keys. It refuses to start a new PM2 daemon accidentally.
- `prepare`: creates a new private release directory, clones the fixed repository and commit, runs `npm ci`, then the existing clean-environment TypeScript/tests/offline/lint/build runner. It writes a release marker, build/runtime manifest and a flags-off launcher. No existing release or private environment file is read, copied or overwritten. Build output stays in a private `.private-review-build.log`.
- `deploy`: inspects existing infrastructure, verifies HTTPS and existing Basic Authentication using credentials entered interactively (not stored), prepares or accepts a prepared release, checks a free candidate port and rollback process ownership, then starts a uniquely named loopback-only candidate. It verifies all 22 public page routes, disabled customer routes, API guards and robots. Only then does it prompt for an exact switch confirmation.
- `rollback`: restores the exact backed-up review configuration only if its digest and the current configuration match the expected state, and the original process PID/cwd/port still match. It tests/reloads Nginx and rechecks private/authenticated health. It never overwrites an unrelated later configuration change.

The tool preserves the old PM2 process and running release. It never runs `pm2 save`, changes startup persistence, stops unrelated processes, restarts Nginx/PM2, changes DNS/Vercel or edits database infrastructure. A review-only Nginx graceful reload is part of the explicitly confirmed switch/rollback. If new health/auth checks fail, it automatically attempts to restore the previous upstream; both processes remain for investigation. If rollback cannot be verified, it reports a critical stop and preserves evidence rather than claiming recovery.

### Supported Nginx layout — conservative by design

The configured file must be the real regular file under `/etc/nginx/sites-available/` or `/etc/nginx/conf.d/`, included in the effective configuration, with **one dedicated HTTPS server for review.monetcore.dev only**. It must contain one protected `location /`, a literal `proxy_pass http://127.0.0.1:PORT;`, explicit Basic Authentication/password-file path, certificate directives, and these overwritten headers in that location:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $remote_addr;
```

Only explicit TLS-only includes are accepted. Auth-off/satisfy-any, rewrites, extra locations, mixed production/review files, multiple server blocks, variables in upstreams, symlink targets and unknown ownership are stop conditions. An existing HTTP-to-HTTPS redirect may live in a separate unchanged file. Do not replace a working vhost merely to satisfy the parser: if the actual layout differs, stop for a narrowly reviewed adaptation based on sanitized configuration. Historical ports3000/3001 are not assumed available.

Before switching, the tool backs up the exact review file and metadata to a private0700 state directory with0600 files. The upstream replacement is installed to a unique temporary file in the same Nginx directory and atomically renamed; TLS/auth/header settings remain unchanged. Certificate private keys and password-file contents are never opened. Noninteractive sudo privileges for `nginx -T/-t`, installing/renaming the reviewed configuration and `systemctl reload nginx` must already be authorized. The tool does not change sudoers.

## Exact operator steps

Run as the **existing non-root PM2 application account**, from an interactive SSH terminal. Do not run source builds as root. Do not paste passwords or application environment values into chat, scripts, command arguments or this JSON configuration.

### 1. Obtain tooling and create non-secret configuration

Use a new tooling checkout, not the running application directory:

```bash
git clone --branch feature/monetcore-2-customer-foundation --single-branch \
  https://github.com/monetcore-dev/monetcore-website.git \
  "$HOME/monetcore-review-tooling"
cd "$HOME/monetcore-review-tooling"
install -m 600 scripts/vps/private-review.config.example.json \
  "$HOME/monetcore-review.config.json"
nano "$HOME/monetcore-review.config.json"
```

Fill the actual application-account paths, real dedicated Nginx file and existing PM2 home. These are operational identifiers, not credentials. Set release/state roots to new private directories owned by the app account; keep them outside the web root and outside the currently running release. Initially leave `previous_process_name` and `candidate_port` null.

```bash
python3 scripts/vps/private_review.py inspect \
  --config "$HOME/monetcore-review.config.json"
```

Inspect the sanitized process list and listener ownership. Update the configuration with the actual online rollback process name and a different, verified unused unprivileged port. The script rechecks availability before starting and verifies the old port belongs to that PM2 process (or its child). It refuses a missing/wrong-account/root PM2 daemon rather than changing process ownership or creating a competing daemon. Actual PM2 installation/version and sudo permissions remain VPS verification requirements.

### 2. Prefer an external compatible Linux build host

The small VPS must retain its existing review process for rollback. `prepare` requires at least1.5GiB currently available memory; candidate startup requires at least768MiB available. These checks and a768M PM2 memory-restart threshold reduce risk; they do not prove total host capacity or replace RSS/CPU measurements. No swap or resource upgrades are provisioned.

On a Linux/glibc build machine with Node24 and Python3/git, use the same tooling checkout and a local configuration whose `release_root` is a new private local path. The Nginx/PM2 paths in that **build-only** configuration are syntactically valid placeholders and are never accessed by `prepare`.

```bash
python3 scripts/vps/private_review.py prepare \
  --config /absolute/private/build-only.config.json
```

The output gives the exact prepared directory and source commit. Preserve the entire private release, including `.git`, `.next`, `public`, `node_modules`, hidden prepared manifest and launcher. Do not publish it in a public repository/release asset. Transfer it privately using your approved SSH channel, for example:

```bash
rsync -a --protect-args -e ssh \
  /absolute/prepared/review-DIRECTORY/ \
  APP_USER@VPS_HOST:/absolute/release_root/review-DIRECTORY/
```

The root on the VPS must match `release_root` in its private configuration. Confirm ownership and private parent-directory permissions. Never copy `.env` or booking/production credentials into this visual release. Verify the transfer/archive checksum through your authenticated channel if using a packaged transfer. The manifest is an integrity aid, not a signature against a compromised application account.

Native runtime must match Linux architecture, use Node24 no older than the tested build, and have glibc at least as new as the build host. An arbitrary workspace build is not automatically portable to Ubuntu24.04. The tool rejects incompatible manifests. A Debian12/glibc2.36 build is suitable for later glibc versions such as Ubuntu24.04/glibc2.39, subject to actual host validation. Do not silently upgrade Node or system libraries to force compatibility.

### 3. Stage, verify and explicitly switch only the review upstream

On the VPS:

```bash
cd "$HOME/monetcore-review-tooling"
python3 scripts/vps/private_review.py deploy \
  --config "$HOME/monetcore-review.config.json" \
  --release /absolute/release_root/review-DIRECTORY
```

Without `--release`, the tool builds a new release on that host only if memory/runtime checks pass. External building is preferred. It prompts for the existing review Basic username/password locally. It does not store them or create new authentication credentials.

Before switching, it checks the new loopback app independently, unique commit/build/release marker, disabled controls, process ownership and current configuration digest. It then asks for:

```text
SWITCH REVIEW a1ca9ad6286e ACTUAL_CANDIDATE_PORT
```

Declining leaves Nginx unchanged and removes only the tool-created candidate process. On success, record the returned unique PM2 name, actual port and private state-file location. The old process remains running; startup persistence is deliberately unchanged. Do not remove the previous release or save a new PM2 startup state until the owner has accepted the review and recovery procedure separately.

### 4. Browser review after a successful actual switch

Open `https://review.monetcore.dev` in a private/incognito browser:

- Without credentials: every review page/assets/API must require Basic Authentication. Do not expose it publicly to simplify testing.
- With the existing credentials: review corporate hero, animated core/pause/reduced motion, dropdowns/keyboard/mobile menu, capabilities, all services/products/demos, packages, privacy, contact and booking interfaces.
- Check320/360/375/390/430px plus tablet/desktop. Check overflow, console/hydration errors and keyboard focus. External WhatsApp/email/telephone links contact Monetcore directly; do not use them for automated test submissions.
- The contact/booking forms remain preview-disabled, and customer pages show unavailable/disabled messaging. Do not claim these pages are functioning staging integrations. No customer registration or dashboard records should be exposed.
- Verify the protected release marker `https://review.monetcore.dev/__monetcore_review_release.json` reports the exact approved source commit. Do not bypass Basic auth to view it.

## Immediate rollback

If visual or functional problems appear after a successful switch:

```bash
python3 scripts/vps/private_review.py rollback \
  --config "$HOME/monetcore-review.config.json" \
  --state /absolute/private-review-state/switch-ID/state.json
```

Re-enter the review credentials locally and confirm `ROLLBACK REVIEW OLD_PORT`. The tool verifies backup digest, previous PID/cwd/online state and loopback ownership before restoring the exact old file, testing Nginx and reloading. Both PM2 processes remain. An externally edited configuration, missing/rotated old process, failed TLS/auth check or failed reload is a hard stop requiring operator inspection; do not force overwrite or stop processes to hide it. Power loss/SIGKILL can interrupt automatic recovery: use the private state/backup and reviewed command afterward; do not assume rollback completed.

## Later customer staging checklist — NOT authorized now

See `docs/customer-platform-foundation.md` and the metadata-only `scripts/staging/customer-inspection.sql`. Before any separate approval:

1. Approve a new `monetcore_customer_staging` database, backup ownership and tested recovery. Do not reuse `monetcore_db` or import customer records.
2. Review migration003, dedicated NOLOGIN authentication/runtime roles, non-owner/non-BYPASSRLS grants, forced tenant RLS, active membership revocation, constraints and idempotency indexes.
3. Approve private separate credentials, LOGIN activation, local-only PostgreSQL access and connection limits (new pools max3+3 per process; booking pool unchanged).
4. Approve manual migration execution and metadata checks. Populated rollback refuses deletion; use reviewed recovery, not destructive cleanup.
5. Approve account/project/audit retention, customer privacy notices, email sender and synthetic recipient list. No provider/transfer assurance is invented.
6. Separately authorize replacing/reconfiguring the visual-only process for customer tests. Its launcher deliberately cannot enable integrations merely by setting parent environment flags; no bypass is provided here.
7. Only then test synthetic registration, verification, login, session expiration/revocation, organization assignment, dashboard, request/history, cross-tenant denial, reset, deactivation and audit logs. Confirm delivery to approved test recipients, never real customers. Disable afterward.

All three customer controls remain false, along with booking/contact/AI controls, for this initial preview. Existing secrets, integrations and booking data are preserved by not loading them into the visual process and not editing the previous runtime/configuration.

## Executed local verification — 2026-10-26

- Source commit cloned and checked: `a1ca9ad6286e9c05b2271f7365acd3e753b33fb4`; source branch retained for the existing offline-check runner.
- `npm ci`, TypeScript, ESLint and optimized Next16.4.3 build passed. 70 automated tests and nine offline staging checks passed.
- 27 Python deployment-tool tests passed using disposable files and simulated PM2/Nginx commands. Coverage includes private routing/forwarded-header validation, occupied ports, wrong process ownership, low memory, disabled API health, corrupted artifacts, cancelled confirmation, concurrent config edits, nginx-test failure, authentication regression, automatic/manual rollback, rotated old processes and unconfirmed recovery. These are NOT tests against real VPS PM2/Nginx.
- Actual local Node24.19.0 launcher/HTTP checks passed: all22 corporate routes, four disabled customer pages, disabled contact/booking/customer/assistant APIs, noindex robots and unique commit/build/release marker.
- Existing Chromium route/homepage/AI Core suites passed on the prepared build: internal links, desktop/mobile menu behavior, responsive widths, keyboard/touch controls, pause/reduced motion, planner/demo interactions, axe scans and no browser exceptions. Physical Android/iPhone devices were not tested.
- An initial native workspace build used glibc2.41 and is not the selected Ubuntu-transfer artifact. The selected build used official Node24.19.0 Debian12/glibc2.36 x64 image digest `sha256:4196d66a565c6f195728d9952f161f4adfe2ad753052a08b7ec7f1c5a6bda42b`, compatible in libc direction with Ubuntu24.04/glibc2.39. The actual VPS Node/architecture/glibc still must pass the tool's runtime check.
- Selected local release: `/workspace/artifacts/monetcore-private-review-compatible/releases/review-a1ca9ad6286e-c5dc820e`. It is a private prepared directory, not a deployed site or public GitHub attachment. Its generated metadata/marker include a unique build/release identity so a stale same-commit upstream cannot masquerade as the newly verified candidate.

The container was removed after building. The local preview process was used only for checks and stopped afterward. No VPS access, Basic Authentication credentials, real SMTP, Calendar, Redis, OpenAI, customer database, DNS or Vercel settings were used or changed. Existing live release, process name, port and upstream remain unknown until actual `inspect` runs on the VPS. Stop before any switch if they cannot be verified.

Before the final switch, the operator must confirm there are no unrelated pending Nginx changes that a global graceful reload would activate. The tool hashes effective non-review configuration and refuses changes detected during switching/recovery; `nginx -T` reads disk and cannot prove every currently running worker has the same historical disk configuration. Unknown/pending unrelated changes require a stop, not a forced reload.
