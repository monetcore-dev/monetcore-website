# Monetcore AI Core — homepage hero replacement

20 October 2026 (Africa/Lagos). Development branch: `feature/monetcore-stage1-websites`. Baseline `57ca548`.

## Scope

Replaced only the right-hand rotating homepage showcase with one interactive AI Core. The homepage diff changes its component import and JSX instance; corporate headline, supporting text, CTAs, navigation, two-column wrapper and lower sections are retained. The retired HeroShowcase component is removed; service/product detail pages and their local demos are untouched. Legacy unused showcase styles were left in the existing global stylesheet to avoid an unrelated stylesheet refactor.

The new component uses existing React, Next Link and lucide-react plus scoped CSS/SVG. No dependency, external asset, API, paid service, 3D framework, chat feature or live-processing claim is introduced. The explicit disclosure describes an interactive capability visualization with no live AI processing.

## Visual and interaction design

- Radial-gradient sphere with a highlight/shadow surface, geometric detail and a restrained breathing light treatment.
- Three slowly rotating orbital tracks (55/75/90 seconds), curved connection lines and five small transform/opacity data particles. Nodes float only 4px over 10 seconds and text never rotates.
- Hover/focus reveals a concise description in a fixed-size panel. Each native link has its own accessible description and a visible focus outline. All links remain useful without animation.
- All moving elements pause while the visualization is hovered or contains keyboard focus. A native Pause/Resume button controls the user's persistent preference for this component instance.
- prefers-reduced-motion provides a static sphere/ring composition, no particles or node motion and a visible Static view label. The motion toggle is hidden in this mode because it cannot override the browser preference.
- On mobile, the visual is above a two-column grid of full-size links, with the fifth spanning both columns. The hero copy and CTA region remain separate. Explicit scene/detail sizing reserves layout space; no timers, randomness, external requests or browser-only initial-render state are required.
- Animated properties are transform/opacity. Glows and shadows are static; no animated layout dimensions, heavy filters, JavaScript render loop or external service is used.

## Five existing destinations

| Node | Existing destination |
| --- | --- |
| AI Automation | `/services/ai-automation` |
| Software Development | `/services/software-development` |
| Digital Marketing | `/services/digital-marketing` |
| Business Integrations | `/services/business-integrations` |
| Smart Products | `/products` |

No website/service/product route, pricing configuration, form, API, database helper or integration setting is removed or changed. Main, production infrastructure and customer records remain outside scope.

## Regression strategy

Carousel-specific assertions in browser-routes, browser-audit and browser-motion are updated to assert the replacement's functionality rather than abandoned slide controls. Existing navigation, package, workflow, FAQ and planner assertions are retained. The new browser-ai-core program tests labels/descriptions, actual keyboard/touch navigation, CSS motion and stopping, reduced motion, clipping/touch-target/layout checks and axe scans of all focused details.

Screenshots and logs are stored in `/workspace/artifacts/ai-core/`. Tests use local preview-mode optimized builds and Chromium desktop/touch emulation. No real Android/iPhone Safari or physical-device performance guarantee is claimed. Preview submission safeguards remain active. A targeted source comparison confirms protected APIs, services/products/demos and website pricing remain unchanged.

## Executed verification

- ESLint, TypeScript and optimized Next.js production build in preview mode: passed.
- `npm test`: 17 test groups passed, zero failures or skipped groups.
- Browser programs executed successfully: browser-ai-core, browser-routes, browser-home, browser-audit and browser-motion. This is the relevant subset, not a claim that all 12 browser programs were rerun.
- Final dedicated hero checks: 320, 360, 375, 390, 430, 768, 1024 and 1440px; all five keyboard and touch destinations; focus descriptions; 44px targets; no horizontal overflow; stable detail height; pause/resume and hover/focus stopping; static reduced-motion mode; axe scans of every focused node at mobile and desktop. No application API requests, browser exceptions or hydration errors occurred. Observed final navigation CLS: 0.
- Broader regressions retain navigation, package prefill, homepage demos, planner, FAQ keyboard handling, preview safeguards and mocked booking duplicate/race/error behavior. Protected backend, product/service/demo and pricing files match baseline.

### Local performance measurement

One Lighthouse mobile-simulation run against the optimized local preview build: performance 95, accessibility 100, best practices 100, SEO 66; FCP 1.1s, LCP 2.9s, total blocking time 60ms and CLS 0. Preview noindex remains intentional. These are whole-homepage lab results, not field Core Web Vitals, a production SEO assessment or a claimed improvement over baseline.

A separate two-second headless Chromium desktop sample recorded 6 layouts totaling 1.183ms, 0.134ms script time and 17.096ms task time across the page. This is a small diagnostic sample, not a GPU/FPS benchmark or physical-device guarantee. CSS uses transform/opacity for continuous movement and has no JavaScript animation loop.

Artifacts: `/workspace/artifacts/ai-core/lighthouse-home.json`, `animation-performance.json`, `hero-desktop-1440.png`, `hero-mobile-390.png`, and compact `core-desktop-1440.png` / `core-mobile-390.png`. Browser tests used Chromium desktop and mobile/touch emulation; actual Android Chrome and iPhone Safari remain unverified. No external integration tests were performed.
