# Corporate interactive technology experience

The homepage keeps its corporate structure. `SolutionExplorer` is placed after the existing FAQ and before the existing contact section. It links only to existing service and package pages; illustrations are capabilities, not new commercial products.

## Local interaction boundaries

- `AutomationSimulation` uses predefined text and short local timers for the four stages: enquiry, response, fictional lead, fictional follow-up. Run/Replay starts a fresh sequence; Reset and unmount cancel pending progression. No AI API, storage, email, database or calendar integration is called.
- `SmartProjectPlanner` collects goal, challenge, optional capabilities and an estimated NGN budget. Rules in `app/config/projectPlanner.ts` select a service. Explicit goals take precedence; otherwise connection needs, response needs and online-presence needs guide the suggestion, with custom-software scoping as the fallback. Budget is forwarded as a visitor selection, not used to invent a price or timeline.
- Selections stay in component memory and are not persisted by the application to browser storage or query parameters. A fresh page load starts with an empty planner; ordinary browser history restoration is outside this component’s storage behaviour.
- “Discuss This Project” writes a draft into `ProjectPlanProvider`, scrolls to the existing enquiry form and focuses its project-details field. It does not submit anything.

## Enquiry handoff and confirmation

Each planner handoff has a new local revision. `ContactForm` derives the service, budget and message from that revision until the visitor edits them. The form is not remounted, so existing name, email and company entries remain intact. Visitors can edit or replace the outline before submitting.

The existing API route remains the only submission endpoint. A successful HTTP status alone is insufficient: the client also requires `success: true` from the backend. Failed responses retain entered details and display accessible feedback. Success clears the fields and resets the message counter. Feedback from an older planner revision is not shown as confirmation of a new outline. Quotation package selection and consent continue to work outside the planner context.

The preview safety guards remain unchanged. Review deployments reject live contact submissions, bookings and availability access before using integrations. Dismissing a preview notice does not enable side effects.

## Accessibility and motion

Solution selectors and process controls are native buttons with active states and associated regions. Fixed panel space limits movement when selections change; panels support keyboard scrolling if their contents need more room. Simulation stages are labelled as a simulation and announce progress politely. Reduced-motion rules disable decorative animation without hiding stage progression or controls.

The existing process keeps its four summaries, detailed information and keyboard controls, with Previous/Next buttons, bounded navigation and a clearer deliverables label. Existing FAQs, navigation and the rotating showcase remain in place.

## Validation performed

ESLint, TypeScript and the production build; desktop/mobile selection and panel checks; demo progression, cancellation and replay; nine recommendation-rule cases; planner-to-form handoff and editable fields; no automatic API requests; preview rejection; no false success on an unconfirmed HTTP 200 response; intercepted confirmed-response UI; navigation, FAQ, carousel, booking, MonePay and package regressions; automated accessibility scans.

Live AI, email, database and calendar delivery are intentionally not exercised by these local simulations. Browser success/error fixtures intercept the request and do not send real enquiries.
