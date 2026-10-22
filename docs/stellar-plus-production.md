# Stellar Plus production preparation — authoritative operator guide

## Decision and confirmed target

**NO-GO for cutover until the account checks and isolated integration tests below
pass. GO for reviewing/testing the prepared package.** Nothing is deployed here.

Owner-provided limits: Namecheap Stellar Plus, Node.js target 24.13, RAM 2 GB,
CPU 0.5 core, 30 entry processes. These are shared-account ceilings, not dedicated
resources or a promise of 30 safe simultaneous AI/SSR requests. Local tests run on
Node 24.19.0, not 24.13; exact-version/CloudLinux/Passenger testing remains required.
Use a maintained Node 24.x >=24.13. Build/runtime major mismatch is rejected.
Installed Supabase requires >=22 and Next >=20.9; no dependencies were downgraded.

This guide supersedes the initial `cpanel-deployment.md` investigation. The branch
includes that preparation and adds the portable protected production profile.

## What the package preserves

Full Next routing, SSR, API routes, React UI and static assets; Nodemailer contact
and booking notifications; Supabase reservations/uniqueness and Google Calendar;
OpenAI Responses classification with the pinned model, approved template answers,
300-output limit, input bound, timeout, no retries and local request controls.
Basic owner authentication, password hashing, price approval, master enable flags
and emergency stop remain mandatory for AI. There is NO public AI mode.

The Vercel path and live environment are unchanged. On cPanel a distinct runtime
profile is set by start.cjs. Never set VERCEL variables to make self-hosting work.
Review mode still disables submissions and AI. Production profile additionally
requires authenticated Apache ingress before AI or contact/booking rate limiting.
No database schema, bookings, SMTP accounts or Calendar permissions were changed.

## 1. Ask Namecheap to verify the runtime and ingress first

Confirm all of the following on this account, not only generic Next compatibility:

- Node 24.13.x (or approved maintained 24.x), Linux architecture/glibc compatibility,
  Passenger version and support for Next's generated standalone server/listen call.
- Application root outside public_html, startup file start.cjs, root-path mounting,
  protected environment-variable editing, and safe restart/log access.
- Apache mod_headers support and a **private per-vhost environment variable** for
  a shared ingress token. Support must ensure client header copies are stripped
  and fresh metadata injected only on verified TLS requests. The token must never
  be sent in a response, stored in source control, logged or served as a file.
- Backend socket/loopback access restricted appropriately. Loopback alone is not
  an identity boundary between customers on shared hosting.
- Outbound DNS/HTTPS443 and SMTP TLS465, request timeouts, idle restarts, cache/disk/
  inode quotas, process limits and behavior when LVE limits are exceeded.

**Stop if authenticated ingress cannot be established.** Do not replace it with
blind trust in x-forwarded-proto/for, weaken Basic auth, or spoof Vercel variables.
Namecheap docs/account settings could not be independently inspected here.

## 2. Prepare Apache metadata with support — no secret values in this repository

The private Apache variable `MONETCORE_INGRESS_TOKEN` and Node variable
`CPANEL_INGRESS_SECRET` must contain the same new password-manager-generated
random ASCII token, 32–256 characters. It is separate from the owner password and
OpenAI key. Configure it securely with support; do not paste it into chat, URLs,
Git, screenshots or shell history. Node app variables do not automatically become
Apache per-vhost variables. If support cannot supply the private Apache variable,
this template alone is NOT sufficient and production must remain blocked.

Support-reviewed Apache 2.4 template (syntax/modules must be verified on account):

```apache
# In the app ingress/vhost scope; exclude unrelated apps and mail/webhooks.
RequestHeader unset X-Monetcore-Ingress
RequestHeader unset X-Monetcore-HTTPS
RequestHeader unset X-Monetcore-Client-IP
RequestHeader set X-Monetcore-Ingress "%{MONETCORE_INGRESS_TOKEN}e" "expr=%{HTTPS} == 'on'"
RequestHeader set X-Monetcore-HTTPS "1" "expr=%{HTTPS} == 'on'"
RequestHeader set X-Monetcore-Client-IP "expr=%{REMOTE_ADDR}" "expr=%{HTTPS} == 'on'"
```

This is not automatically installed. Confirm Apache's effective REMOTE_ADDR is the
real client (or uses explicitly trusted mod_remoteip proxies). Preserve the original
Host and Basic Authorization to Passenger; canonical Host is exactly monetcore.dev.
HTTP must redirect to HTTPS before application use; www must redirect to canonical.
Do not log the custom token header. The app ignores unauthenticated forwarded IPs.
Missing/wrong token or metadata rejects paid AI and form submission access.

## 3. Build elsewhere, without credentials

Use a trusted Linux builder matching the target architecture/glibc and Node major.
The hosting account must not run compilation under its 0.5-core/2-GB limits.
Checkout the approved clean release commit; do not include unrelated SQL files.

```
node --version
npm ci
npm test
npm run typecheck
npm run lint
npm run build:cpanel
npm run package:cpanel -- /absolute/new/outside-repo/monetcore-review
```

Default is review mode and disabled AI. Test this artifact first. For a separately
approved production artifact (still built without secrets):

```
MONETCORE_DEPLOYMENT_ENV=production npm run build:cpanel
npm run package:cpanel -- /absolute/new/outside-repo/monetcore-production
```

The package contains standalone server.js, traced dependencies, public, .next/static,
start.cjs and release.json. Review/prod mode and Node major are recorded; startup
rejects mismatches. No .env, key/SQL/Git/test/source-doc files are packaged. Review
artifacts must not simply be relabelled production: robots/headers can be built in.
Use tar/zip on the output directory to upload, preserving hidden .next and symlinks.
Do not combine a hand-written Next HTTP server with standalone output.

## 4. Upload and configure a separate cPanel review application

1. Keep Vercel/domain DNS unchanged. Use an approved separate protected review URL
   and NEW private application root, e.g. /home/ACCOUNT/apps/monetcore-review.
2. Upload through SFTP or cPanel File Manager and extract the artifact INSIDE that
   root. Confirm server.js, start.cjs, node_modules, public and hidden .next exist.
   Never place the application tree in a publicly served document directory.
3. In cPanel > Setup Node.js App > Create Application choose verified Node24.x,
   Production application mode, root-path application URL, that application root,
   startup file start.cjs. Do not change the existing production domain/app.
4. Add MONETCORE_DEPLOYMENT_ENV=review. Leave AI/staging activation absent/false.
   Review smoke tests require no SMTP, Supabase, Google or OpenAI credentials.
5. Set NODE_OPTIONS=--max-old-space-size=512 as an initial conservative heap budget
   if the selector honors it. This limits JS heap, NOT total RSS. Confirm rather
   than assume enforcement. Start with one Node worker; do not add PM2/clusters.
6. Start/restart from cPanel. Avoid "Run NPM Install" over traced dependencies;
   confirm the selector accepts the packaged layout. If it mandates another layout,
   stop and obtain the supported approach rather than overwriting native packages.
7. Check page rendering/assets, security/noindex headers, contact/book page display,
   navigation/mobile and privacy/pricing. Review submissions return403; AI is503.
   No review hostname can act as the canonical production AI origin.

## 5. Configure the production app securely — only after approval

Create a separate versioned production root/artifact. Keep activation off initially.
In cPanel's secured environment-variable editor (not source or public .env) add:

| Group | Names |
| --- | --- |
| Runtime | NODE_ENV=production; MONETCORE_DEPLOYMENT_ENV=production; optional NODE_OPTIONS as above |
| Ingress | CPANEL_INGRESS_CONFIGURED=true only after verification; CPANEL_INGRESS_SECRET |
| SMTP | MONETCORE_EMAIL; MONETCORE_EMAIL_PASSWORD |
| Supabase | NEXT_PUBLIC_SUPABASE_URL; SUPABASE_SERVICE_ROLE_KEY |
| Calendar | GOOGLE_CALENDAR_ID; GOOGLE_SERVICE_ACCOUNT_EMAIL; GOOGLE_PRIVATE_KEY |
| Existing form limits, if configured | UPSTASH_REDIS_REST_URL; UPSTASH_REDIS_REST_TOKEN; RATE_LIMIT_KEY_SECRET; RATE_LIMIT_REQUIRED |
| Protected AI | OPENAI_API_KEY; OPENAI_MODEL; AI_PRICING_APPROVAL; AI_OWNER_PASSWORD_SHA256; AI_ASSISTANT_ENABLED; AI_OWNER_TEST_ENABLED; AI_ASSISTANT_EMERGENCY_STOP |

start.cjs sets MONETCORE_HOSTING_TARGET=cpanel for its own process. Do not set any
VERCEL* or STAGING_* activation settings. AI flags stay false/absent until separately
approved owner testing; emergency stop true/absent blocks inference. Pinned model
remains gpt-4.1-mini-2025-04-14; existing revision-2 pricing approval is unchanged.
Raw owner password is never an app variable: configure its SHA256 hash as before.
Google private-key literal backslash-n is supported. No private credential should
have a NEXT_PUBLIC prefix; only the Supabase project URL is public.

Use a private browser on the verified cPanel HTTPS domain, cPanel 2FA and least-
privilege account access. Environment variables are visible to authorized hosting
administrators/process owners; they are not a hardware secret vault. Verify values
survive restart, multiline key handling works and the UI does not expose them to
other users/logs. No actual cPanel variable storage was accessed/verified here.

Do NOT copy production records into review, alter RLS/unique indexes or change
Calendar permissions. Existing integrations remain external and billed separately.
Stellar hosting does not remove Private Email, OpenAI or other provider costs.

## 6. Isolated acceptance tests before any cutover

Keep review submissions blocked until a separately authorized isolated-resource
exercise is arranged. Use dedicated test Supabase/Calendar and approved mailbox,
not production data. Current Vercel staging branch guards are not bypassed: a
separate safe cPanel integration test configuration/authorization is required.
Verify no customer messages or real events can be generated accidentally.

Required checks: Passenger lifecycle/restart; Proxy and Basic auth challenge;
wrong token/wrong password/HTTP/alternate-host rejection; TLS and canonical routing;
SMTP accepted/rejected/timeouts; reservation insertion/duplicates/Calendar partial
failure and notification tracking; owner-only mocked then approved bounded AI call;
provider token usage/cost attribution; browser/mobile and slow-network rendering.
Public AI remains out of scope. Do not remove owner authentication to test a page.
For canonical-host acceptance before DNS cutover, arrange a support-approved local
hosts-file mapping on the tester computer with a valid trusted TLS certificate.
Do not use TLS-verification bypasses or change public DNS for this test.
Test Authorization preservation using the real owner password privately, never in
curl command history. An unauthenticated GET /assistant may verify the challenge
only AFTER separately enabled owner test; no POST is needed for that check.

## 7. Measure resource headroom

Use cPanel > Metrics > Resource Usage (CloudLinux) to watch physical memory, CPU,
entry processes, process count, I/O and faults/508s. Capture idle, page navigation,
image optimization and mocked concurrent-request periods, plus restart/idle recycle.
Verify provider timeouts fit Passenger/Apache timeout settings. A 512-MB heap can
still exceed 512MB RSS due to native buffers/threads; all sites/mail/processes share
account quotas. Do not equate 30 entry processes with a concurrency target.

With SSH, list ONLY your user processes without command arguments/environment:

```
ps -u "$(id -u)" -o pid,ppid,comm,rss,%cpu,etime
```

RSS is KB; ps %CPU and cPanel CPU graphs use different averaging/normalization.
Do not claim a capacity number from this local build. Initially test one request,
then two and a few synthetic concurrent requests on an isolated review app, stopping
at errors or sustained limit pressure. Avoid live paid/SMTP/Calendar load testing.
Keep substantial account headroom; choose an owner-approved threshold after actual
measurement. Persistent OOM/recycles/508 or CPU saturation is a NO-GO, not a reason
to disable validation or increase heap to consume the entire account.

.next/cache must be writable only by the application user; avoid chmod777. Confirm
inode/disk quotas, log rotation, sharp native compatibility and cache behavior.

## 8. Cutover/rollback — later, explicitly authorized actions only

Before cutover, record the current Vercel deployment/domain assignment and rollback
URL, export non-secret DNS records and preserve MX/SPF/DKIM/DMARC unchanged. Back up
app artifacts/config securely without printing secrets. Keep old runtime available.
Prepare verified TLS and the approved canonical-host ingress on the new host.
Change DNS only in an owner-approved window after all acceptance criteria pass.

For an app-only rollback use a retained known-good versioned root and cPanel's
supported root-switch/restart mechanism, verified in rehearsal. Do not unpack over
an active root. If switching back to Vercel is necessary, restore recorded web DNS
only under owner authorization; propagation/TLS caches make this non-instantaneous.
Do not run old/new active booking writers concurrently during rollback verification.
Do not undo customer records or duplicate SMTP/Calendar operations.

Stop on authentication/ingress bypass, missing privacy disclosures, lost messages,
duplicate bookings, unexplained provider costs, persistent memory/CPU faults or
unavailable rollback. Disable AI by existing flags/restart (or owner-authorized
provider key controls); accepted requests may finish/charge. Shared hosting has no
assumed equivalent to Vercel Instant Rollback/WAF/edge DDoS/rate limiting.

## Remaining approvals and external blockers

Actual Node24.13/Passenger/Apache private-env support; memory/CPU headroom; secure
cPanel secret persistence; outbound provider connectivity; SMTP and isolated booking
acceptance tests; current OpenAI pricing/privacy review; hosting/processor Privacy
Policy update; rollback rehearsal. Local success does not establish any of these.
No paid service, DNS change, production action or AI activation is authorized by
merely building this package.

## Local verification performed for this PR

54 automated tests passed, including existing Vercel/booking/contact tests and the
new cPanel ingress/authentication/provider-path tests with synthetic credentials
and mocked OpenAI only. TypeScript and ESLint passed. Default production and standalone review/
production builds/package generation passed on Linux Node24.19.0. The packaged
production server returned403 without authenticated ingress,401 with ingress but
no Basic credentials, and200 for an authenticated owner GET. Its OpenAI key was
explicitly blank; no inference POST or paid provider request was made.

Packaged review Chromium tests passed at320/390/768/1440 for homepage, contact,
booking, packages and privacy layouts, navigation, keyboard/axe checks, no overflow,
noindex headers, disabled submissions and blocked assistant; zero external requests
or browser errors. These are browser emulation, not Android/iOS device or Passenger
tests. No Node24.13-specific or shared-host load/capacity success is claimed.
