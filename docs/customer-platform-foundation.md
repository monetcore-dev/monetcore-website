# Customer platform foundation — implementation decisions

## Review and boundaries

Base: `58dd1c76c1d2bb78b3d70877f9718e7a91856b4d`. Preserve Phase 1, booking PostgreSQL role/pool, SMTP contact route, assistant authentication, VPS guards, migrations 001/002 and release scripts. The booking pool is intentionally integration-guarded and uses a narrowly scoped role; do not reuse it for accounts or tenants. Existing assistant Basic authentication is not a customer identity system.

Select self-hosted Better Auth (pinned version in package.json) with its PostgreSQL adapter: maintained password hashing, verified-email flows, expiring database sessions, revocation, password reset and origin/CSRF protection. Auth.js would require more application-owned password/verification flows; a hosted identity provider adds a separate provider/configuration dependency. Better Auth still requires patch monitoring, safe mail delivery, database operations and staging verification; library selection alone does not establish deployment readiness.

Use separate pools/roles: authentication owns access only to library identity/session/recovery tables; customer repository owns access only to customer domain tables. Both connect only to loopback VPS PostgreSQL, never Vercel. Migrations run manually as a migration owner, not the runtime roles. No role password or environment file is generated here.

Portal registration/email and the overall portal have independent default-off controls. Authentication email can only reach configured synthetic staging recipients. Verified and non-deactivated users are required for all domain access. Sessions are checked against the database on every request (no cookie session cache). Public users cannot supply internal privileges; platform-owner grants are a separate, operator-only relation. Organization roles never confer platform ownership.

Repository transactions derive organization scope from current authenticated user plus live membership. Tenant tables use forced RLS as defense in depth under a transaction-local user context; runtime roles are not table owners or BYPASSRLS. Public request fields cannot set user/tenant/status/role. Project requests and audit records commit atomically with idempotency protection. Never retry uncertain commits automatically.

No long-running worker, agent, payment, live registration, production migration or external email activation is part of this increment. IHUOMA access will require a distinct scoped identity and reviewed approvals, not reuse customer sessions.

## Implemented routes and customer behavior

- `/customer`: authorized organization overview, projects, request status and recent activity, from PostgreSQL only. `/customer/projects/new`: validated/idempotent project requests. `/customer/account`: account details, signout, all-session revocation and deactivation.
- `/customer/login`: registration/login/verification guidance, reset initiation and password-reset completion. Registration and recovery controls are hidden/blocked unless their email configuration is explicitly enabled. No public registration grants organization membership or platform ownership.
- `/api/customer/auth/*`: only selected Better Auth credential/verification/session routes; no social login, identity-linking, arbitrary profile updates or account deletion. The wrapper strips tokens from JSON responses while preserving secure session cookies. Email callbacks are restricted to customer routes on the canonical review origin.
- `/api/customer/organizations/:id/requests`: current verified/active session plus live membership, validated fields and RLS. A supplied organization ID is a selector, not authority. The server derives identity; user/role/status fields are rejected. Members and admins may submit/read their organization's requests. Membership changes, project status changes and owner assignment are operator-only in this increment.
- `/api/customer/account`: deactivation and session deletion share an authentication-database transaction with an append-only audit event. Deactivation is not deletion or automatic reactivation.

Authentication uses Better Auth 1.7.13, its default maintained password hashing and database-backed sessions. Email ownership is required; sessions expire after the library-configured one-day lifetime and active sessions may refresh. Verification expires after one hour, password recovery after 30 minutes, and password reset revokes existing sessions. Session cookie caching is disabled; each customer operation checks session/user state. Secure/HttpOnly/SameSite=Lax, host-only cookies have a customer-specific prefix. No customer password/session token is placed in browser storage. The reset token necessarily travels in a recovery link; referrer headers are `no-referrer` and portal pages are private/no-store/noindex. Configure proxy access logs not to retain sensitive query strings BEFORE activation; the application must never log recovery URLs.

## Additive database deployment proposal

`003_customer_foundation.sql` targets **only a new, isolated `monetcore_customer_staging` database**, never the existing `monetcore_db`. It creates `customer_auth` and `customer` schemas and two initially NOLOGIN roles. The migration is transactional and one-time; a second execution stops safely on existing schemas rather than silently accepting drift. Manual owner-authorized review is required to provision any database or role. No migration was executed on the VPS.

Better Auth identity/session/account/verification tables use text UUID defaults matching its PostgreSQL UUID generation mode. Customer entities use PostgreSQL UUIDs and foreign keys/indexes/check constraints. Organization membership is a composite key with an active/revoked flag; revocation preserves historical references and immediately blocks new tenant access. requests reference their organization and submitting member. Internal owner authority is a separate `platform_owners` relation with no runtime grants, no RLS policy and no public assignment endpoint.

`monetcore_customer_auth` has CRUD only for library identity/session/recovery tables, SELECT/INSERT/UPDATE for durable counters and INSERT-only auth auditing. `monetcore_customer_runtime` can read permitted customer data and insert only approved request/audit columns; no updates, deletes, membership writes, owner-role reads or schema creation. Neither role owns tables, bypasses RLS or has memberships. The booking role receives no new permissions. Customer tables use forced RLS with transaction-local server identity; the application must remain the only holder of runtime credentials. RLS here is defense in depth against omitted tenant predicates, not protection against a fully compromised server that can set any identity context. The authentication role is a privileged identity-service boundary, not a general customer-data role.

Project submission commits request + audit together. Eight simultaneous retries with the same identity, organization and idempotency key must produce one request and one audit. Reusing a key with changed input returns conflict. A lost COMMIT response is uncertain, not proof of failure; no automatic retry occurs. Keep the same in-memory form key and check history before retrying. A page reload loses that key: customers should check history instead of submitting a new form after an uncertain result. This is duplicate prevention for retries, not universal semantic deduplication of different requests.

## Staging configuration — names only; all OFF until approval

Existing review-VPS attestations: `NODE_ENV=production`, `MONETCORE_STAGING=true`, `MONETCORE_VPS_REVIEW=true`, `MONETCORE_VPS_PROXY_VERIFIED=true`. This is the existing dedicated TLS Nginx review proxy, with private loopback app ingress and overwritten Host/X-Forwarded-Host/X-Forwarded-Proto/X-Forwarded-For headers. No Vercel indicators may be present. IP limits require a single verified IP address, not an appended forwarded chain. Verify ingress before attesting it; no Nginx change is made by this code.

New names:
- `CUSTOMER_PLATFORM_ENABLED`: absent/false by default, overall kill switch.
- `CUSTOMER_DATABASE_NAME`: exactly `monetcore_customer_staging`.
- `CUSTOMER_AUTH_DB_PASSWORD`, `CUSTOMER_APP_DB_PASSWORD`: separate runtime role passwords, stored privately outside Git.
- `CUSTOMER_AUTH_SECRET`: independently generated secret of at least 32 characters; never reuse the assistant password or booking credentials.
- `CUSTOMER_REGISTRATION_ENABLED`: absent/false until email and staging approval.
- `CUSTOMER_AUTH_EMAIL_ENABLED`: absent/false; independent of contact/booking SMTP activation.
- `CUSTOMER_AUTH_TEST_EMAILS`: explicit comma-separated approved recipients; required for staging signup, login and authentication emails.
- `CUSTOMER_AUTH_SMTP_USER`: `hello@monetcore.dev`; `CUSTOMER_AUTH_SMTP_PASSWORD`: separately configured privately after approval. Transport is fixed to mail.privateemail.com:465/TLS. Subject prefixes identify staging. Only approved test recipients can receive authentication messages. No contact or booking SMTP settings are read/modified.

Do not enable contact, booking, AI, payments or agents to test this platform. No Redis dependency is introduced. Atomic PostgreSQL UPSERT counters fail closed on database errors; per-IP limits are 15 auth operations, 10 writes and 120 reads per 15 minutes, plus global auth200/other1000 bounds. These are conservative staging limits, not a public capacity claim. Anonymous authentication failures consume admission; all application instances share counters. Trusted proxy verification is mandatory. Owner should review threshold tuning and abuse/monitoring controls before public rollout.

### Operator sequence after separate approval

1. Back up and verify recovery ownership. Provision a NEW isolated local database as migration owner; do not import production customer data.
2. Review SQL, role names and schema absence. Run `psql -X -v ON_ERROR_STOP=1 -d monetcore_customer_staging -f scripts/migrations/003_customer_foundation.sql` as migration owner only. Do not run old booking migrations on this database or customer migrations on monetcore_db.
3. Use secure local administration (`\password` interactively, never shell arguments/chat) to set separate passwords and explicitly grant LOGIN only to the two reviewed runtime roles. Check roles are not schema/table owners, elevated or inherited. Verify database grants, pg_hba/local-only listener, forced-RLS policies, and lack of booking-role access.
4. Configure runtime secret names privately with all enable flags false; verify emergency disable behavior. Confirm Namecheap email/provider/privacy approvals and query-string log handling.
5. In a separately authorized staging session enable only the customer platform and synthetic recipient list; email/registration remain separately controlled. Test registration -> verify -> login -> operator-assigned synthetic organization -> project request -> status/history -> reset -> session revocation -> deactivation. No live customers or production email recipients.
6. Organization provisioning/membership assignment remains a reviewed operator action, not public registration. Never insert platform-owner authority through the customer UI. No IHUOMA or internal admin interface is exposed.
7. Review cross-tenant denials, permissions, audit trails, rate exhaustion/outage, duplicate/uncertain submissions and mobile accessibility. Disable all new flags afterward; retain synthetic records for review or remove only with explicit disposal approval.

## Retention and deletion proposal — not a published promise

Owner/legal approval is still required for account, project and audit retention. Do not apply the existing 12-month general-enquiry policy to contractual project records automatically.

| Category | Current behavior / proposed review |
| --- | --- |
| Accounts / memberships | Retained; deactivation disables access without deleting data. Propose periodic manual inactive-account review; duration must be approved. |
| Projects / requests | Retained for engagement and applicable obligations; no automatic deletion. Approve closure-based schedule before public access. |
| Sessions | One-day session lifetime with library refresh behavior; expired sessions cannot authorize. Manual approved cleanup of expired rows; no application cleanup job introduced. |
| Verification / recovery | 1h / 30m validity and library one-use consumption. Manually review/delete expired tokens under approved operational procedure. |
| Auth / tenant audit | Append-only to runtime roles. Propose a 90-day review cycle, not a 90-day automatic deletion rule; owner must approve retention, access, export and erasure exceptions. |
| Rate-limit metadata | HMAC IP keys, counts and 15m windows. Propose scheduled operator cleanup of expired counters after review; it is not implemented automatically. |

Respond to privacy requests via hello@monetcore.dev, proportionately verify identity and map user/org records, contractual obligations and backups. Obtain authorized export/correction/deletion instructions; never cascade-delete tenant records based on a web request. Foreign keys intentionally block destructive removal while project/audit references exist. Document manual decisions, access, backups and provider copies without claiming automated deletion, verified transfer arrangements or legal guarantees. Update customer-specific legal/processing notices with approved retention terms before public onboarding; existing corporate privacy responsibilities remain unchanged.

## Rollback and residual risks

First disable the three new flags; revert the application release using the existing VPS release procedure only after deployment approval. Do not restart PM2/Nginx automatically. Preserve database and evidence. `003_customer_foundation.down.sql` refuses rollback if ANY identity, counter, audit or domain rows exist; for an empty foundation only, it drops the explicitly named new objects in a transaction. It never drops roles or touches bookings. A populated foundation requires approved backup/reconciliation, not automatic schema deletion.

Real Namecheap SMTP delivery, external review-TLS proxy settings, VPS password/pg_hba rules, backups, browser/device behavior on actual hosting, legal retention and future public activation remain unverified. Better Auth signup/mail and audit hooks span library operations: a post-operation failure can leave a registered but unverified account or a completed action with an uncertain response; do not auto-retry uncertain email delivery. Use verification resend/account recovery only after manual review. No unqualified guarantee of atomicity across SMTP and database operations is made.

## Reproducible local checks

- `node scripts/vps/check-release.mjs`: clean-environment typecheck, all unit tests, nine offline staging checks, lint and review production build. No external calls or activation.
- `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --import ./tests/register.mjs scripts/staging/verify-disposable-customer.mjs --disposable-local-only`: optional, requires an already-provisioned isolated PostgreSQL16 fixture exposing ONLY `/tmp/monetcore-customer-pg-socket`, database `monetcore_customer_staging`, cluster marker `monetcore_customer_disposable`, and an empty migrated foundation. It refuses a different target or existing identities. Uses real Better Auth, actual SQL/RLS, synthetic records and mocked Nodemailer; HTTP provider requests are forbidden. It does not create cloud infrastructure or target a VPS.
- `node tests/browser-customer-platform.mjs --disposable-local-only`: after the disposable SQL test and production build, uses only that marked local fixture. Seeds an approved synthetic identity with the library password hasher, creates a temporary loopback-only port5432 bridge and local Next.js port4603 process. Browser requests to the canonical-looking review origin are intercepted to loopback; external browser requests are denied. The child process uses only synthetic credentials, registration/email/contact/booking/AI disabled. It must stop if ports are occupied; never stop another service to make the test pass. Cleans up its own app and bridge; database fixture cleanup is a separate explicit disposal step.

These tests are optional fixture tools, not deployment automation. A real staging deployment still needs separate approval and provider testing. Physical-device testing is separate from Chromium emulation.

Better Auth intentionally catches mail-callback exceptions internally. A request-local AsyncLocalStorage delivery-state wrapper detects failure/rejection and returns a sanitized 503 instead of a misleading successful email outcome. It stores only delivery booleans, never addresses or tokens, and does not automatically retry SMTP. This is covered through actual library requests with mocked SMTP failure.

Before public activation also approve customer legal/retention notices, recovery support procedures, database credential isolation, backup encryption/restore ownership and VPS capacity. The two new pools permit up to three connections each per app process, in addition to the unchanged booking pool; size PostgreSQL/PM2 accordingly after measuring rather than assuming capacity.

Staging allowlist removal is checked on every authoritative customer-session resolution, not just at login or email delivery. Removing a test recipient therefore blocks that account's existing session from customer APIs/pages without requiring a process-local session blacklist.

Use `scripts/staging/customer-inspection.sql` for metadata-only verification of the new staging schemas, roles, grants, indexes, constraints and RLS. It reads no account, password, token, session or customer project rows. Review the metadata privately; operational role/schema names need not be published.
