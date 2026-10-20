# Services, products and interactive experiences expansion

20 October 2026 (Africa/Lagos). Development branch: `feature/monetcore-stage1-websites`. Starting application commit: `cd15602`. Production remains unchanged; this is a review-preview expansion, not a production launch.

## Completed scope

Seven dedicated services and six dedicated product pages now sit alongside the original eight public routes. The corporate homepage hero, positioning, rotating showcase, existing interactions, MonePay route and pricing configuration are preserved. Homepage highlights add mobile development and digital marketing without removing the existing capabilities. Overview pages, navigation and footer link to the expanded architecture.

Each detail page includes a premium responsive hero, scope/availability context, challenges or intended audience, capability list, illustrative Nigerian use case, delivery approach, interactive local experience, related pages, FAQs and contextual quotation/consultation links. The shared page system uses light mobile surfaces, selected navy/indigo accents, local fonts, native controls and reduced-motion-compatible interactions. No human imagery or new third-party media assets were introduced; no licensing or fabricated client claims were added.

## New service pages

| Page | Route | Interactive experience |
| --- | --- | --- |
| AI Automation | `/services/ai-automation` | Five rule-based conversation scenarios: support, receptionist, lead qualification, WhatsApp workflow and scheduling. Prompts, text input, handoff/opt-out examples and reset. |
| Custom Software Development | `/services/software-development` | Synthetic CRM, inventory, sales analytics and operations workspace. Search/empty state, pipeline filtering/stage updates, stock adjustments, native meter charts and local task completion. |
| Website Development | `/services/website-development` | Three fictional website mockups with Home/Services/Enquiry navigation and local enquiry previews. Existing package comparison and quotation links preserved. |
| Business Systems & Integrations | `/services/business-integrations` | Selectable systems and workflow templates, human approval, staged progression, simulated handoff failure/retry, replay and reset. |
| Mobile App Development | `/services/mobile-app-development` | Unpublished fictional app: Home, Catalogue, Request and Activity; sample selections and local request preview. |
| Digital Marketing & Growth | `/services/digital-marketing` | Industry/goal/platform/duration planner, deterministic strategy, content calendar/copy, consent-oriented handoff and fictional reporting metrics. No ads or publishing. |
| Technology Consulting | `/services/technology-consulting` | Challenge selection and a rule-based illustrative technology roadmap with validation/reset. |

The marketing page covers all requested channels and capabilities, including social management/content/design/video, Meta/Google advertising, SEO, lead generation, landing pages, WhatsApp/email, automation, CRM nurturing and reporting. Service pricing is quotation-based; no new price was invented.

## New product pages and status

| Product | Route | Actual scope / maturity |
| --- | --- | --- |
| Monetcore AI Lead Automation | `/products/ai-lead-automation` | New local lead-capture/qualification/pipeline/follow-up simulation; existing external prototype linked with an unverified-readiness warning. Not represented as a production-ready commercial system. |
| Monetcore Smart Booking | `/products/smart-booking` | Local reservation/availability/occupied-slot/cancellation/rebooking dashboard with simulated Calendar/notification steps. Existing company booking workflow is separately linked and operational by owner confirmation; standalone product/reminder capabilities remain concepts. |
| Monetcore AI Receptionist | `/products/ai-receptionist` | Planned product with a rule-based conversation simulation, appointment-request and human-handoff examples. No live AI or telephony. |
| Monetcore CRM | `/products/crm` | Planned product with synthetic CRM/pipeline/inventory/reporting interactions; no hosted account or server persistence. |
| Monetcore Business Automation | `/products/business-automation` | Planned product with local workflow template/builder, approval and recovery examples. No connected provider. |
| Monetcore AI Marketing Manager | `/products/ai-marketing-manager` | Planned product with local campaign/calendar/content/reporting simulation. No generative AI provider, publishing or ad accounts. |

Existing `/demo/fintech` remains MonePay, the fictional interactive prototype. `/website-packages`, its prices/renewals/conditions and package enquiry flow remain intact. No `get-a-website` landing page, new purchasable product, real AI integration, provider connection or paid infrastructure was introduced.

## Navigation, forms and SEO

- Desktop/mobile service mega menu links directly to all seven categories. Product navigation includes overview, all six products, website packages and existing digital applications. Company links remain intact. Expanded desktop panels scroll within the viewport; mobile retains click/touch/keyboard disclosure behavior.
- `/services#ai-automation`, `#custom-software`, `#ai-sales-systems`, `#business-integrations`, `/products#ai-lead-automation` and `#smart-booking` continue to resolve to overview anchors. Existing routes were not redirected or removed.
- Detail-page links carry only validated catalog identifiers, e.g. `/contact?interest=service%3Adigital-marketing#consultation` or `/book?interest=product%3Acrm`. Server-side resolution maps known identifiers to supported service options and editable messages. Unknown, repeated or malformed identifiers are ignored. Arbitrary query text is not echoed into forms.
- Contact and booking keep original personal fields and submission logic, with relevant service options added. Website package and planner pathways retain their behavior. No new submission endpoint is introduced.
- Unique titles/descriptions, production canonical/Open Graph URLs and breadcrumb JSON-LD cover all detail pages. Production sitemap includes 21 public routes; review previews remain noindex with an empty sitemap and blocked integration endpoints.
- Company details remain hello@monetcore.dev, tel:+2347065880558 and https://wa.me/2347065880558. All displayed sample monetary values use Naira; package values continue to come from the existing configuration.

## Safety boundary

All new demos are local client state. Conversation replies, planning outputs and sample metrics are deterministic examples, not live AI/results. Demo changes disappear on reload. No customer data, provider credentials or personal contact information is required. No fake purchase or activation is offered. External prototype links remain outside the verified local simulation boundary and are clearly labelled.

A source diff against cd15602 shows no changes to API routes, Supabase/Calendar helpers, preview safety, SMTP settings or website pricing configuration. Ordinary quotation/consultation links can lead to existing forms, whose real submissions remain disabled in the review preview. No live integration test, database/policy/index/permission change, production environment change, charge, email, Calendar event or customer booking was performed.

## Milestones and commits

1. `2e91868`: route architecture/catalog, mega menus and sitemap; lint, optimized build and existing server suite passed.
2. `567efe9`: detailed service-page system; lint and TypeScript passed.
3. `d1338c9`: seven service simulations and planning tests; lint/build/server checks and mobile service-demo interactions passed.
4. `fd4d8c5`: product-detail content/status system; lint and TypeScript passed.
5. `0caf44d`: isolated product simulations; build and all six product-demo checks passed.
6. Final integration/responsive/QA commit: identifier supplied in delivery message after verification and commit.

No intermediate milestone was pushed before completing the expansion. An early mobile mockup syntax error was corrected before milestone validation. Product-test selectors were corrected to check native disabled-option state and include a decorative arrow in an accessible name. The booking demo uses a fixed fictional date to avoid static-prerender/hydration differences as the real clock advances.

## Verification and limitations

Final verification results and measured local performance are recorded below after execution. Automated browser checks use Chromium desktop/touch emulation; they are not actual Android Chrome, iPhone Safari or assistive-technology certification. Local mocks cannot establish real email/Calendar/Supabase/Redis reliability. No new production-readiness claim is implied by completed page/demo work.

### Final executed checks

- ESLint and TypeScript passed; the optimized Next.js production build passed with `VERCEL_ENV=preview` safeguards.
- `npm test`: 17 groups passed, 0 failed/skipped. Includes 540 valid campaign combinations, all 32 challenge combinations, 9,600 existing project-planner combinations, catalog/prefill validation, booking tracking/conflict/public-response safeguards and SMTP mocks.
- `npm run test:staging:local`: 9 groups passed, 0 failed/skipped, with sockets blocked and providers mocked.
- All 11 browser programs passed on the final application build. The first wrapper run stopped at the old outside-click target; after correcting it, the ten legacy/demo programs and the new offering QA program were executed successfully. Tests were not weakened or skipped. The new axe runner was corrected to create an explicit browser context as required by its tooling.
- Existing eight-page regression: navigation keys/focus/outside clicks, responsive menus, footer/internal links, carousel controls, workflow/planner/FAQ, package prices/consent/prefill and intercepted contact/booking flows passed. Booking race/duplicate-submit/409 refresh checks passed.
- New-page QA: 13 routes returned 200; correct canonical metadata, breadcrumb JSON-LD, status disclosures, links/fragments and keyboard FAQ toggles. No horizontal page overflow at 320, 360, 375, 390, 430, 768, 1024 and 1440 px. Existing pages also exercised at 1280 px. Automated axe checks reported no violations in the tested initial states; this is not a full WCAG conformance certification.
- All 26 contextual contact/booking prefills and invalid-query rejection passed. New mobile menu links navigated and closed correctly.
- New service/product interaction programs passed and observed zero application API requests and zero browser exceptions. Existing simulated booking/UI tests used intercepted responses; no real emails, events or customer records were created.
- Generated client JavaScript contained none of the reviewed server-secret variable names. This is a targeted exposure check, not a forensic secret audit.
- Documentation/link and diff checks passed. No runtime dependency or lockfile change was required.

Screenshots and accessibility evidence: `/workspace/artifacts/offering-expansion/` contains mobile/desktop full-page views, readable viewport captures (`marketing-hero-390.png`, `software-hero-1440.png`) and `accessibility.json`. Browser emulation is Chromium only; actual Android/iPhone Safari and assistive-technology testing remain manual review items.

### Outstanding items

The standalone planned products remain concepts with local demos, not supported SaaS releases. The external lead prototype is preserved but its provider integration/data handling/commercial readiness is not verified. Service availability, pricing beyond the existing proposed website packages, delivery scope, support and provider costs require business agreement. Demo metrics are fictional; no guaranteed marketing outcome is offered.

Existing launch blockers remain: approved isolated integration/concurrency/recovery evidence, exact booking index/grant review, durable shared/global abuse controls, idempotency/reconciliation, privacy/retention/content approvals, development dependency advisory disposition and explicit production authorization. None was bypassed by this website expansion. No Redis, paid service, production configuration or database change is introduced.

### Measured local performance

Lighthouse 13.5.0, Chromium 154, optimized preview-mode build on loopback. Each page was measured once, serially after interaction suites finished, with Lighthouse mobile emulation (412×823, simulated 150ms RTT / 1,638.4Kbps / 4× CPU slowdown). These are lab snapshots, not medians, Vercel CDN measurements or field Core Web Vitals. INP was not measured.

| Page | Performance | FCP | LCP | TBT | CLS |
| --- | --- | --- | --- | --- | --- |
| Homepage | 95 | 1.07s | 2.87s | 94ms | 0 |
| Digital Marketing | 95 | 1.06s | 2.86s | 99ms | 0 |
| Smart Booking product | 98 | 0.91s | 2.11s | 104ms | 0 |

Accessibility and best practices scored 100 on these three reports. SEO scored 66 because review previews intentionally prevent indexing; production canonicals and indexing policy remain covered by separate checks. Homepage/marketing LCP still exceed 2.5s and need further measured optimization; no guaranteed improvement over the prior lab baseline is claimed. No heavy runtime dependency was added or interactivity removed for a score.

Exact measurements and environment: [offering-performance-results.json](offering-performance-results.json). Raw Lighthouse JSON reports are in `/workspace/artifacts/offering-expansion/`. Product simulation scores do not establish backend readiness.
