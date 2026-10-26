# VPS PostgreSQL booking completion

## Source and boundaries

Source of truth: uploaded monetcore-vps-source.zip. Windows ZIP paths were normalized
without replacing source with GitHub history. Original ZIP and a local Git baseline
are preserved; work is in /workspace/monetcore-vps-source on
feature/monetcore-vps-staging. No remote is configured for this snapshot. No VPS,
Vercel, Nginx, PM2, DNS, actual database, Calendar or mailbox was accessed/modified.

The local baseline commit only records the uploaded source. Implementation changes
are not pushed. Do not pull an old GitHub branch over the live VPS work. The source
fingerprint verifier detects modifications to original files; separately review
additional/untracked VPS files, which are not silently discarded by deployment.

## Completed code

- Preserve pg-based create/availability/tracking repositories. Remove the unused
  Supabase import, factory, SDK and mocks. No remaining dependency versions were
  upgraded. Privacy/demo copy now names PostgreSQL rather than Supabase.
- Localhost-only pool: monetcore_db / monetcore_app /127.0.0.1:5432, max5 connections
  PER process, bounded connect/query/statement waits and sanitized idle errors.
  Guard checks run before a cached pool is returned; Vercel cannot use this pool.
- Parameterized SQL and whitelisted tracking columns. Missing INSERT result or
  zero-row tracking UPDATE is an error, not a false confirmation.
- Atomic INSERT/autocommit reserves a slot before external work. Exact PostgreSQL
  23505 + unique_active_booking_slot yields409; unrelated DB errors stay500. A lost
  commit acknowledgement returns unknown; it must not be blindly retried.
- Keep durable shared limiter required for both staging booking/availability AND
  staging contact. Redis outage/malformed results fail closed; no configured-backend
  error falls back to memory. Existing production behavior is not changed by this.
- VPS activation requires all three server markers, production Node mode and no
  Vercel metadata. Any partial VPS marker remains review/blocked, not production.
- Require expected database name, expected Calendar/service account, exclusive
  calendar acknowledgement, SMTP sender lock and explicit customer-email allowlist.
  Admin notifications stay hello@monetcore.dev, messages labelled STAGING TEST,
  events deterministic from reservation UUID with no invitations/sendUpdates none.
- Preserve partial outcomes, tracking-error logging and no automatic SMTP resend.
  Slot rows are never removed on Calendar/email/tracking failure.
- Verified VPS proxy resolver handles Next internal request URLs while retaining
  exact https://review.monetcore.dev Origin and rejecting missing/mismatched origins,
  host/protocol lists and spoofed metadata. No Vercel guards were relaxed.
- typecheck now generates ignored Next route/LayoutProps types before tsc, so it
  works in a clean checkout. Offline staging runner targets the VPS branch.

## Configuration — names only, no secrets

Keep STAGING_BOOKING_ENABLED, STAGING_CONTACT_ENABLED and ALL AI activation flags
absent/false for release preparation. AI remains disabled on the VPS by the existing
Vercel-only owner-test guard; portable/public AI activation is NOT in this task.

For the private review runtime (not for unit-test/build processes):

- MONETCORE_STAGING=true; MONETCORE_VPS_REVIEW=true; NODE_ENV=production.
- MONETCORE_VPS_PROXY_VERIFIED=true ONLY after verifying the ingress below. This is
  a new explicit deployment attestation, not a header supplied by visitors.
- MONETCORE_DB_PASSWORD: existing role password, supplied securely at runtime.
- STAGING_BOOKING_EXPECTED_DATABASE=monetcore_db (new explicit staging resource check).
- GOOGLE_CALENDAR_ID; STAGING_BOOKING_EXPECTED_CALENDAR_ID.
- GOOGLE_SERVICE_ACCOUNT_EMAIL; STAGING_BOOKING_EXPECTED_SERVICE_ACCOUNT_EMAIL;
  GOOGLE_PRIVATE_KEY (literal backslash-n supported).
- STAGING_BOOKING_CALENDAR_EXCLUSIVE=true only when the dedicated calendar really
  is exclusive to this system. Availability is database-based, NOT Google FreeBusy;
  manually-added calendar events would not block slots.
- STAGING_BOOKING_TEST_EMAILS: explicit approved addresses, preferably only
  hello@monetcore.dev for the first owner test; never wildcards/customer lists.
- MONETCORE_EMAIL=hello@monetcore.dev; MONETCORE_EMAIL_PASSWORD.
- UPSTASH_REDIS_REST_URL; UPSTASH_REDIS_REST_TOKEN; RATE_LIMIT_KEY_SECRET (>=32 chars).
  Use the existing approved staging backend; do not provision or switch live resources.

Never configure VERCEL, VERCEL_ENV or VERCEL_GIT_COMMIT_REF on the VPS. Their presence
blocks activation and DB access. A staging flag alone can never enable Vercel preview.
Actual expected Calendar/account/Redis isolation has not been inspected here; owner
must verify distinct staging resources privately, not simply copy production IDs.
The fixed database name/role must refer ONLY to staging in this VPS deployment.

## Database contract/security

001_create_bookings.sql is preserved unchanged. It creates UUID/defaults, WAT/date/
time/status constraints and partial unique(date,time) WHERE status<>'cancelled'.
All supported appointments fit inside the hourly slot spacing; this is exact-slot
protection, not a generic arbitrary-duration overlap constraint. Cancelled slots
can be reused; confirmed also denotes the internal slot claim when notifications
are incomplete. API outcome/tracking flags, not row status alone, show completion.

Do NOT rerun001 against the existing VPS table. No production data import is needed.
Run metadata-only postgres-inspection.sql first. Check every column/type/default,
constraints and index valid/ready state against001. If a unique index is absent or
incompatible, STOP and request a reviewed migration; do not delete duplicates or
replace indexes blindly. There is no automatic schema/index rewrite in this work.

002_booking_app_permissions.sql is a separately approved, transactional, rerunnable
least-privilege grant proposal. It refuses wrong DB, missing/privileged/member role
or application-owned table. It changes permissions only: app can insert reservation
columns, select only ID/type/date/time/status and update only tracking columns.
No app DELETE/TRUNCATE/status change/schema CREATE or general PII SELECT. UUID uses
core PG16 gen_random_uuid; no extension or sequence permission is required.

RLS is not added/disabled. A private server-only app role plus restricted grants is
not Supabase's public-client RLS model. If existing RLS/policies deny access, ownership
or inheritance differs, stop for review. If app owns the DB/schema, review that too;
the permission script does not silently transfer ownership or alter role passwords.
Use SCRAM authentication, listen only on loopback, narrow pg_hba rules, private runtime
secrets and no public5432 firewall exposure. No application DB password is logged.

External effects are deliberately outside a long-lived DB transaction. PostgreSQL
and Calendar/SMTP cannot commit atomically together. Deterministic Calendar IDs help
manual reconciliation; they do not guarantee automatic recovery. SMTP acceptance
is not inbox delivery. Unknown commit/delivery or reserved_incomplete must be
reconciled by an authorized operator; do not resubmit/send again automatically.

## Private Nginx boundary — verify, do not automatically install/reload

This implementation assumes a dedicated trusted VPS, no untrusted local tenants,
Node bound127.0.0.1 and Nginx as the only external ingress. Protect review with
existing Basic auth/access controls, HTTPS certificate, exact server_name and
firewall. Review and preserve current configuration; do not replace it wholesale.
Required equivalent headers in the existing review location:

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $remote_addr;
```

Do NOT append untrusted incoming X-Forwarded-For chains. If another proxy is in front,
configure/verify trusted real-IP handling first. Generic flags do not establish
network trust by themselves. If upstream is public or local users are untrusted,
this attestation is insufficient: keep activation off and design authenticated
proxy transport separately. Do not weaken origin checks to bypass an ingress issue.
No HTTPS verification bypass, Nginx edit/reload or PM2 restart is performed here.

## Exact operator preparation commands — no live changes until approval

Paths and process name were not supplied; set them to the actual verified values.
Do not guess a PM2 name or restart another app. Keep the old working directory intact.
Commands below prepare a NEW release and inspect metadata; none activates flags.

1. On the VPS inspect and preserve current work, without printing env/secrets:

```bash
VPS_SOURCE=/absolute/path/to/current/monetcore-website
cd "$VPS_SOURCE"
pwd
git branch --show-current
git status --short
node --version
```

The branch must be feature/monetcore-vps-staging. If newer changes exist than the
uploaded snapshot, preserve them and stop for reconciliation. Do not git reset,
git clean, checkout over changes, git pull or overwrite this directory.

2. Upload the completed SOURCE ZIP/patch via your authorized private channel; use
   a fresh release directory outside the running directory (not the old PR8 artifact).
   Keep runtime secrets outside the source ZIP. Example commands AFTER path review:

```bash
RELEASE_DIR=/absolute/path/to/releases/monetcore-vps-pg-review
SOURCE_ZIP=/absolute/path/to/monetcore-vps-staging-completed-source.zip
mkdir "$RELEASE_DIR"
unzip -q "$SOURCE_ZIP" -d "$RELEASE_DIR"
cd "$RELEASE_DIR"
node scripts/vps/verify-source-baseline.mjs "$VPS_SOURCE"
```

If the read-only baseline check fails, stop. It never modifies the live source.
Inspect additional/untracked VPS files separately; refresh the archive if relevant.
If using the PATCH instead, first copy the original source to a new directory,
exclude secrets/generated files and use git apply --check before git apply there.
Never apply the patch directly to the running tree.

3. Initialize only the NEW source release's local branch for the offline guard and
   install/verify with a secret-free child environment:

```bash
cd "$RELEASE_DIR"
git init --initial-branch=feature/monetcore-vps-staging
npm ci
node scripts/vps/check-release.mjs
```

check-release rejects .env files, runs typecheck/test/offline staging tests/lint and
build, strips business credentials/staging activation from child test environments,
and builds with generic review markers plus integration flags FALSE. No runtime
settings are edited. Do not run a live PM2 process or attach secrets during build.
Review builds must keep noindex/robots/sitemap safeguards. Do not deploy this branch
to Vercel; its booking workflow now targets the VPS-only PostgreSQL repository.

4. Verify the ACTUAL database manually using metadata only (no booking rows):

```bash
cd "$RELEASE_DIR"
sudo -u postgres psql -X -v ON_ERROR_STOP=1 --dbname=monetcore_db \
  --file=scripts/staging/postgres-inspection.sql
psql -X -h 127.0.0.1 -U monetcore_app -d monetcore_db -W \
  -c 'SELECT current_database(), current_user, version();'
```

The latter prompts privately; never put a password in the command line or chat.
Compare metadata and least privileges. Do NOT execute001 on an existing table.
Only after explicit schema/permission approval, and only for the confirmed staging
DB, apply the proposed grants manually:

```bash
sudo -u postgres psql -X -v ON_ERROR_STOP=1 --dbname=monetcore_db \
  --file=scripts/migrations/002_booking_app_permissions.sql
```

Do not run that optional command until its privilege effects are approved.

5. STOP BEFORE LIVE DEPLOYMENT. Keep all integration activation flags off. Reuse
   existing private runtime configuration through the approved PM2 deployment
   mechanism; do not copy secrets into Git or emit pm2 env output. Record old root,
   process name and working rollback config. Verify intended cwd, loopback port,
   review markers, disabled flags, TLS/headers and private access controls.

After separately approved release switching, run only the existing review process
reload command appropriate to its verified config (not provided/guessed here).
`sudo nginx -t` can validate current config; any reload remains a separate approved
action. Rehearse root/config rollback. Never restart/disable production Vercel,
change DNS, point at production data or activate AI as part of these commands.

6. First post-deployment smoke check must find pages working/noindex and booking,
   availability and contact blocked403 while flags are off. A later owner-approved
   isolated integration test can check PostgreSQL insertion, one Calendar event,
   approved inbox acceptance, duplicate409 and partial202/unknown recovery. Those
   are REAL writes/emails and are NOT part of this automated verification.

## Local verification and limits

Local tests use synthetic data/mocks only for SMTP/Google/Redis and no OpenAI calls.
The separate real-SQL test uses a new PostgreSQL16 Docker cluster, no network/ports,
a private /tmp Unix socket and mandatory disposable cluster marker/empty-table check.
Actual repository SQL runs through pg; production pool configuration is tested
separately with a fake driver. No actual VPS password/TCP authentication was tested.
The permissions proposal was applied/reapplied only in that disposable DB and
retained its synthetic rows. The original schema was not changed or replayed live.

Remaining blockers for live testing: actual VPS schema/grants/RLS/role ownership;
SCRAM/pg_hba/password and bind/firewall verification; Nginx access/headers; approved
staging Calendar/service account/mailbox/Redis resource isolation; runtime configuration
(including the two new DB/proxy attestations); PostgreSQL backups/recovery and private
manual retention operations; PM2 config/cwd/rollback approval. No paid infrastructure
was provisioned and no application activation flag was enabled outside synthetic tests.

## Executed final results

- npm run typecheck: PASS (includes next typegen).
- npm test: 55 passed, 0 failed.
- npm run test:staging:local: 9 passed, 0 failed; network sockets blocked.
- npm run lint: PASS, no warnings.
- npm run build: PASS, optimized review build, integration activation flags false.
- Disposable PostgreSQL16.15:12 real-SQL checks passed; eight racing inserts had one
  winner; grants rerun succeeded and all4 synthetic rows remained; metadata audit ran.
- The disposable container/volume was removed. No actual VPS DB was contacted.

Verdict: code/local verification complete; actual VPS deployment/integration tests
remain NO-GO until the manual blockers above are approved/verified. No integration
flags, live configuration, PM2, Nginx, production DNS or Vercel state were changed.
