# Monetcore corporate interface system

Corporate website first. Individual products second. Keep the homepage and navigation about Monetcore's full range of business technology; campaign pages and product pricing remain separate.

## Type and colour

- Inter variable: body, navigation, buttons and forms. Manrope variable: headings and corporate identity. Both are local, licensed WOFF2 assets loaded through `next/font/local`; see `font-assets.md` for sources and notices.
- Navy `#0c172d` anchors corporate dark sections; blue `#2949bf` is the main action colour; white and cool neutral surfaces separate sections. Muted labels retain readable contrast on pale backgrounds.
- Responsive headings use restrained weights, tight tracking and balanced wrapping. Body text uses a consistent line height; pricing remains NGN and is sourced from the existing package configuration.

## Components and behaviour

- `SiteHeader` uses native buttons and links as disclosure navigation. It is not an ARIA application menu. Desktop panels have grouped links, icons, descriptions and a contextual introduction; screens below 1200px use an expandable navigation panel.
- Enter/Space toggle disclosures, Arrow Down opens a panel and focuses its first link, Tab follows normal link order, Escape closes the panel and restores its trigger. A second Escape closes mobile navigation. Outside click, leaving navigation by keyboard, or choosing a link closes it. No hover-only activation or pointer gaps are required.
- Menus use only existing destinations. Product categories without an approved page must not receive placeholder links.
- `HeroShowcase` retains six existing previews. A fixed canvas and footer reserve space across slides; the canvas can be scrolled when needed. It supports previous/next, direct selection, pause/resume, focus/hover pause, page visibility and reduced motion. Every preview includes its status, description and real destination; simulated data is labelled.
- Reuse the shared typography, colours, form treatment, cards, focus indicators and footer across all corporate routes. The fictional MonePay demonstration retains its own green identity while sharing the font system and improved contrast. Its dialog contains keyboard focus, closes on Escape and returns focus to its trigger.
- Preview notifications are dismissible for visual review. Dismissal only hides the notice; API safety guards remain active. Never enable live side effects for a review preview.

## Boundaries

This is a visual and UX refinement of existing pages. API routes, booking logic, quotation handling, package configuration and integrations are unchanged. No Phase 4 demos, new products or `/get-a-website` route are introduced. New runtime dependencies are not required for the fonts or navigation. Keep reduced-motion support and test mobile widths, menus, existing forms and demos before publishing a branch preview.
