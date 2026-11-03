# Contact and quotation candidate — no live activation performed

Foundation: b9894ef3ef271d2a36dce70361bbfc37007d81cd. Premium hero, navigation,
pricing, booking, AI and review behavior are preserved. This candidate restores
existing enquiry forms only under a separate explicit contact gate. No credentials
are in source. No customer acknowledgement email is sent; business notifications
are pinned to hello@monetcore.dev, including the SMTP envelope.

## Architecture and truthful results

The existing POST /api/contact validates bounded JSON, honeypot, minimum dwell time,
email/field lengths and quotation package consent. Production additionally requires
exact HTTPS origin/Host and verified proxy metadata, plus a single valid X-Real-IP.
It accepts internal localhost or public-host HTTP/HTTPS URLs behind TLS termination only
when the proxy attestation is set. Nginx MUST overwrite Host, X-Real-IP,
X-Forwarded-Proto and X-Forwarded-Host, and application ports MUST be loopback-only.
Do not append/trust client-supplied real-IP or forwarded-host values.

A dedicated local PostgreSQL role/schema saves each enquiry and its pending
notification before returning202 outcome=received. This acknowledges durable receipt,
not SMTP/inbox delivery, quotation approval or an appointment. Failure before or
at an uncertain COMMIT never produces success. Browser unknown/network/malformed
responses lock resubmission and show a reference with WhatsApp/email fallback.
The request reference is page-memory only; reloading loses it. Do not instruct
visitors to reload/retry an unknown submission. Identical normalized payloads with
new IDs deduplicate for10minutes; same-ID replay survives restart and remains bound
to its original payload until authorized retention deletion. SMTP Message-ID aids
investigation but is not a promise of provider deduplication.

One pinned transaction serializes UUID/payload identities, applies persistent
fixed-window limits (10valid requests/IP/10minutes and100global/hour), and commits
record+request alias together. Replays consume rate admission. Counters contain
keyed IP digests, not raw IPs. Fixed windows allow boundary bursts; they are not
rolling-window limits. Invalid traffic also needs the scoped Nginx limit below.
A database outage is fail-closed. No Redis, Upstash or booking DB helper is used.
The HMAC key is purpose-separated for payload/IP hashes; preserve it across deploys.
Rotation changes dedupe identities and must be planned with idempotency recovery.

A separate one-shot worker processes at most10due notifications, using atomic
SKIP LOCKED claims. Before any SMTP call it persists started. SMTP accepted is
recorded only after fixed-recipient acceptance. Known pre-message failures/rejections
retry with bounded exponential delay, at most5attempts. DATA/transport uncertainty,
interrupted started attempts (>2minutes) and receipt-write failures never auto-resend.
They remain uncertain for operator reconciliation. Failed/uncertain counts make the
worker fail visibly. Monitor service failures and pending backlog; acceptance does
not prove inbox delivery. Never reset uncertain->pending merely to clear an alert.

## Environment and credentials (names only)

Build: NODE_ENV=production, MONETCORE_PRODUCTION_ARTIFACT=true,
MONETCORE_PUBLIC_LAUNCH=true. Contact pages are dynamic so runtime disabled mode
actually restores contact alternatives. A build requires no provider credentials.

Runtime contact gate (default disabled): MONETCORE_CONTACT_ENABLED=true and
MONETCORE_CONTACT_PROXY_VERIFIED=true, with production public-launch mode.
Any Vercel or review markers prevent this gate. Booking/AI guards stay enabled.

Web-only secrets: MONETCORE_ENQUIRY_DB_PASSWORD and
MONETCORE_ENQUIRY_RATE_SECRET (random >=32characters).
Worker-only secrets: MONETCORE_ENQUIRY_DB_PASSWORD and MONETCORE_EMAIL_PASSWORD.
MONETCORE_EMAIL is fixed by the worker launcher to hello@monetcore.dev.
The new launcher reads systemd LoadCredential files only, not arbitrary inherited
password variables. It removes other environment variables, including booking and
AI credentials. It never places secrets in NEXT_PUBLIC variables, release markers,
logs or browser props. Do not configure the old b989 launcher with these secrets;
it intentionally strips them and has no contact activation path.

On the VPS only after separate setup approval, root prepares /etc/monetcore/enquiries
(mode0700), with mode0600 files db-password, rate-secret and smtp-password.
Systemd maps them to enquiry-db-password, enquiry-rate-secret or enquiry-smtp-password
inside the unit's CREDENTIALS_DIRECTORY. Never pass passwords in shell command lines,
Git, release archives or chat. Use a private editor/credential-management mechanism.

## Database preparation — NOT authorized/applied by implementation

Target is127.0.0.1:5432, monetcore_db, dedicated role monetcore_enquiries, max3connections
per web/worker process. Existing booking role/tables are untouched. A separately
approved owner must first verify schema metadata, pg_hba, role privileges and backup
restoration. Database must remain local; no remote connection-string override exists.

Create the dedicated login as database owner, without elevated privileges, then set
its password through psql's interactive prompt (never a literal in committed SQL):

```sql
CREATE ROLE monetcore_enquiries LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS;
```

```text
\password monetcore_enquiries
```

Verify it has no memberships or existing schema/object ownership. Inspect existing
PUBLIC/default grants so it cannot read unrelated booking/customer tables. The
migration deliberately does not edit existing public-schema/booking grants.

After isolated rehearsal and explicit migration approval:

```sh
sudo -u postgres psql --dbname=monetcore_db --set=ON_ERROR_STOP=1 --file=/APPROVED_RELEASE/enquiry-operations/004_create_enquiries.sql
```

004 is apply-once, within one transaction with lock/statement limits. It refuses an
existing schema, wrong DB, privileged/missing/inherited role and application ownership.
It creates only private enquiry tables, request aliases and expiring rate windows;
no booking migration001/002/003 or production data is changed.003 remains reserved
for the independent booking journal and is NOT a dependency. Inspect permissions
and foreign-key/index definitions after application. Do not rerun/drop objects to
force success. Retain a pre-migration database backup and tested restoration plan.

Failed migration rolls back atomically. After accepting any traffic, application
rollback MUST retain enquiry records and queue state. Never drop schema as rollback.
Only an authorized owner may carry out the existing12-month manual retention policy;
request aliases cascade with authorized enquiry deletion, not routine rate cleanup.
The app role cannot delete enquiries. Worker deletes only expired rate-window rows.

## Candidate deployment — separate approval required

1. Build with package-production.mjs; resulting archive includes production-start.cjs,
   enquiry-config.cjs, compiled worker, server.js, static/public assets and exact SHA.
   It must include all traced pg/nodemailer dependencies; smoke-test extracted worker
   imports. Keep the verified b989 release and rollback service on4307 running.
2. Upload the archive through the approved private delivery mechanism only after
   publication approval. Verify independent SHA256 and extract into a NEW directory
   /srv/monetcore-production/releases/NEW_SHA. Do not overwrite4307's release.
3. Review the provided service templates, substitute @RELEASE@ and root-owned Node24
   @NODE@ paths, check target user/unit collisions, and verify available memory.
   Candidate listens127.0.0.1:4308. Templates default to disabled contact flags.
   No service or Nginx change is authorized by this document.
4. Web keeps localhost-only egress. Worker separately needs verified SMTP destination
   IPs on465/TLS and local DNS; templates intentionally block external SMTP until
   approved. Resolve current Private Email addresses, verify TLS hostname and plan
   updates when provider IPs change. Do not allow arbitrary outbound networks.
5. Before contact activation, ensure www redirects to https://monetcore.dev, then verify production Nginx overwrites Host=monetcore.dev,
   X-Real-IP=$remote_addr, X-Forwarded-Proto=$scheme, X-Forwarded-Host=$host.
   Proposed HTTP-context zone: limit_req_zone $binary_remote_addr
   zone=monetcore_enquiries:1m rate=6r/m. A separately reviewed exact /api/contact
   location may use this zone with burst5, client_max_body_size32k, and proxy_pass
   to the candidate. Keep /api/book and /api/assistant blocked and review /api403.
   Preserve existing TLS, redirects, headers and all other server blocks.
6. Run the controlled synthetic verification below against the isolated candidate,
   with no public routing change. Start the worker timer only after its flags,
   credentials and egress have been separately commissioned and tested. Monitor:
   systemctl status monetcore-enquiry-worker.timer; systemctl --failed;
   journalctl -u monetcore-enquiry-worker.service; enquiry-operations/inspect.sql.
7. Once approved, switch ONLY production upstream4307->4308 after nginx-t, reload,
   check real HTTPS pages, submit one explicitly authorized synthetic enquiry and
   quotation, and confirm recorded IDs/queue/inbox. Keep old4307 running for rollback.
   Enable candidate restart/startup and worker timer only under that deployment approval.

## Controlled delivery verification — separate permission and real credentials required

Use only owner-controlled synthetic addresses/content. Verify db role and schema,
then directly exercise the candidate with verified Host/Origin/forwarded headers.
Submit one contact and one approved-package quotation with distinct UUIDs. Confirm
202/received, exactly one DB record each, correct package price and pending state.
Run one worker pass. Confirm accepted state and actual inbox receipt at
hello@monetcore.dev, correct Reply-To, reference and stable Message-ID. No emails
should go to the supplied visitor address. Replay the same UUID/body and a new UUID
with identical content: no new enquiry or email. A changed payload with an existing
UUID must409. Do not test outages or fake credentials against live providers; those
scenarios belong in disposable/mocked tests. SMTP accepted alone is not inbox proof.

For uncertain states, inspect the mailbox/provider receipt using
<monetcore.enquiry.ENQUIRY_UUID@monetcore.dev> and the journal reference. Preserve
record/state evidence and record an authorized decision before any resend. No public
administration/retry endpoint or automatic uncertain-state reset is introduced.

## Rollback

Keep4307 and its release, back up/hash the exact current production Nginx file and
candidate config before switching, and record new/old upstreams. If post-switch
checks fail, atomically restore the verified production-only backup, nginx-t and
reload, then verify b989 HTTPS marker and review health. Stop/disable ONLY the new
candidate timer/service if needed under explicit rollback authorization. Restore
public contact alternatives; retain schema, enquiries, secrets and uncertain receipts
for reconciliation. Never delete queued enquiries or replay uncertain messages.
