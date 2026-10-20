# QA commands and safety

Use Node.js 24 and `npm ci`. The browser tests use `playwright-core` and axe without
installing browser binaries. Install Chromium separately or set `CHROMIUM_PATH` to
an existing Chromium executable (default `/usr/bin/chromium`).

```sh
npm run lint
npm run typecheck
npm test
VERCEL_ENV=preview npm run build
VERCEL_ENV=preview npm run start -- --hostname 127.0.0.1 --port 4600
# In another terminal:
QA_BASE_URL=http://127.0.0.1:4600 npm run test:browser
npm audit
npm audit --omit=dev
```

The browser suite rejects non-local base URLs and checks that the contact endpoint
returns the preview guard's 403 before testing forms. Success and error submission
responses are intercepted. Server tests use a Node loader that replaces SMTP,
Calendar and Supabase with in-memory fixtures before importing route handlers.
Dummy credentials exist only inside that test process. No real integrations are
required or called. Expected mocked service failures emit generic log messages.

`npm test` covers bounded JSON parsing, validation, rate limits, production/preview
SEO policy, preview endpoint rejection, contact delivery, quotation consent,
booking conflicts, availability and partial downstream failures. Planner testing
covers 9,600 combinations within one test group. The fake database's uniqueness
behavior verifies application conflict handling; it cannot prove that a deployed
database has the required unique constraint.

The seven browser programs cover eight public routes and internal fragments,
responsive geometry, accessibility scans including WCAG 2.1 A label-in-name and
WCAG 2.2 AA rules, desktop/mobile navigation, package quotations, forms, dialogs,
all solution categories, planner handoff and session persistence, stale booking
responses, duplicate/false-success handling, workflow timers, carousel controls,
keyboard process/FAQ interaction and reduced motion. Eight required viewport
widths are included, plus 1280px in the route regression.

Lighthouse is an optional separate audit tool rather than an application
runtime dependency. This audit used Lighthouse 13.5.0 and Chromium 154.0.0.0.
Run Lighthouse against a locally built server, without parallel browser suites,
and retain its JSON alongside any reported score. A preview's deliberately
blocked indexing lowers its SEO score. Production indexing must be checked using
an isolated local production-mode build or a separately approved deployment.
Do not change preview guards to obtain a higher preview SEO score.

These checks are Chromium simulations, not physical Android/iPhone, Safari,
Firefox, screen-reader certification or field Core Web Vitals measurements.

Phase 3.9 additionally tests shared-limiter command construction, pseudonymous
keys, platform-header selection, endpoint separation, fail-closed errors and SMTP
transport safeguards. REST responses are mocked: no Redis provisioning or real
concurrency/expiry guarantee is established by these tests. Before approved staging
runs, read `docs/phase-3.9-production-readiness.md` for configuration requirements,
recipient isolation, database invariants and approval gates.

Staging preparation (fully offline): `npm run test:staging:local`. The runner
requires the approved feature branch, accepts no live target, blocks network
sockets and uses mocked providers. See `docs/staging-preparation-report.md` for
resource/cost approvals and the distinction between local and external evidence.
The prepared metadata SQL must not be executed without staging approval.

Booking patch regressions: `QA_BASE_URL=http://127.0.0.1:4600 node
tests/browser-booking-conflicts.mjs` runs mobile/desktop 409 flows, successful and
failed availability refresh, preserved inputs, disabled blind resubmission and
selection of a replacement slot. API responses are intercepted; the server must
retain preview safeguards. This program is also included in `test:browser`.
Server tests cover all three tracking operations with returned/thrown database
errors, sanitized logs and internal Calendar-id persistence without public exposure.
