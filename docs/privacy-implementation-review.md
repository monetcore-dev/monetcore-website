# Privacy implementation review — 21 October 2026

Branch: feature/monetcore-stage1-websites. Local implementation only; no commit,
push, deployment, environment configuration change or external integration call.
Earlier uncommitted pricing/renewal changes and SQL drafts are preserved.

## Changes in this task

- app/privacy/page.tsx: static, responsive policy with canonical/social metadata,
  accessible contents navigation, approved identity/contact/retention/marketing
  rules, audited data flows, manual-deletion limitation and conditional rights.
- app/components/PrivacyNotice.tsx: shared linked enquiry/booking notice.
- app/ContactForm.tsx: presentational notice only, beside submit controls. Existing
  quotation checkbox, fields, validation and submission logic remain unchanged.
- app/book/page.tsx: notice outside the existing form in a minimal grid wrapper;
  no BookingForm implementation, field, state, submission or API change.
- app/contact/page.tsx: removes Google Maps iframe entirely, retains full office
  address and external Open in Google Maps link with new-tab screen-reader text.
- app/components/SiteFooter.tsx: permanent Company-column Privacy Policy link.
- app/lib/metadata.ts: /privacy added to public routes, hence production sitemap.
- tests/browser-privacy.mjs: focused local browser/accessibility regression program.
- tests/qa.test.mjs: sitemap expectations updated from 21 to 22 public routes.

Analytics in app/layout.tsx is unchanged. No booking API/helper, AI Core, package
amount, renewal scope, credential, provider configuration or production resource
was modified by this privacy task.

## Executed verification

- TypeScript, ESLint and optimized production build in local preview mode passed.
- Four catalog/logic tests passed; one targeted SEO/indexing test passed.
- All 22 locally rendered public pages returned 200 and had shared privacy links;
  1,288 internal link references/fragments resolved in the local route inventory.
- Chromium checks at 320/390/768/1440px passed for privacy/contact/booking pages:
  metadata, native keyboard contents links, contact/mailto/map/privacy links,
  form notices and no horizontal overflow. Dark preference tested at 390px.
- Axe WCAG-tagged automated checks at 390/1440px reported no violations for those
  pages. This is not full WCAG certification or a manual screen-reader audit.
- Shared enquiry notices verified on homepage, contact/product-prefill and website
  quotations; quotation consent checkbox remains required and unchanged.
- No Google Maps iframe remains. Browser checks recorded zero external requests,
  API calls or page exceptions. No form was submitted or email sent.
- Protected backend, BookingForm and analytics/AI Core source comparisons are clean.

Physical Android/iPhone/Safari, active production analytics/cookie behavior,
provider account configuration and external inbox/database behavior were not tested.

## Decisions required BEFORE publication

1. Analytics: code still mounts Vercel Analytics outside review previews, without
   an on-site consent/preference gate. Verify actual network/storage behavior and
   project settings, then approve lawful basis and any required consent/withdrawal
   controls. Do not infer cookie-free or anonymous operation from this review.
2. Providers/transfers: verify contracting entities, processing regions, account
   terms/DPAs, subprocessors and the applicable NDPA international-transfer basis.
   The policy names observed services without inventing those arrangements or
   claiming implemented transfer safeguards.
3. Retention operations: assign an owner and approve manual review/deletion across
   email, Supabase, Calendar and backup copies. Confirm active-project, financial,
   security-log and backup retention and how cancelled appointments are treated.
   Approved unsuccessful-enquiry and booking periods are already in the policy;
   no deletion automation was introduced or claimed.
4. Requests/security: approve request verification/response and incident procedures,
   authorized staff access and the handling of justified retention exceptions.
5. Legal/publication: approve purpose-specific lawful bases and final Nigerian legal
   wording. Approve the effective/publication date; no unapproved date or placeholder
   was published in the page. Promotional communications remain a separate voluntary
   opt-in requirement with unsubscribe; no marketing subscription feature was added.

The Maps privacy exposure is reduced by requiring visitors to follow an external
link. That link remains governed by Google's processing once opened; it is not a
claim about Google's cookies or contract terms. This work does not certify NDPA
compliance or authorize production publication.

## Subsequent approved analytics pause — 21 October 2026

This supersedes the earlier current-state note that analytics was unchanged/enabled.
app/layout.tsx now has an explicit false code-level release switch; the Analytics
SDK import, dependency and rendering path remain for a later reviewed re-enable.
The policy's purpose/provider/analytics text reflects the disabled state without
claiming the website is tracking-free or cookie-free. No environment setting was
changed. Before re-enabling, verify actual provider collection/storage and approve
the lawful basis, transfer arrangements and any necessary consent controls.

Executed: TypeScript, ESLint, optimized local production-mode build, and
browser-analytics-disabled.mjs passed. The Chromium program checked all 22 routes,
client-side navigation and mobile/tablet layouts (320/390/768px plus 1440px default).
No Vercel Analytics script injection, window.va initialization, known analytics/ad
tracker requests, external/API calls or page errors were observed. It also checked
the policy notice, shared footer links and absence of a contact map iframe.

This is local release-build evidence, not a test of the currently deployed website
or Vercel dashboard settings. No new tracker was added. Earlier approved pricing,
renewal terms, form notices and map changes remain. Booking/customer enquiry logic
and AI Core are unchanged. No commit, push, deployment or production action occurred.
