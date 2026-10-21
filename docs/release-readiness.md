# Final corporate website release — approved local commit

Branch: `feature/monetcore-stage1-websites`.
Parent commit: `65471f6cc8d6d2e683c4c0ea96fa5975567155e3`.
Owner authorized local updates and commit on 21 October 2026 (Africa/Lagos).
No push, merge, deployment, provider-resource write, saved environment change,
real email/booking, paid inference or cloud provisioning is authorized here.
The exact release commit SHA is recorded by Git, not self-embedded in this file.

## Status

Local application checks PASS; approved business publication changes are complete.
Deployment authorization remains NOT READY until an operator verifies the current
Vercel rollback target and actual Production AI flags described below. Dashboard
access is not available in this execution environment. No values were inspected
or changed. Default-disabled code is verified, not deployed configuration.

No OpenAI or assistant Redis provisioning is needed for this inference-disabled
website release. Those services' managed compatibility/pricing/privacy gates apply
before separately approved AI activation, not before deploying disabled code.

## Owner-approved publication decisions applied

- Smart Starter: ₦99,000 one-time package setup, annual renewal ₦45,000.
- Smart Business: ₦179,000 one-time package setup, annual renewal ₦60,000.
- Smart Business Pro: starting from ₦299,000, annual renewal from ₦90,000.
- Existing first-year standard domain, hosting and SSL inclusions unchanged.
- Renewal includes standard domain renewal subject to terms, hosting, SSL and
  basic technical support for the existing website. Existing exclusions for
  redesigns, new pages/features, integrations, major content updates, premium
  domains and third-party charges remain. No unlimited support/AI or guaranteed
  uptime is promised. Custom scope and optional work require a written quotation.
- Removed proposed/business-approval-pending pricing from pages, navigation,
  comparison, quotation options, WhatsApp text, notification text and AI knowledge.
  Planned-product and disabled-AI disclosures deliberately remain unchanged.
- Monetcore System Solutions accepts privacy-request and manual retention/deletion
  responsibility. The 12-month enquiry and booking periods, exceptions, contact
  address and separate voluntary marketing opt-in remain. No automated deletion
  is claimed.
- Provider data-processing and international-transfer arrangements remain pending
  review. The public policy explicitly says they have not been confirmed approved
  or completed. No provider agreement, processing region, transfer safeguard,
  certification or legal-compliance guarantee was invented. Owner approval of
  manual privacy operations does not resolve those reviews.

## Preserved functionality and private AI controls

Corporate-first design, hero/AI Core, services/products, demos, navigation and
responsive layouts are preserved. Homepage/header/service/contact edits only
update package wording. Contact API edits only update three notification-text
lines; a reverse-substitution comparison against the parent proved its SMTP,
validation and submission code unchanged. ContactForm edits are wording only.
Booking APIs/form, Supabase/Calendar helpers, submission/rate-limiting logic,
AI Core, analytics code, dependencies and OpenAI pricing/provider modules are
unchanged from the parent commit. Existing booking/contact integrations were
exercised via mocks, not against production resources.

The assistant interface and prior owner authentication work are included. Its
public footer promotion and sitemap entry were removed. Production Proxy only
matches /assistant and /api/assistant, never booking/contact/homepage. With AI off,
page/API/query variants return 503 with no-store/noindex and no selector or owner
interface. Authentication, exact domain/branch matching, missing config, shared
permanent 20-admission cap, budgets, concurrency and stop checks have mocked
coverage. Actual admission/recheck Lua text is unchanged. Assistant Redis has
separate variables and rejects a hostname matching the shared business Redis URL.
Neither activation flag is set by application defaults or this release task.

## Final executed verification

- TypeScript `npm run typecheck`: PASS.
- ESLint `npm run lint`: PASS, no lint errors/warnings.
- `npm test`: 56/56 PASS, zero failures. Adds approved commercial-contract and
  planned-product disclosure regressions; all prior booking/contact/AI tests pass.
- Optimized guarded Preview-emulation build: PASS.
- `npm run test:browser`: all 13 scripts PASS. Includes internal links, menus,
  package selection/enquiry validation, demos, planner, AI Core pause/reduced
  motion, booking conflicts/partial outcomes, responsive and accessibility checks.
- Separate browser-privacy.mjs and browser-assistant.mjs: PASS.
- Optimized Production-emulation build: PASS with all AI flags forced false.
- browser-release.mjs: PASS across all 22 public routes, approved price/privacy
  wording, metadata/canonicals/indexing, contacts, footer links, eight widths
  320/360/375/390/430/768/1024/1440, browser light/dark preferences, axe, blocked
  public AI page/API/controls and sitemap exclusion.
- browser-analytics-disabled.mjs: PASS across all 22 routes and client navigation;
  no Analytics script/window.va, tracker or external/API traffic, no Maps iframe.
- `git diff --check` and approved-path/credential-pattern review: PASS.

Browser tests used local Chromium emulation, not physical Android/iPhone/Safari.
All external browser requests were denied. Valid business submissions and provider
outcomes were intercepted/mocked; no SMTP inbox, live Calendar/DB booking, OpenAI
or Upstash service was used. Test processes had inference disabled; server test
credentials were blanked in temporary process environments only. No project or
Vercel environment settings were modified. Existing Node MODULE_TYPELESS_PACKAGE_JSON
notices are test-runner warnings, not app exceptions or ESLint failures. No
framework/dependency changes were made to suppress them.

## Required operator preflight — no dashboard access available

1. Vercel > monetcore-website > Deployments > Production > CURRENT deployment:
   record immutable deployment ID/URL, source SHA and creation time; verify
   monetcore.dev is its alias and that this retained successful artifact is
   eligible for the account's rollback workflow. Do not click rollback/redeploy.
   https://monetcore.dev alone is not an immutable rollback identity. No deployment
   ID was guessed. The local origin/main SHA below is NOT proof of deployed code.
2. Vercel > project Environment Variables > Production: confirm
   AI_ASSISTANT_ENABLED, AI_OWNER_TEST_ENABLED and STAGING_AI_ASSISTANT_ENABLED
   are absent or exactly false, including any shared applicable settings.
   Share only boolean confirmation, never credentials. Preserve existing SMTP,
   Supabase, Calendar and shared limiter bindings/resources; do not substitute
   staging resources. This code review cannot verify dashboard values.
3. After those observations, owner separately authorizes push and deployment of
   the reviewed release artifact to monetcore.dev using the existing Vercel
   workflow. No main merge, DNS change or AI activation is implied. Preview/branch
   settings must not replace Production integration settings.

Rollback after separately authorized deployment means restoring the verified
prior Production artifact through Vercel while retaining AI-off settings and
existing business resources. Do not reset database records, replace credentials
or alter DNS to roll back code. New live submission tests need safe authorization.

## Exact local release commit file list

Commit message: `Finalize approved website pricing privacy and disabled AI release`.
Stage ONLY these 32 approved files; earlier corporate redesign commits are
already in branch history and are not re-staged:

```
app/ContactForm.tsx
app/api/assistant/route.ts
app/api/contact/route.ts
app/assistant/page.tsx
app/components/SiteFooter.tsx
app/components/SiteHeader.tsx
app/components/SolutionExplorer.tsx
app/components/catalog/OfferingOverview.tsx
app/components/catalog/ServiceDetail.tsx
app/config/projectPlanner.ts
app/config/websitePackages.ts
app/lib/assistant/access.ts
app/lib/assistant/controls.ts
app/lib/assistant/knowledge.ts
app/lib/assistant/measurements.ts
app/lib/metadata.ts
app/page.tsx
app/privacy/page.tsx
app/website-packages/page.tsx
docs/ai-assistant-owner-test.md
docs/ai-assistant-staging-run.md
docs/ai-assistant-v1.md
docs/privacy-implementation-review.md
docs/release-readiness.md
proxy.ts
tests/assistant-owner.test.mjs
tests/assistant-staging-run.test.mjs
tests/assistant.test.mjs
tests/browser-packages.mjs
tests/browser-release.mjs
tests/publication.test.mjs
tests/qa.test.mjs
```

These four unrelated untracked files remain untouched and UNSTAGED:

```
docs/staging-bookings-schema-review.md
docs/staging-bookings-sql-validation.md
scripts/staging/bookings-schema.draft.sql
scripts/staging/bookings-schema.sql
```

## Full branch release-file manifest

The following 140 paths combine prior branch history and this approved local
release relative to local origin/main at `9f1087076da240b6d8c0f0e85779ab8dd3323c2b`.
That reference was not fetched or assumed to identify the Production deployment.
Do not re-stage historical files or include the four excluded booking files.

```
README.md
app/BookingForm.tsx
app/ContactForm.tsx
app/about/page.tsx
app/api/assistant/route.ts
app/api/book/availability/route.ts
app/api/book/route.ts
app/api/contact/route.ts
app/assistant/AssistantChat.tsx
app/assistant/page.tsx
app/book/page.tsx
app/components/AICore.tsx
app/components/AutomationSimulation.tsx
app/components/CorporateFAQ.tsx
app/components/HeroShowcase.tsx
app/components/PackageQuotationLink.tsx
app/components/PreviewNotice.tsx
app/components/PrivacyNotice.tsx
app/components/ProjectPlanContext.tsx
app/components/ProjectWorkflow.tsx
app/components/SiteFooter.tsx
app/components/SiteHeader.tsx
app/components/SmartProjectPlanner.tsx
app/components/SolutionExplorer.tsx
app/components/ai-core.css
app/components/catalog/OfferingOverview.tsx
app/components/catalog/OfferingSchema.tsx
app/components/catalog/ProductDetail.tsx
app/components/catalog/ProductExperience.tsx
app/components/catalog/ServiceDetail.tsx
app/components/catalog/ServiceExperience.tsx
app/components/demos/AssessmentDemo.tsx
app/components/demos/BookingDemo.tsx
app/components/demos/ConversationDemo.tsx
app/components/demos/LeadDemo.tsx
app/components/demos/MarketingDemo.tsx
app/components/demos/MobileDemo.tsx
app/components/demos/WebsiteDemo.tsx
app/components/demos/WorkflowDemo.tsx
app/components/demos/WorkspaceDemo.tsx
app/components/usePlannerSelections.ts
app/config/assistantTestCases.ts
app/config/corporateSolutions.ts
app/config/demoPlanning.ts
app/config/enquiryInterests.ts
app/config/offeringCatalog.ts
app/config/offeringNavigation.ts
app/config/projectPlanner.ts
app/config/websitePackages.ts
app/contact/page.tsx
app/demo/fintech/layout.tsx
app/demo/fintech/page.tsx
app/fonts/inter-OFL.txt
app/fonts/inter-latin-variable.woff2
app/fonts/manrope-OFL.txt
app/fonts/manrope-latin-variable.woff2
app/globals.css
app/layout.tsx
app/lib/assistant/access.ts
app/lib/assistant/controls.ts
app/lib/assistant/knowledge.ts
app/lib/assistant/measurements.ts
app/lib/assistant/pricing.ts
app/lib/assistant/provider.ts
app/lib/googleCalendar.ts
app/lib/metadata.ts
app/lib/previewSafety.ts
app/lib/stagingBooking.ts
app/lib/submissionSafety.ts
app/lib/supabaseAdmin.ts
app/offering.css
app/page.tsx
app/privacy/page.tsx
app/products/[slug]/page.tsx
app/products/page.tsx
app/robots.ts
app/services/[slug]/page.tsx
app/services/page.tsx
app/sitemap.ts
app/website-packages/page.tsx
docs/ai-assistant-cost-policy.md
docs/ai-assistant-owner-test.md
docs/ai-assistant-staging-run.md
docs/ai-assistant-v1.md
docs/ai-core-hero-review.md
docs/booking-database-review.md
docs/design-system.md
docs/font-assets.md
docs/interactive-experience.md
docs/mobile-review.md
docs/offering-expansion-report.md
docs/offering-performance-results.json
docs/phase-3.8-audit.md
docs/phase-3.8-performance-results.json
docs/phase-3.9-performance-results.json
docs/phase-3.9-production-readiness.md
docs/privacy-implementation-review.md
docs/qa-testing.md
docs/release-readiness.md
docs/site-architecture.md
docs/staging-booking-safety.md
docs/staging-booking-verification-plan.md
docs/staging-preparation-report.md
docs/staging-smtp-testing.md
next.config.ts
package-lock.json
package.json
proxy.ts
scripts/staging/local-check.mjs
scripts/staging/schema-inspection.sql
tests/assistant-owner.test.mjs
tests/assistant-staging-run.test.mjs
tests/assistant.test.mjs
tests/browser-ai-core.mjs
tests/browser-analytics-disabled.mjs
tests/browser-assistant.mjs
tests/browser-audit.mjs
tests/browser-booking-conflicts.mjs
tests/browser-booking-demo.mjs
tests/browser-booking-outcomes.mjs
tests/browser-home.mjs
tests/browser-mobile.mjs
tests/browser-motion.mjs
tests/browser-offering-qa.mjs
tests/browser-packages.mjs
tests/browser-privacy.mjs
tests/browser-product-experiences.mjs
tests/browser-release.mjs
tests/browser-routes.mjs
tests/browser-service-experiences.mjs
tests/catalog.test.mjs
tests/integrations.mjs
tests/publication.test.mjs
tests/qa.test.mjs
tests/register.mjs
tests/server-only.mjs
tests/staging-booking.test.mjs
tests/staging/fixtures.mjs
tests/staging/offline-guard.mjs
tests/staging/preparation.test.mjs
```
