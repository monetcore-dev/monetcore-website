# Phase 3.8 — website QA, security, performance and SEO audit

Date: 19 October 2026. Repository: monetcore-dev/monetcore-website.
Branch: `feature/monetcore-stage1-websites`. Corporate-first architecture and all
approved design/product work are preserved. No merge, production deployment,
DNS edit, credential rotation or production data change is included.

## A. Overall status

**Not ready for production deployment yet.** The audited application is suitable
for review on the protected preview. Executed application checks pass after the
fixes below. Production sign-off still requires real staging integration checks,
a verified atomic booking-slot constraint, durable abuse protection, business
approval of proposed pricing, and manual device/accessibility review.

## B. Functionality results

The public page inventory is `/`, `/services`, `/products`, `/about`, `/contact`,
`/book`, `/website-packages` and `/demo/fintech`. Services and products use their
existing section anchors; no unlinked product pages were invented. The planned
`/get-a-website` campaign page remains documentation only. Three existing APIs
are `/api/contact`, `/api/book` and `/api/book/availability`. New technical SEO
routes are `/robots.txt` and `/sitemap.xml`; an unknown route returns 404.

Executed checks passed for:

- Every existing public page, internal navigation URL and fragment, shared footer,
  desktop mega menu, mobile nested menus, outside-click/Escape behavior, focus
  restoration, menu scrolling and scroll-lock cleanup. Preview-only menu clearance
  prevents the safety notice from covering the consultation link, including tablets.
- All four solution categories, active pressed states, real destinations and
  correctly reset illustrative panels.
- Workflow Run, sequential four-stage progression, active indicators, completion,
  reset cancellation, replay, repeated runs, category-switch cleanup, touch and
  reduced motion. These interactions make no AI or customer-record API calls.
- Technology carousel selection, Previous/Next, automatic rotation, Pause/Resume,
  hover/focus pausing, reduced motion and stable canvas height.
- Process steps, Previous/Next states, keyboard selection and FAQ expansion,
  hidden-answer focus behavior and relevant destinations.
- Planner recommendations (9,600 combinations), optional capabilities, Naira
  budgets, editable enquiry handoff, preserved identity fields and character
  count. Non-personal multiple-choice selections now survive navigation and
  reload in the current tab. Name/email and free-text enquiry details are not
  persisted in browser storage.
- Package prices/renewals, comparison semantics, all package CTA/quotation links,
  correct WhatsApp package messages, consent validation and unknown query values.
  Package switching now updates the quotation selection without erasing entered
  details, including after a manual dropdown choice. Cached round trips no longer create
  duplicated quotation fragments; native deep links/new-tab behavior are preserved.
- Contact and booking native validation, server validation, pending duplicate
  guards, loading/error/confirmed-response feedback and retries. A 200 response
  without explicit `success: true` cannot produce a booking confirmation.
- Booking availability responses cannot overwrite a newer date selection.
  Occupied slots are disabled, conflict feedback is handled, and confirmed
  database bookings survive downstream email/calendar failures in mocked tests.
- All eight MonePay dialogs, focus containment, Escape/focus return, simulated
  payment/savings state, investment buttons and exact Naira loan calculations.
  Corrected Save/Invest miniature-wallet shortcut labels, pressed states and QR
  semantics. Focusing/tapping the overlapping phone groups now brings the
  active phone forward so its shortcuts are not obscured. No financial API is called.

All final browser programs executed successfully. Earlier scans found and drove
corrections to label-in-name and selected-slide contrast defects; these are not
unresolved failures. SMTP, Calendar and Supabase success/failure paths use local
mocks; those tests do not establish deployed integration health or real database
constraints. No real emails, calendar appointments or customer records were made.

The external lead demo responded HTTP 200, but its document title is still
`Create Next App`. Its deployment/content and external Facebook/X ownership need
manual review; they are outside this repository. Phone, email and WhatsApp URLs
were checked syntactically, without initiating conversations or sending messages.

## C. Security results

| Finding | Severity / disposition | Action |
| --- | --- | --- |
| Public submissions lacked bounded JSON parsing and robust malformed/type/whitespace checks | Medium, fixed | JSON-only, same-origin browser submissions; streamed 32 KiB body cap; normalized contact fields; length/type/email/header-control checks; finite submission timing. Malformed JSON/object payloads return 400; oversized payloads 413. |
| Booking accepted impossible calendar dates and arbitrary consultation types | Medium, fixed | Exact calendar-date validation shared with availability; consultation whitelist preserves the three existing durations; existing weekday, past-time and slot checks retained. |
| Missing public endpoint throttling | Medium, partly mitigated | Bounded, hashed-IP per-instance windows: 10 submissions/10 minutes per endpoint and 60 availability requests/minute. 429 includes Retry-After. Durable edge/shared protection remains required. |
| Missing response security policy | Medium hardening, fixed | nosniff, SAMEORIGIN framing, strict-origin referrers, restricted browser permissions, one-year HSTS without subdomain scope, baseline CSP and no-store API responses. X-Powered-By removed. |
| Accidental future client import of privileged integrations | Medium hardening, fixed | `server-only` boundaries on Supabase admin and Calendar modules; no server credential markers in the 17 generated client JS files scanned. |
| User text in Calendar rich-text descriptions | Low hardening, fixed | Escape user-provided markup before building calendar descriptions; notification email remains plain text. |
| Provider errors could log customer/provider payloads | Low, fixed | Public failures remain generic; server logs retain failure categories rather than whole provider error objects. |
| Development dependency advisory | High, unresolved development-only | npm audit reports one braces stack-exhaustion advisory propagated through five development packages. Registry latest is 3.0.3 and no fix is offered. No forced overrides/downgrades were applied. |

`npm audit --omit=dev` reported **zero production vulnerabilities**. Full audit
reported five high affected package entries, zero critical. The advisory is
[GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). This is a
registry snapshot, not a guarantee against undisclosed vulnerabilities.

A targeted current tracked-source scan found no private-key blocks, AWS access
keys, GitHub token patterns or Supabase JWT credential patterns. Actual cloud
integration credentials were absent; no values were printed. This is not a full
historical secret audit or verification of Vercel's stored environment variables.
The public Supabase URL is not a service-role secret. Privileged keys remain
server-side. User text is rendered through React or sent as plain email text;
there is no user-derived HTML rendering or dynamic redirect destination.

Privileged integration configuration remains a **medium review item**: the current
Calendar helper requests the broad calendar OAuth scope and the database helper
uses an admin/service-role binding. Review a dedicated calendar, event-only scope
and least-privileged database access in staging. No account permission or scope
changes were made without approval. SMTP delivery/DNS authentication, production
RLS/constraints, retention and recovery configuration could not be inspected.

Preview endpoints reject requests before parsing submissions or invoking
integrations; notice dismissal cannot enable them. Calendar/admin helpers also
reject preview use. Preview analytics remain disabled. WhatsApp/mailto/tel links
remain real outbound contact actions and are labelled accordingly.

The new limiter is **not distributed**: serverless scaling/restarts and spoofed
forwarded-IP headers on an improperly configured proxy can bypass instance
quotas. Honeypot/timing checks are heuristics, not bot authentication. Configure a
trusted edge/shared limiter and approved bot protection before enabling live
submissions. The CSP is deliberately a compatible baseline, not a strict nonce
script policy; stage a stricter policy separately rather than breaking Next.js.
No infrastructure or access controls were changed.

## D. Performance results

Measurements use Lighthouse 13.5.0, Chromium 154.0.0.0, Node 24.19.0, optimized
local Next.js builds and no parallel interaction suites during measurement.
Mobile uses Lighthouse simulated throttling: 150 ms RTT, 1,638.4 Kbps throughput,
4x CPU slowdown, 412x823 emulation. Desktop uses Lighthouse's desktop preset.
These are local lab measurements without real CDN/TLS/mobile-network effects.
Vercel Analytics' deployment-only script was blocked in the local production-mode
runs; deployed analytics cost/behavior remains unverified. The final preview-only
menu-clearance rule does not apply to the production profile.

| Route / profile | Performance | FCP | LCP | TBT | CLS | JS transfer |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| / (mobile median of 3) | 94/100 | 0.99s | 2.89s | 126ms | 0.000 | 163.4 KiB |
| / desktop | 100/100 | 0.26s | 0.63s | 34ms | 0.000 | 175.7 KiB |
| /services | 97/100 | 0.91s | 2.59s | 85ms | 0.000 | 168.2 KiB |
| /products | 96/100 | 0.91s | 2.74s | 87ms | 0.000 | 168.2 KiB |
| /about | 96/100 | 0.91s | 2.69s | 83ms | 0.000 | 168.2 KiB |
| /contact | 96/100 | 1.39s | 2.66s | 77ms | 0.000 | 163.4 KiB |
| /book | 97/100 | 0.91s | 2.62s | 47ms | 0.000 | 170.9 KiB |
| /website-packages | 96/100 | 0.91s | 2.61s | 79ms | 0.000 | 173.0 KiB |
| /demo/fintech | 95/100 | 0.93s | 2.76s | 132ms | 0.000 | 151.4 KiB |

The homepage summary uses three cold mobile runs and medians for each metric;
other routes are single mobile runs. Individual results are retained in
[the measured JSON](phase-3.8-performance-results.json). Raw Lighthouse JSON/HTML
and screenshots accompany the workspace audit artifacts.

LCP on several mobile runs exceeds the 2.5 s good threshold. TBT and CLS are strong,
but these results do **not** establish passing field Core Web Vitals. INP was not
measured: Lighthouse TBT is a lab diagnostic, not a replacement for field INP.
Collect real-user LCP/INP/CLS on an approved staging/release setup and investigate
font/render timing if mobile LCP remains elevated.

Existing local variable fonts, compressed assets, server-rendered page content,
Next.js route splitting and reduced-motion behavior are retained. No large image
assets are requested by the code-based homepage showcases. Runtime dependencies
were not added; browser/axe tooling is development-only. Server-only boundaries
protect the client bundle from privileged integration SDKs. The audit did not
remove useful interactions or force a framework/polyfill change for a small score
gain. Lighthouse still identifies roughly 29 KiB of unused framework JavaScript
and about 14 KiB of legacy compatibility code as optimization opportunities.

## E. SEO and accessibility

Fixed duplicate inherited homepage titles/canonicals on the five main secondary
pages and fintech demo; completed package-specific sharing metadata. All eight
pages now have unique titles/descriptions, canonical production URLs, Open Graph
and Twitter metadata. Existing sharing image assets are used consistently.
Organization JSON-LD uses only the verified corporate name, URL, email and phone,
without invented reviews, ratings, certifications or performance metrics.

Production robots allow public pages, disallow API crawling and advertise the
sitemap. The production sitemap includes all eight existing public URLs without
invented modification dates. Both behavior and HTTP output were executed against
an isolated local production-mode build. No live form requests were made there.
Preview uses three indexing barriers: noindex/nofollow metadata, X-Robots-Tag and
robots disallow-all; its sitemap is empty. Preview Lighthouse SEO 66 is the
expected consequence of intentionally blocking indexing, not a reason to remove
safeguards. The local production-mode SEO score is 100.

Accessibility fixes include matching visible/accessibility names for menu/logo,
workflow and package controls, readable contrast on every selected carousel slide,
and labelled booking forms with busy/loading/error status announcements. Automated
axe checks include WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tags. All routes and selected
carousel states passed the executed scans; keyboard, focus, touch, dialog and
reduced-motion scenarios also passed. These scans and a Lighthouse accessibility
score of 100 are not full WCAG certification. VoiceOver/TalkBack, high zoom,
physical-device and assistive-technology review remain necessary.

## F. Mobile compatibility

Required widths tested: **320, 360, 375, 390, 430, 768, 1024, 1440px**; route
regression also checks 1280px. Testing used Linux Chromium desktop and Chromium
mobile viewport/touch simulations, including light and dark appearance preferences.
Safari/WebKit, Firefox and physical Android/iPhone browsers were unavailable.
The restored preview was checked again for disabled submissions and noindex.

No page-width overflow remained in executed layouts. The comparison table and
bounded hero mockup intentionally retain their own accessible scrolling; they are
not page overflow. Solution details and mobile process panels grow naturally.
Some fictional phone-app showcase concepts require scrolling within their bounded
canvas; controls remain outside it. This behavior is preserved, not claimed to be
a fully flattened mockup on every phone.

Fresh workspace screenshots cover mobile hero/notice at 320/390/430px, solutions,
workflow, planner, menu, footer and a 1440px desktop hero. They are browser
simulations, not photographs of physical devices.

## G. Changes and verification

Implementation areas:

- `app/lib/submissionSafety.ts`, the three API routes, `ContactForm.tsx` and
  `BookingForm.tsx`, plus `PackageQuotationLink.tsx`: bounded inputs, throttling,
  submission/race/feedback fixes and non-destructive package navigation.
- `app/components/usePlannerSelections.ts`, `SmartProjectPlanner.tsx`: validated
  tab-session selection persistence without storing contact identity/free text.
- `SiteHeader.tsx`, `ProjectWorkflow.tsx`, `globals.css`: semantic names and scoped
  contrast corrections; no redesign. MonePay fixes align shortcut labels, active
  investment semantics, QR labelling and unobscured phone focus/pointer interaction.
- `app/lib/metadata.ts`, page metadata, fintech layout, root layout, robots and
  sitemap: canonical/sharing/indexing/structured data.
- `app/lib/googleCalendar.ts`, `supabaseAdmin.ts`, `next.config.ts`: server-only
  boundaries, security headers and preview indexing headers.
- `tests/`, package scripts/dev dependencies, README and QA documentation:
  reproducible local-only browser and mocked server checks.

Executed: ESLint; TypeScript; optimized preview and isolated local production-mode
builds; eight Node test groups including 9,600 planner cases; seven browser test
programs; dependency audits; current source/client-bundle boundary scans; the final eleven
production-mode Lighthouse measurements and preview Lighthouse checks. All final
application assertions passed; the development dependency advisory remains open.
See [reproduction and safety instructions](qa-testing.md).

The final commit hash and successful branch deployment status are supplied with
the final review response. Branch preview:
https://monetcore-website-git-feature-monetcore-stage1-cb77ac-monetcore.vercel.app

Vercel login protects the preview, so remote UI was not audited through that login
barrier. Local builds supply the browser evidence. Access to monetcore.dev itself
was denied by the cloud HTTP proxy; live production headers, CDN, SEO responses,
credentials and real service health could not be verified.

## H. Production readiness checklist

Ready in code:

- [x] Corporate identity/design, navigation, product/platform functionality retained.
- [x] Executed functional, responsive, accessibility, lint, type and build checks.
- [x] Preview submission isolation and search-indexing protection.
- [x] Production canonical/robots/sitemap behavior tested locally.
- [x] Application-level validation, duplicate guards, scoped hardening and tests.

Required before production sign-off:

- [ ] Use isolated staging SMTP/Supabase/Calendar bindings to verify real end-to-end
  delivery, booked-time conflict behavior, calendar sync and partial-failure recovery.
- [ ] Verify the real database enforces an atomic non-cancelled date/time uniqueness
  constraint and that service-role/calendar access is appropriately scoped. Do not
  alter production schema or permissions without approval.
- [ ] Configure durable trusted-edge/shared rate limiting and approved abuse
  protection; decide operational retry/monitoring and customer-data retention.
- [ ] Approve proposed package/renewal prices for public publication and confirm
  external demo/social URLs and the existing business address.
- [ ] Review physical Android Chrome, iPhone Safari and assistive-technology flows.
- [ ] Review mobile LCP on an approved staging deployment and arrange field
  CWV/INP monitoring for release.
- [ ] Resolve or explicitly accept the development-only dependency advisory while
  awaiting an upstream fix; avoid unreviewed forced overrides.
- [ ] Review privacy information appropriate to collecting project/customer details.
- [ ] Explicitly approve production release. No merge/deploy is authorized by this audit.
