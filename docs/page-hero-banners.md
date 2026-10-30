# Internal page hero banners

Local implementation on `feature/phase2-clean-review`, based on `037a007`.
The homepage and its HeroBanner component/styles are unchanged. The only shared
CSS edits exempt `[data-page-hero]` from three legacy first-section/background/
mobile-padding rules. `:where()` keeps their specificity unchanged for other
sections. No deployment, API, booking, contact, authentication or integration code
changes are included. No dependencies or external media services were added.

## Route audit

All 23 internal HTML pages currently implemented in this branch are covered.
XML sitemap, robots.txt and API endpoints are not visual pages. Existing
metadata, product statuses, pricing/renewal conditions and enquiry prefills stay.

| Routes | Embedded background |
| --- | --- |
| `/services/ai-automation`, `/assistant` | Neural network and data flow |
| `/services/software-development` | Code editor and architecture |
| `/services/business-integrations`, `/services` | Connected API/system nodes |
| `/services/digital-marketing` | Communication channels and marketing chart |
| `/services/website-development`, `/website-packages` | Responsive device layouts |
| `/services/mobile-app-development` | Mobile application interface |
| `/services/technology-consulting` | Planning/strategy diagram |
| `/products/ai-lead-automation` | Lead pipeline |
| `/products/smart-booking`, `/book` | Appointment calendar |
| `/products/ai-receptionist` | Conversation/headset illustration |
| `/products/crm` | Customer workspace |
| `/products/business-automation` | Connected workflow stages |
| `/products/ai-marketing-manager` | Campaign dashboard |
| `/products`, `/product-showcase` | Software portfolio tiles |
| `/about` | Company journey diagram (no invented metrics) |
| `/contact` | Conversation illustration |
| `/privacy` | Shield and lock; deliberately static |
| `/products/fintech-products` | Financial-technology category illustration |

The former fintech demo route now redirects to the Fintech Products category. The
old prototype is preserved in an unimported module, not a public demo. All six
product information pages retain their banners but do not render product demos.
Service demonstrations remain working and accessible.

## Reuse

`PageHero.tsx` accepts title/description (React content), eyebrow, CTA link array,
breadcrumb, a typed background theme or custom React visual, optional children,
compact spacing and animation settings. Theme assignments live in
`app/config/pageHeroes.ts`; illustrations are original inline SVG in
`PageHeroVisual.tsx`. No data, prices or business claims come from these visuals.

The background is absolutely positioned inside a content-height banner. Contrast
overlays and restrained opacity protect text. Default motion is slow CSS
transform/opacity with small dashed-line flows. `animation.enabled=false` supplies
a static banner; `animation.duration` is bounded to 12–60 seconds. Reduced-motion
preference disables all decorative motion. A labelled native checkbox pauses it
without JavaScript and supports keyboard/touch. One PageHero belongs on each page,
with unique page-level title/control IDs. The server-renderable component itself
has no client hooks or animation library; the existing fintech client boundary
continues to behave as a client page.

## Verification

- `npm test`, `npm run lint`, `npm run typecheck`, guarded production build and
  `npm run test:staging:local`.
- `QA_BASE_URL=http://127.0.0.1:4617 node tests/browser-page-heroes.mjs`:
  all 23 routes at 390/768/1440, axe WCAG checks scoped to banners, CTA targets,
  overflow/clipping, consistent navy background, pause/keyboard semantics,
  reduced motion, dark preference and homepage exclusion. External/API requests
  are blocked. Screenshots and results are written outside the repository at
  `/workspace/artifacts/monetcore-internal-heroes/`.
- Existing offering QA: 13 detail routes, eight widths (320 through 1440), metadata,
  product statuses, FAQs, links, 26 contact/booking prefills and mobile navigation.
  Existing package and booking outcome/conflict tests use intercepted responses;
  no email, actual booking, provider request or database write is performed.
- `tests/browser-page-hero-performance.mjs`: six fresh-cache samples at 390x844,
  Chromium 4x CPU throttle, 150 ms latency, 1.6 Mbps download/0.75 Mbps upload.
  AI automation LCP median 1.508 s; website development median 1.380 s; all sampled
  CLS values 0. SVG markup across all routes is 983–3295 bytes. Banner rendering
  and keyboard pause also pass with page JavaScript disabled.

Performance measurements are local lab data, not Lighthouse scores, production
Core Web Vitals or a complete WCAG conformance assessment. No physical Android,
iPhone/Safari or hosted network measurements have been made. Visual approval and
real-device review remain before publication. No commit, push or deployment is
part of this implementation task.
