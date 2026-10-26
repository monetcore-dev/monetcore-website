# Monetcore website architecture

Permanent principle: **Corporate website first. Individual products second.**

The corporate homepage introduces Monetcore System Solutions and its full range of software, AI automation, applications, websites, integrations and consulting. The hero stays company-wide. Product promotions belong in compact sections that link to their own destinations; campaign pricing must not become the corporate identity.

## Restoration source

The corporate homepage at `9f1087076da240b6d8c0f0e85779ab8dd3323c2b`, before the website-sales redesign, supplies the positioning and hierarchy: “Build smarter. Automate faster. Grow further.”, six rotating technology previews, software and automation services, product information, established-in-2016 company context, and project enquiries. The correction retains the newer accessible dropdowns, responsive styling, shared footer, local fonts, NGN budgets, package configuration, quotation workflow and preview safeguards.

## Current destinations

- `/`: corporate overview, capabilities, product introductions, compact Smart Website Solutions offer, demonstrations, company context, process and enquiries.
- `/services`: service capabilities and business integrations.
- `/products`: product overview; existing AI lead automation information and Smart Booking.
- `/website-packages`: website-sales platform, configured NGN prices and renewals, comparison, disclosures and package-prefilled quotation forms. Preserve its functionality.
- `/book`: existing consultation request flow, dependent on configured integrations.
- `/demo/fintech`: fictional interactive MonePay concept.
- `/about` and `/contact`: company background and contact/consultation options.

`app/config/corporateSolutions.ts` describes current capability links. Package prices remain in `app/config/websitePackages.ts`. Do not duplicate pricing in corporate content.

## Proposed campaign page: `/get-a-website`

**Documentation only. No route is implemented or authorised in this change.**

Suggested structure, reusing the work from the website-sales homepage (see commit `010178b`):

1. Website-specific hero: business value, proposed NGN starting price, package and demo CTAs.
2. Explain how a website complements Instagram, Facebook, TikTok and WhatsApp.
3. Smart website benefits: credibility, organised information, enquiry capture and WhatsApp contact.
4. Package overview sourced from the existing pricing configuration; link to the complete comparison, renewal terms and approval disclosures.
5. Approved interactive website samples, clearly marked as demonstrations; do not imply future Phase 4 demos already exist.
6. Rule-based assistant demonstration once implemented and authorised; label future AI upgrades separately.
7. Website delivery process and accurate FAQs, with genuine testimonials only when supplied.
8. Package-prefilled quotation form and package-specific WhatsApp CTAs; no payment processing.
9. Shared corporate footer and company identity, without changing the corporate homepage hierarchy.

Retain lightweight responsive layouts, keyboard access, consent and server validation. Use NGN prices and only properly licensed imagery of Black people when depicting people. Carry forward preview safeguards: review deployments do not send mail, access live booking data or create calendar entries. WhatsApp and contact links are live outbound links.

## Future product pages

AI receptionists, CRM, booking products, WhatsApp automation, business management applications and custom software products can each receive a dedicated page under `/products/<product-slug>` when separately approved. This is a proposed convention, not a list of implemented routes. Keep existing public URLs and add redirects only if a future migration is explicitly approved.

Each new product should define its audience, business problem, features, availability (concept/demo/available), dependency requirements, scoped pricing, third-party costs, accurate demo status and a clear enquiry CTA. Add a link to the product overview/navigation as appropriate; the corporate hero and service hierarchy do not need redesigning. Do not advertise unfinished features as operational or add placeholder links to nonexistent pages.

No Phase 4 demos, campaign page or new products are authorised by this correction.
