# Monetcore VPS launch candidate — NOT DEPLOYED

Foundation febe853cc82de7caa277518735b1441c54d5a5ba. Final target is Namecheap Ubuntu + private PostgreSQL + OpenAI. No Supabase SDK/configuration is required. Historical documentation/remote PostgreSQL support is retained; it is not a target deployment dependency. Existing recovery branches and Vercel remain intact.

## Actual readiness
No VPS inventory, SSH access, purchased plan, CPU/RAM, Ubuntu version, existing applications, ports, certificates or backups has been verified in this task. Previous reports of a VPS are historical evidence, not current access. Do not provision, overwrite source or assume any directory/port/account is available. These templates are proposed paths, not a discovered installation.

## One-time approved operator preparation
1. Obtain separate staging/provisioning authorization. Read-only inventory: `lsb_release -ds`, `free -h`, `df -h`, `ss -lntp`, existing systemd/PM2/Nginx and PostgreSQL versions/config paths. Inspect account/path collisions and current source Git status without reading environment values. Preserve VPS-only source/configuration and current releases.
2. Confirm console access and a second SSH session before any SSH/firewall changes. Keep current SSH port; allow that port and HTTP/HTTPS before enabling a firewall. Use key-only SSH after verifying it, prohibit root/password login only with approval and validated recovery. Never expose PostgreSQL or Node ports. Restrict public ingress to SSH/80/443. No automatic firewall/SSH installer is supplied.
3. Install supported Ubuntu PostgreSQL16 and the exact tested Node24 patch from trusted sources after approval; record architecture, checksums and versions. No curl-to-shell installer. Build on matching Linux architecture/libc and Node patch off-server. Do not build on an unverified small VPS.
4. Use separate collision-checked accounts: runtime `monetcore_web`, DB login `monetcore_app`, root-owned releases `/srv/monetcore-production/releases/<release-id>`, root-managed `current` symlink, root-only `/etc/monetcore-production/runtime.env`. No reuse of review accounts/PM2 homes or production source directories. Application gets no sudo/SSH/deployment rights. Preserve old release for rollback. Use staged copies, never git reset/clean of an existing checkout.
5. PostgreSQL: bind only127.0.0.1 (and private Unix socket), use SCRAM host authentication for ONLY monetcore_app/monetcore_db/127.0.0.1/32. Review rule ordering; never use trust or0.0.0.0/0. Local loopback uses SCRAM, not TLS; if DB moves off-host use the strict remote TLS adapter and reapprove configuration. Check database capacity before adjusting connection settings. Each Node process can use5 connections; one supervised process initially.
6. Approved administrator creates a NOINHERIT/NOSUPERUSER/NOCREATEDB/NOCREATEROLE/NOREPLICATION/NOBYPASSRLS login via `createuser --pwprompt` (do not put passwords in commands), owned by a separate admin; create monetcore_db with a non-application owner. Revoke PUBLIC CONNECT/CREATE where appropriate only after checking other users. Application must not own tables/schema/database or inherit privileged memberships.

## Schema and transactions
On NEW EMPTY isolated staging DB: inspect identity, take baseline schema/ACL backup, apply001 then002 as authorized migration owner. On ANY existing DB: never apply001 blindly. Use scripts/staging/postgres-inspection.sql and the booking remediation contract; require compatible types/defaults, valid unique_active_booking_slot(date,time) WHERE status<>'cancelled', constraints, grants and triggers. Stop on drift.002 is apply-once and refuses existing journal without overwriting. monetcore_app must exist before002 or grants will be absent. Enable/verify bookings RLS and journal RLS with correct server policies after approved review;002 enables only journal RLS. Verify inherited/default privileges and policy definitions. No browser database credentials.

Proposed DBA role settings for rehearsal: statement_timeout5s, lock_timeout2s, idle_in_transaction_session_timeout10s; confirm actual operation timings before production approval. The existing7s client timeout alone is not server cancellation. Candidate uses pinned transactions, request advisory locks, slot uniqueness and atomic operation claims. Journal states pending/started/accepted/uncertain govern final outcomes; never assume bookings.status=confirmed means all providers succeeded. Never reset uncertain state by age or automatically resend SMTP. Use docs/booking-production-remediation-phase1.md and scripts/booking/reconciliation-inspection.sql. App needs CONNECT/schemaUSAGE, bookingsSELECT/INSERT/trackingUPDATE, journalSELECT/INSERT/UPDATE; no DELETE,TRUNCATE,DDL or statusUPDATE. Manual retention uses an independently authorized operator. No old customer data migration is authorized.

## Build and install (future operator steps, not executed remotely)
Use a reviewed source snapshot and sanitized environment, with no .env files, provider keys or activation flags in the build environment. Install locked dependencies: `npm ci --no-audit --no-fund`; run checks; build `npm run build` with NODE_ENV=production, all AI/staging activation flags false, no VERCEL/MONETCORE_STAGING/MONETCORE_VPS_REVIEW values. Review and production builds differ (robots headers); never promote a review build as production.

Use standard `next start`, not static export or a custom server: this preserves API routes, Proxy authentication and image handling. No standalone output change is needed. Transfer verified source/config/scripts plus matching production node_modules,public,.next (exclude .next/cache),package.json/package-lock.json,next.config.ts, and record SHA256 of the archive and source snapshot. Include no .env, credentials,logs,customer records,node_modules/.local-pg,test artifacts or .git. Validate dependency tree on the target OS; never copy Windows node_modules. Install to a new root-owned release path; grant runtime write only to its .next/cache (create before starting). Do not npm-install on a running release. Standard next startup's production dependency set must contain next/react/pg/nodemailer/googleapis and required platform binaries.

Configure secrets by a secure root editor outside web/release paths, mode0600. systemd reads EnvironmentFile as root; runtime receives values in process memory, so protect its UID and avoid environment/process dumps. systemd quoting is NOT shell syntax: encode multiline keys safely as supported literal backslash-n and verify parser without printing. Never source untrusted env files.

Runtime names:
- NODE_ENV=production; MONETCORE_VPS_PRODUCTION=true; MONETCORE_VPS_PROXY_VERIFIED=true ONLY after ingress checks.
- MONETCORE_DB_PASSWORD; local host/database/role fixed127.0.0.1/monetcore_db/monetcore_app.
- MONETCORE_EMAIL=hello@monetcore.dev; MONETCORE_EMAIL_PASSWORD; GOOGLE_CALENDAR_ID,GOOGLE_SERVICE_ACCOUNT_EMAIL,GOOGLE_PRIVATE_KEY.
- Existing durable booking/contact limiter: UPSTASH_REDIS_REST_URL,UPSTASH_REDIS_REST_TOKEN,RATE_LIMIT_KEY_SECRET(min32),RATE_LIMIT_REQUIRED=true. Preserve existing provider; no new subscription is provisioned. Nginx limits complement, not replace, this shared limiter. Self-hosted Redis is not an implemented REST replacement.
- AI_ASSISTANT_ENABLED=false,AI_OWNER_TEST_ENABLED=false,STAGING_AI_ASSISTANT_ENABLED=false,AI_ASSISTANT_EMERGENCY_STOP=true.
- STAGING_BOOKING_ENABLED=false;STAGING_CONTACT_ENABLED=false.
- No VERCEL*,MONETCORE_STAGING,MONETCORE_VPS_REVIEW,BOOKING_DATABASE_URL or Supabase variables in production runtime.

Run the provided configuration checker with the proposed service environment; it checks shape only, NOT provider connectivity. Supply the .service.example only after verifying /usr/bin/node,port4400,account/paths and cache permissions. Do not install over any existing unit. Production service is separate from review and does not use PM2 resurrection. Check `systemd-analyze verify` on the actual target; no MemoryMax is assumed or changed. Size a limit from measured RSS, candidate overlap,DB/Nginx/OS consumption, not historical plan data. Restart uses the approved current symlink; keep it root-owned and avoid manually running duplicate Node processes.

## Proxy, HTTPS and pre-cutover test
The Nginx template is deliberately API-blocked. Merge its http-level zones/vhost only after review; preserve all unrelated vhosts. Back up configuration and verify `nginx -t` before any separately authorized reload. Node must remain loopback-only. Overwrite Host/X-Forwarded-Host/X-Forwarded-Proto/X-Forwarded-For, never append untrusted chains. Exact public authority is https://monetcore.dev. Explicit server attestation enables production form origin checks and future owner-only AI authentication without inventing Vercel variables. No inference is enabled. Keep www redirect/certificate handled separately and reject unknown Host values/default-vhost access.

Obtain certificate through separately approved DNS challenge or another validated method BEFORE DNS cutover. A hosts override/`curl --resolve` can test monetcore.dev against the VPS without changing public DNS; run from an authorized owner machine. Verify full certificate chain and HTTPS, homepage,7services,products,prices,privacy,quotation links,booking andcontact pages. APIs must still403 under preparation config. Do not claim emails/calendar/DB tested from page200.

For authorized isolated integration tests, use existing review mode and LOCAL isolated PostgreSQL with dedicated Calendar,approved recipients andRedis; no production credentials. Do not copy customer records. Existing review ingress/API gate must be separately authorized for tests; retain noindex/access protection. Verify one success,incomplete/unknown results,duplicate concurrent requests,lost acknowledgements,Calendar/mail failures,rate-limit outage and manual reconciliation without blind resend. Use mocks for failures first. Review-mode build must not become production artifact.

Production API opening is a separate reviewed Nginx change, exact /api/contact,/api/book,/api/book/availability locations with body/rate/timeouts and identical overwritten headers; all otherAPI remains blocked, especially assistant. Review user consent/privacy wording and Calendar exclusive-use policy before enabling. The application production booking/contact routes have no new launch opt-in, so the proxy403 gate MUST remain until this approval. Never enable review flags to emulate production.

## AI boundary
Existing approved topics, pinned model, structured validation,300-output-token cap,local duplicate/concurrency controls,pricing approval and Basic owner auth remain. New explicit trusted VPS deployment context permits the SAME owner-only control path later, with paid inference still disabled. Never set VERCEL on VPS. Future authorized owner test also requires OPENAI_API_KEY,OPENAI_MODEL,AI_PRICING_APPROVAL,AI_OWNER_PASSWORD_SHA256 and all owner flags, emergency-stopfalse; the preparation unit intentionally refuses enabled flags. Any future activation needs separately reviewed checker/Nginx changes, current pricing/provider privacy verification and owner approval. Local counters reset on restart and do not enforce a permanent20-request or global hard spending cap. OpenAI budgets are not a hard cap. Public paid AI is NOT launch-approved or operationally ready; do not bypass auth.

## Backup and restoration
Before migration: a protected custom-format pg_dump plus schema/ACL/role inventory (role password hashes must never enter repository); encrypt off-host backups with separately configured keys. Supplied backup.sh must run only aspostgres against local socket/private destination, no passwords in command args. It creates one custom dump+SHA256, does not prune or restore. Supplied backup service/timer templates propose daily02:15UTC with15-minute jitter, catch-up on restart and no automatic pruning. Install/enable only after separate authorization, a completed isolated restore rehearsal, monitored exit status and age alerts; choose retention,encrypted off-host destination,RPO/RTO and restoration owner before launch. A listable dump is NOT proof of restore. Rehearse pg_restore into a NEW disposable DB/role with synthetic data,run schema/journal/concurrency tests and compare rowcounts there. Never restore over live data to test backup. Backup covers database, not external mail/events or runtime secrets/certificates; maintain separate protected recovery copies.

## Cutover and rollback
Owner gates: verified VPS inventory/SSH recovery; schema/roles/backups+restore; isolated providers; HTTPS; capacity and latency;security/dependency review; privacy;monitoring and explicit cutover approval. Keep Vercel production serving until all pass. No DNS commands are executed by this work.

For deployment: inventory+preserve source,back up current release/config/DB,build separate candidate,verify checksum,start isolated loopback candidate under a separate approved port/unit,health-test,nginx-test and switch upstream only after approval. Check public route health,headers,assets,form outcomes and API protections. Then stop only the exact obsolete application after stability checks,keeping one previous successful build on disk. Never kill by loose name/port. Do not apply review-controller reconciliation to production.

Failure: restore saved upstream/config and nginx-test before reload;restart verified previous service/release as approved,verify HTTPS. Stop candidate only after old endpoint healthy. Database migration002 is additive: retain journal/evidence on code rollback;no automatic downmigration,booking deletion or provider resend. If previous code lacks reliable outcomes,hold submissions at403 while investigating. After DNS switch, reverting DNS is not instantaneous;keep both origins safe,avoid split-write databases and retain Vercel until agreed TTL/stability window. Any booking history transfer needs explicit data-migration approval and a write-freeze/single-writer plan.

Monitor systemd/journal without bodies/credentials, HTTP5xx/latency,NodeRSS/CPU/event-loop,DB connections/locks/disk,backup freshness/restore tests,pending/uncertain journals and SMTP/Calendar receipts. Use systemctl show(unit MemoryCurrent),journalctl -u(unit) with redaction,free/df/ss/pg_stat_activity metadata; do not dump envs or query text containing customer data. No production activation/monitoring installation occurred.

## Approved-operator command sequence (DO NOT run against an unidentified target)

These commands are a future execution checklist, not authorization. Replace only verified paths/ports, keep a console session, and stop on any mismatch. Obtain separate permission before installation, migration,service changes or live-provider tests.

```sh
# Read-only inventory first; redact operational identifiers before sharing.
lsb_release -ds
free -h
df -h
ss -lntp
node --version
psql --version
# On the matching Linux BUILD machine, clean reviewed snapshot, no env/secrets:
npm ci --no-audit --no-fund
npm run lint
npm run typecheck
npm test
npm run build
```

Build with the sanitized environment described above. The backup/header/API-gate tests and browser suites must also pass; npm test alone does not run browser tests. Record source/archive SHA256. Upload only after authorization using verified SSH host keys to a NEW release directory; never replace an existing source tree or copy environment files into it.

After the DBA verifies a NEW EMPTY staging database and backup/restore plan, the separately authorized migration execution is:

```sh
# Files must be from the reviewed release, not a remote download or old checkout.
# Refuse this sequence if bookings already exists: inspect/adapt first.
sudo -u postgres psql -X --set=ON_ERROR_STOP=1 --dbname=monetcore_db --file=scripts/migrations/001_create_bookings.sql
sudo -u postgres psql -X --set=ON_ERROR_STOP=1 --dbname=monetcore_db --file=scripts/migrations/002_booking_request_journal.sql
```

Confirm preexisting least-privilege role, RLS, ACLs, index validity and timeout settings before application startup. These commands are NOT authorized for an existing/live database by this document. Do not put passwords in SQL/CLI history.

On the verified server, before any start/reload:

```sh
# Actual installed filenames, runtime user, executable paths and unit must match.
systemd-analyze verify /etc/systemd/system/monetcore-web.service
nginx -t
# After approved startup only, confirm loopback listener and inspect no secrets:
curl --fail --max-time 10 http://127.0.0.1:4400/
systemctl show monetcore-web.service -p MainPID -p MemoryCurrent -p ActiveState
```

From an authorized owner computer, use `curl --resolve monetcore.dev:443:<VERIFIED_VPS_IP> https://monetcore.dev/` for pre-DNS HTTPS checks (substitute only the verified IP; do not use insecure TLS flags). Confirm /api and /api/403 while the gate remains closed. No DNS change is needed. Validate new production proxy-origin tests with synthetic bodies and mock providers before authorizing any actual messages. Use a restore drill on a NEW disposable DB before installing/enabling backup.timer; off-host encryption and monitoring remain commissioning tasks.

## Isolation and publication cautions
The approved local adapter fixes database name/role/port. Therefore a staging test must use a separate verified host or isolated network namespace/cluster presenting localhost5432, not the same production database under a staging flag. If that isolation cannot be established, STOP before connection. Do not overwrite or reuse an existing monetcore_db based solely on its name. Any configurable local endpoint change needs its own reviewed code/test change.

This new prep branch is not automatically covered by earlier Vercel recovery/remediation exclusions. Do not push until the owner verifies an exact branch exclusion and all repository/external deployment triggers. No publication/PR/commit is authorized by local validation. Deployment-controller/review workflows were not changed or dispatched.
