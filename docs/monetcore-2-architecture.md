# Monetcore 2.0 architecture and Phase 1

## Inspected baseline and reusable components

The uploaded VPS source and completed PostgreSQL branch are the baseline, not an older main checkout. Next.js App Router, React, Tailwind, shared responsive header/footer, AI Core (pause and reduced motion), seven service pages, six product experiences, package configuration, enquiry prefill, planner, disclosures and privacy pages are reusable. Booking uses a parameterized pg repository with active-slot uniqueness; SMTP, Calendar, staging restrictions and release scripts remain unchanged. The existing protected assistant is a constrained customer-information interface, not IHUOMA. External integration readiness is not established by a local build.

## Phase 1 delivered

Preserve the existing premium corporate foundation and single animated core. Add a server-rendered engineering capability section, improve full-stack positioning, and expand software service descriptions. Each capability links to an existing service route. Existing products retain their status disclosures. No customer portal, agent interface or inactive navigation placeholder is published. No new dependencies or paid services are required.

## Target boundaries

- Public website: server-rendered corporate content and current enquiry/demo journeys.
- Customer platform: a separate authenticated route group, server-side tenant-scoped services and private file storage.
- Owner operations: separate owner-only routes and APIs, stronger authentication and action approval.
- IHUOMA: orchestration services plus a separately supervised worker, never a long-running Next.js handler.
- Agent adapters: typed inputs/results, explicit tool capabilities, execution deadlines, budgets and revocable grants. An adapter cannot obtain privileges from model text.

## Database and authentication strategy

Retain PostgreSQL and existing bookings. Future additive, reviewed migrations introduce users, organizations, memberships, projects, tasks, proposals, invoices and audit events; no schema change is part of Phase 1. Use a maintained authentication solution with revocable sessions, secure cookies, verified recovery and MFA for owners. Choose the provider/library after operational review, not by extending assistant Basic authentication into customer identity.

Every customer query must derive organization membership server-side and apply tenant scope. Test cross-tenant reads/writes and file access; use restricted database roles and consider RLS as defense in depth. Separate worker credentials from web credentials. Do not grant agents the booking application role or unrestricted database access. Do not log customer content or secrets.

## IHUOMA execution and approval model

A durable task records objective, tenant/owner, dependencies, assigned agent, state, deadline and approved budget. States: proposed, awaiting approval, queued, running, succeeded, failed, cancelled. Store idempotency keys, bounded attempts and sanitized immutable audit events. Job leasing, transactional outbox and recovery need implementation before workers become operational.

IHUOMA proposes typed actions; the server checks actor, tenant, agent capability, exact payload, budget and policy. High-impact operations require an unexpired owner approval bound to action digest and current revision. Workers recheck approval and kill switch immediately before execution. Changed payloads require new approval. Neither prompt injection nor an agent's declaration can approve an action. External communications, deployment, payments and credential/destructive changes remain unavailable until their own adapters and approval tests pass.

All specialized agents (development, sales, marketing, support, project management, finance, operations) are planned modules, not deployed functionality. Start with read-only operational reporting; add one narrowly scoped adapter at a time. Finance may draft invoices, never independently transfer funds. Payments require signed webhooks, idempotency and server-side reconciliation, never browser-redirect confirmation.

## Roadmap and acceptance gates

1. Corporate foundation: this increment; review design on desktop/mobile and preserve integration tests.
2. Business platform: approve auth, tenancy, data retention and customer workflows; deliver identity/projects before CRM, files and billing.
3. IHUOMA foundation: task state machine, registry, owner dashboard, durable audit/approval enforcement and worker shutdown tests.
4. Specialized agents: one capability at a time, mocked integrations first; require measurable outcomes and safe failures.
5. Automation: explicitly authorize each live email/Calendar/payment integration; verify idempotency and partial failure recovery.
6. Production readiness: threat review, accessibility, load measurements on actual VPS, encrypted backups with restore drill, monitoring, incident and rollback procedures. Deployment remains separately authorized.

## Main risks and unresolved decisions

Prompt injection, cross-tenant leakage, replayed approvals, tool overreach and runaway spend require adversarial tests and server enforcement. VPS CPU/RAM and queue capacity must be measured; do not assume a full agent platform fits the current host. Select queue mechanism and authentication after resource/privacy review. Provider contracts, international transfers, worker data retention, customer agreements, payment provider and recovery ownership need owner review. Secret storage, backups, TLS and actual PostgreSQL permissions require operational verification, not UI claims.

No live flags, external resources, schema, DNS, runtime services or deployment settings were changed by Phase 1. Existing review-branch Vercel suppression remains in place. Local commit only; no push is required by this directive.

## Local verification

2026-10-26: TypeScript, ESLint, optimized production build, 57 automated tests and nine offline staging checks passed. Existing Chromium homepage and AI Core suites passed: solution selection, demo lifecycle, planner handoff, mocked submission states, accessibility scans, eight-width core layout, keyboard/touch navigation, pause/reduced motion, zero unintended API calls and no browser exceptions. Browser coverage is desktop Chromium emulation, not physical mobile-device certification. No live provider readiness is claimed.

## Unified directive refinement

The operating hierarchy is Owner / CEO → IHUOMA → specialized agents → explicitly permitted business systems. The three experiences share design tokens but not authorization: public corporate website; tenant-isolated customer portal; private IHUOMA Owner Command Center. No Phase 2/3 route or agent is advertised as operational.

The planned registry contains eight distinct agent types: software development, sales/lead generation, marketing, customer support, project management, finance/invoicing, business operations, and infrastructure monitoring. Infrastructure monitoring starts with read-only health signals and cannot restart services or deploy without explicit authorization. Registry entries declare tool IDs, tenant scope, maximum attempts, deadline, budget, approval class and emergency revocation state. The owner retains final authority over contracts, sensitive external communications, deployments, destructive changes, credentials and payments.

The Owner Command Center will consolidate approved operational data: customers, projects, tasks, proposals, finances, sales, marketing, health, audit events and alerts. It will expose approval/rejection and permission revocation through authenticated server APIs. Design dashboards only after those data contracts and permissions exist; avoid fabricated metrics. Customer registration, files, deliverables, milestones, invoices, support and communication history are Phase 2 work requiring identity and tenant-isolation acceptance tests first.

### Phase 1 design review

Namecheap is a quality/usability benchmark, not a source of assets or copied layouts. This review assessed the existing code against the supplied criteria; it does not claim a live comparative evaluation of namecheap.com. Retain Monetcore's own navy/blue/purple identity, shared typography, existing dropdown navigation and single animated core. Refined the corporate hero to full-stack positioning, added distinct capability icons, keyboard focus parity for dropdown links, active-category indication on service/product detail pages, and lighter capability surfaces on mobile. Existing demos, process, FAQ, company sections, packages and conversion journeys remain intact. No new photographs were added.

### Git provenance and deployment boundary

Verified local Phase 1 commit `8c88a9999224f7fb5aa3ee25c6b781338f3744d3` and fast-forwarded the existing `feature/monetcore-2-homepage` branch from completed VPS migration commit `a67acee66ac3d0b602b4b98dceceab8440a5dba5`; no cherry-pick conflicts or source reconstruction was needed. Both commits remain in history. The dedicated branch is the development/delivery target. Its Vercel Git deployment is explicitly disabled in `vercel.json` before push, preserving the prior VPS branch block. Offline staging checks accept this development branch without changing runtime authorization. No merge, deployment, runtime configuration, DNS, Nginx or PM2 changes are authorized by this increment.

### Next proposed Phase 2 increment (requires approval)

First approve identity/session architecture, owner MFA/recovery, tenant-role matrix and retention scope. Then implement additive migrations for organizations/memberships/projects, server-side tenant-scoped repositories and one minimal customer project-request/dashboard journey. Test cross-tenant denial, session revocation, authorization and audit trails before adding CRM, quotations or invoicing. Keep IHUOMA execution and external actions disabled until their later phase and explicit activation approval.

Unified refinement verification (2026-10-26): 57 automated tests, nine offline staging checks, TypeScript, ESLint and optimized review build passed. Chromium route suite passed eight page renders, internal links, nine responsive widths and desktop/mobile dropdown interactions. Homepage and AI Core suites passed planner/demo behavior, accessibility, keyboard/touch navigation and reduced motion. Added a dedicated corporate-foundation browser check covering eight widths (320–1440px), capability-card bounds, mobile/desktop axe and nested active navigation; passed. The old AI Core headline assertion was updated to the approved new corporate positioning; core behavior was not changed. Provider integrations and physical Android/iPhone devices were not exercised. Screenshots are local review artifacts, not deployed output.
