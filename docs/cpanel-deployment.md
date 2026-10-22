> Historical initial investigation. For the confirmed Stellar Plus resources and the new authenticated cPanel production profile, use [stellar-plus-production.md](stellar-plus-production.md). Its instructions supersede the earlier AI-blocked adapter limitations below.

# Namecheap cPanel migration preparation

## Status: review artifact ready; production migration NOT approved/verified

No live hosting, DNS, production configuration, customer records or integrations
were changed. Namecheap support reportedly confirmed general Next.js 16/Node.js 24
compatibility. The actual Stellar account's Node selector, Passenger behavior,
resource limits and ingress metadata remain unknown. Official Namecheap articles
were inaccessible from this execution environment; no specific plan quota is claimed.

The repository runs Next 16.4.0 / React 19.2.8. Next requires >=20.9; the installed
Supabase 2.112.4 requires >=22.0.0. Select a supported maintained Node 22+ version
actually available on the account. Build and run with the same Node major, Linux
architecture and compatible native-library/glibc versions. Node 24 is not assumed.
Do not downgrade dependencies silently if the selector only offers older Node.

## Recommended server strategy

Use Next's opt-in standalone output and generated server.js, with the provided
small CommonJS `start.cjs` bootstrap as cPanel's startup file. It checks build mode
and Node version then loads generated server.js. It does NOT implement another
HTTP server or replace Next routing. Next's custom-server and standalone modes
must not be combined. Normal Vercel `npm run build`/configuration are unchanged.

Do not use static export: contact, booking, assistant, SSR, Proxy and API routes
require a Node server. Do not run next dev in production. Do not add Express/PM2
or change start to a custom server merely to satisfy cPanel's startup-file field.
Passenger must be verified to accept the generated server's single listen call;
its port/socket interception, environment and timeout behavior are not emulated
by the successful local Node smoke test. If it does not, stop and ask Namecheap
for the supported Passenger startup pattern rather than exposing a public port.

## Build/package on a trusted compatible Linux machine

Use a clean reviewed commit in a separate checkout, no .env/credentials and no
customer data. npm ci uses the existing lockfile. Build dependencies are needed
on the build machine; a production-only install cannot compile TypeScript/Tailwind.
Verify Node first; activate the cPanel virtualenv only on the server as instructed
by that account's UI. Do not copy a node_modules folder from Windows/macOS.

```
node --version
npm ci
npm test
npm run typecheck
npm run lint
npm run build:cpanel
npm run package:cpanel -- /absolute/new/path/outside/repository/monetcore-review
```

build:cpanel defaults MONETCORE_DEPLOYMENT_ENV to review, selects standalone and
disables AI/staging activation in the child build. Existing shell/config settings
are not edited. It refuses a fabricated/inherited Vercel runtime. Packaging copies
only traced standalone output, public and .next/static plus startup/release metadata;
excludes env, Git/Vercel metadata, SQL/key files and source tests/docs/scripts.
It rejects external/absolute symlinks and refuses an existing output directory.
Traced assets are not a secret scrubber: always build without secrets and review
the artifact before upload. No unrelated staging-booking SQL is included.

The artifact has its own traced production node_modules. Do NOT run cPanel's
"Run NPM Install" blindly over it; that may replace native dependencies or require
missing lock/dev files. If the platform mandates npm installation/virtualenv layout,
confirm the supported layout with Namecheap first. A source-build deployment is
an alternative only if build RAM/CPU/npm access and scripts are actually supported.

Runtime mode must match artifact build mode; changing review to production requires
a new production build. Static robots/headers can be fixed at build time. To prepare
a production artifact AFTER approval, explicitly build AND launch with
MONETCORE_DEPLOYMENT_ENV=production. This does not solve the AI/proxy blockers below.

## cPanel review procedure — owner action after separate approval

1. Confirm Setup Node.js App availability on this Stellar account, selectable
   Node 22+, Passenger integration, SSH/Terminal access, npm support and resource
   limits. Confirm whether application root may be outside public_html (required).
2. Create a separate protected review hostname/application, not monetcore.dev.
   This creation is not performed by this PR. Do not repoint the live domain.
3. Upload/extract the artifact in a NEW private application root outside the web
   document root. Never serve .next/server, node_modules, source maps or config
   directly through Apache. Do not upload .env or Google credential JSON files.
4. In Setup Node.js App select the verified matching Node version, Production
   application mode (NODE_ENV=production), application URL at hostname root, and
   startup file start.cjs. Subpath mounting is not supported by this preparation.
5. Set MONETCORE_DEPLOYMENT_ENV=review. Keep all AI activation/staging flags absent
   or false. Do not set VERCEL*, spoof branch variables or carry preview overrides.
   No real integration credentials are needed for the initial smoke test.
6. Configure TLS and verified access protection for the review host; noindex is
   not authentication. Confirm Apache forwards authentication safely and limits
   access to the backend socket. Do not publish the Node port. The bootstrap binds
   loopback; Passenger behavior must be confirmed on the account.
7. Start/restart through cPanel. Inspect only sanitized errors. Check static assets,
   homepage, service/product pages, packages, privacy, contact and booking rendering,
   responsive navigation, image optimization and security/noindex headers.
8. Verify review contact/booking endpoints return 403 without external actions;
   assistant returns unavailable, not paid inference. Check both page/API URLs.
   Test process restart, idle recycle, filesystem permissions and resource graphs.
9. Stop on OOM/508, unsupported engine, missing assets, timeout, unexpected writes,
   exposed server files, authentication loss, changed redirects or spoofable headers.
   Do not proceed to live integrations or cutover until blockers are resolved.

## Environment and integration audit

- Assistant activation/owner guard: VERCEL, VERCEL_ENV and allowed Git branch are
  currently hard requirements. cPanel inference remains DISABLED. start.cjs refuses
  AI activation flags and forces emergency stop in its own process. A portable
  authenticated runtime profile and verified trusted TLS/Host handling are REQUIRED
  in a follow-up before the entire AI feature can migrate. Never set VERCEL=1 as
  a workaround. Existing Vercel owner controls remain intact.
- Review safety now also recognizes MONETCORE_DEPLOYMENT_ENV=review, without changing
  Vercel Preview behavior. Existing staging opt-ins still need the exact Vercel branch
  and cannot accidentally activate on cPanel. Review headers/robots are noindex.
- Contact/booking production algorithms are unchanged. Required names include
  MONETCORE_EMAIL, MONETCORE_EMAIL_PASSWORD; NEXT_PUBLIC_SUPABASE_URL and
  SUPABASE_SERVICE_ROLE_KEY; GOOGLE_CALENDAR_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL and
  GOOGLE_PRIVATE_KEY. Private key supports literal backslash-n. Set these only in
  secured server settings, never NEXT_PUBLIC secrets, browser code or chat.
- SMTP currently uses Namecheap Private Email mail.privateemail.com with TLS port
  465. Verify outbound 465, DNS, TLS CA trust, allowed connections and mailbox limits
  from this account. Existing mailbox hosting is distinct from Stellar mail services.
  No test email was sent. Production email credentials/config must remain unchanged.
- Supabase, Google Calendar, OpenAI and any configured Upstash require outbound
  HTTPS/443 and DNS. Preserve database permissions, active-slot uniqueness and
  Calendar sharing; do not copy customer records to review. System timezone should
  not replace the booking code's WAT handling. Confirm server clock/NTP.
- Booking/contact may use existing UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN,
  RATE_LIMIT_KEY_SECRET, RATE_LIMIT_REQUIRED. This migration neither introduces
  assistant Redis nor removes independent form protection. Without shared config,
  existing optional per-process fallback remains best effort. Never disable a
  required shared limiter to get a deployment working.
- Non-Vercel form rate limiting trusts x-forwarded-for today. Apache/Passenger must
  overwrite untrusted forwarded headers and identify the actual client securely.
  If not verified, fix the trusted-proxy boundary before enabling public submissions.
- @vercel/analytics is installed but render-disabled; no analytics service is required.
  Existing canonical URLs reference monetcore.dev. Update privacy hosting/processor
  descriptions to Namecheap only as part of an approved actual migration.
- Vercel firewall/DDoS, deployment protection, preview automation, runtime logs,
  edge caching and rollback do not travel with the artifact. Confirm replacements
  with Namecheap; cPanel process-local locks do not become durable global quotas.

## Resource/operational risks — get account-specific answers

CPU/LVE, physical/virtual memory, concurrent entry processes, process count, inode/
disk quota, open files, Node idle recycle and request/runtime timeouts can constrain
Next. Ask support for exact values and overage behavior, not marketing descriptions.
Do not assume 512MB/1GB or a dedicated CPU. Build elsewhere to avoid peak compiler
memory, then measure idle RSS, navigation, SSR/image optimization and representative
mocked API load before launch. Shared hosting has no assumed persistent worker SLA.

.next/cache must be writable for image/runtime caches. Restrict permissions to the
application owner; never chmod 777. Use SSH/SFTP, least-privilege credentials, current
TLS, restricted logs and private application roots. No application chat/session/
booking state should depend on a local writable filesystem. Native sharp binaries,
Next Proxy support and worker/thread creation need actual CloudLinux tests.

Keep generated artifacts for rollback outside public_html. cPanel has no assumed
atomic deployment or Instant Rollback; use versioned app roots and rehearse supported
switch/restart behavior. Keep Vercel and production DNS unchanged throughout review.
A later cutover needs explicit owner approval, verified contact/booking/SMTP/AI
checks with isolated resources, privacy updates, a DNS/TLS/mail-record plan and a
working return-to-Vercel rollback. Do not change MX/SPF/DKIM/DMARC unintentionally.

## Readiness conclusion

Standalone deployment is locally testable and is the lowest-complexity candidate.
Namecheap/Passenger compatibility is conditional, not proven. Full feature parity
(in particular authenticated AI and trusted client/proxy metadata) is NOT ready for
production cutover. If these or the LVE limits cannot be satisfied affordably,
shared hosting is not a safe substitute for the current application runtime.

## Executed local checks

53 automated tests passed, including review-mode submission blocks and startup
configuration rejection. TypeScript and ESLint passed. Both the unchanged default production build and the opt-in standalone build
and packaging passed on local Linux/Node 24 (not an assertion about Namecheap).
Packaged pages /, /contact, /book, /website-packages, /privacy, /services and /products
returned 200/noindex; contact/booking/availability APIs returned 403 in review mode.
Chromium assistant checks passed at 320/390/768/1440px with keyboard/axe, disabled
inference and mocked success, no external requests or browser errors. Artifact
path scan found no env/key/SQL/Git metadata files. These checks do not exercise
Passenger, SMTP delivery, Google, Supabase, OpenAI or actual device browsers.
