# Product cleanup and marketing readiness — local review

Branch: `feature/phase2-clean-review`. Preserves the pending PageHero work, all
23 internal banners and the corporate-first homepage. No commit, push, deployment,
VPS/infrastructure/configuration or AI API change is part of this task.

## Retired brand audit and replacements

Searches covered application/configuration, public assets and filenames, metadata,
JSON-LD surfaces, navigation/footer, tests and documentation, including casing,
space/hyphen/underscore and alternate `MoneyPay`/`MonPay` forms. Browser checks scan
rendered HTML (including metadata/structured data) for the retired brand.

| Prior public surface | Local replacement |
| --- | --- |
| Homepage FAQ | Honest product-concept/service-demonstration distinction |
| Desktop/mobile Products menu | Four links: overview, ideas/categories, Fintech Products, website packages |
| Products overview legacy application card | Fintech Products category and scoped software services |
| `/demo/fintech` and its branded interface, dialogs and local footer | Permanent HTTP 308 redirect to `/products/fintech-products` |
| Old demo title, description/social metadata and canonical context | Fintech Products category metadata |
| Sitemap | Old URL removed; new category included; six concept detail pages omitted |
| Five unused named images in `public/images/` | Moved byte-for-byte to unserved `archive/fintech-assets/` |

Fintech Products is explicitly not a launched payment application. Its shared
financial-technology SVG hero and quotation/consultation/WhatsApp links make no
claim about processing funds, licensing, certifications or operational providers.
Quotation and booking use the existing software-development interest prefill.

Remaining source references are intentional and unserved: the original code-only
prototype at `app/demo/fintech/FintechConcept.tsx` (including its component/local
identifiers) and original image filenames in `archive/fintech-assets/`. Historical
reports mention the retired name as audit history; they are not website content.
No database identifier, schema, record or integration credential was renamed.
No public route imports the preserved prototype. Its old static asset URLs return
404, with no remaining website links; the actual old HTML route redirects.

## Product demonstrations versus services

- All six `/products/[slug]` pages retain their hero, conceptual scope and enquiry
  paths but no longer mount ProductExperience. Each explicitly says the product
  is not available for activation, with public demonstrations temporarily unavailable.
- Those six pages use `noindex, follow` and are excluded from the production
  sitemap. They remain useful information URLs, not broken links. Legacy
  `#experience` bookmarks lead to the closing enquiry section rather than a demo.
- Product discovery cards link to enquiries, not unfinished demonstrations.
  The existing website **service** demonstration link remains.
- `/product-showcase` uses labelled static illustrations, quotation and consultation
  links. Request-a-demo and product-demo links/interactive preview switches are
  removed. No placeholder is presented as a working product.
- Unverified external lead-prototype promotion is removed. Its availability and
  data handling are not advertised as verified.
- ProductExperience, shared demo modules and DiscoveryPreview remain in source for
  future development. The public routes no longer import the product-demo entrypoint.
- All seven service demos remain wired unchanged: AI conversations, software
  workspace, responsive website samples, integrations workflow, mobile app,
  marketing planner and consulting assessment. Service labels and enquiries stay.
- The shared footer now directs visitors to service demonstrations, not concept
  previews. Privacy copy no longer describes an external demo link that was removed;
  retention, marketing consent, provider caveats and privacy responsibilities stay.

## Verification and limits

- 72 Node application tests; 152 Python security/controller tests; 9 offline safety tests; ESLint, TypeScript and guarded
  production build.
- Marketing crawl: 24 pages, 72 viewport checks at 390/768/1440 and 109 unique
  internal links/fragments; no retired brand in rendered HTML, correct contact
  links, simplified mobile menu, redirect and new-category accessibility.
- Hero suite: all 23 internal heroes, 70 responsive route checks, navy palette,
  axe accessibility, keyboard pause, reduced motion and homepage exclusion.
- Offering QA: 13 detail routes at eight widths, metadata/status/FAQ/link checks,
  all 26 contact/booking prefills and mobile service/product navigation.
- All seven service-demo interaction families passed with zero API calls.
- Package prices/renewals, package selection, WhatsApp messages, quotation validation,
  consent, payload and error/retry/success tests passed with intercepted responses.
- Booking availability, occupied slots, conflict refresh, partial/unknown/confirmed
  outcomes, retry locks and preview safeguards passed using intercepted responses.
- Retired fintech redirect and six product-demo-withholding regressions passed. All five old public image URLs returned 404 on a fresh final build; archived bytes match the Git originals. Built public text assets contain zero retired-brand matches.
- Screenshots/results: `/workspace/artifacts/monetcore-marketing-readiness/`.

These are local Chromium checks, not physical Safari/Android testing or live
SMTP/PostgreSQL/Calendar delivery tests. Existing review submissions remain blocked.
Before marketing the deployed site: approve/publish/deploy this source separately,
verify the real destination's contact/booking delivery under a separately approved
procedure, and confirm privacy hosting/provider disclosures for that destination.
The AI Assistant remains subject to existing protected access/activation settings;
this cleanup neither activates it nor changes its API. Historical missing-artifact
VPS commissioning blockers are not solved or bypassed by a website-content change.
