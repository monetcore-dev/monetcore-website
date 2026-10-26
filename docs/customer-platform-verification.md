# Customer foundation verification — 2026-10-26

Branch: `feature/monetcore-2-customer-foundation`; base: `58dd1c76c1d2bb78b3d70877f9718e7a91856b4d`.

## Executed checks

| Check | Result |
| --- | --- |
| TypeScript, ESLint, optimized production build | Passed |
| Automated suite | 70 passed, 0 failed |
| Offline staging suite | 9 passed, 0 failed |
| Real isolated PostgreSQL16 / Better Auth checks | 12 grouped checks passed |
| Migration safety | Fresh apply, safe rerun refusal, populated rollback refusal, empty rollback: all passed |
| Real customer browser journey | Passed against disposable PostgreSQL; synthetic identities, registration/SMTP/inference disabled in browser server |
| Corporate regression suites | Routes, homepage and AI Core passed |
| Disabled-state HTTP checks | Four portal pages unavailable/noindex; customer APIs503; booking/contact safeguards403 |
| Production-only dependency installation/import | Passed outside repository |
| Runtime dependency audit (`npm audit --omit=dev`) | Zero reported vulnerabilities at test time |

Environment: Node24.19.0, Next16.4.3, Better Auth1.7.13, PostgreSQL16.15. Local PostgreSQL used a network-isolated disposable container and private Unix socket. Actual auth/tenant queries, RLS and constraints were exercised; Nodemailer was mocked for verification/reset email. Customer Chromium tests used only loopback HTTP and a disposable local PostgreSQL bridge; external browser traffic was denied. All customer data was synthetic. No paid provider or production API calls were made.

Coverage includes verification-gated login, wrong/expired/revoked sessions, recovery/reset, deactivation, active membership revocation, cross-tenant reads/writes, privilege escalation denial, eight concurrent identical submissions with one request/audit, durable limiter concurrency (15 admitted out of25), fail-closed database errors, SMTP failures/rejections, approved-recipient enforcement and allowlist removal blocking existing sessions.

Browser checks cover customer login, authorized records, project submission/history, account signout, dashboard at320/360/375/390/430/768/1024/1440px, axe scans, and existing corporate routes/navigation/AI Core. Desktop/mobile screenshots were captured using Chromium emulation; physical Android/iPhone devices were not tested. The harness was corrected for unique synthetic test data, bounded navigation and cancellation-safe prefetch teardown; these changes do not relax application controls.

The local test container, its data volume and customer app/bridge were disposed after verification. No VPS migrations or service restarts occurred. Existing booking/contact/assistant logic, homepage, AI Core and migrations001/002 have no source diff. Vercel Git deployment is disabled for the delivery branch. Customer platform/registration/email remain disabled by default.

## Remaining approval/configuration gates

Provision and review only an isolated staging database and credentials after approval; validate real VPS role/password/ingress configuration, backup restore and connection capacity. Approve synthetic email recipients and SMTP verification separately. Approve account/project/audit retention and customer legal notices before public onboarding. No live integration or public launch readiness is claimed. See `customer-platform-foundation.md` for exact variable names, operator steps and rollback restrictions. IHUOMA agents, payment and internal owner controls remain out of scope.

## Complete changed-file manifest

- `app/api/customer/account/route.ts`
- `app/api/customer/auth/[...all]/route.ts`
- `app/api/customer/organizations/[organizationId]/requests/route.ts`
- `app/config/customerOptions.ts`
- `app/customer/account/AccountActions.tsx`
- `app/customer/account/page.tsx`
- `app/customer/customer.css`
- `app/customer/layout.tsx`
- `app/customer/login/CustomerAuthForm.tsx`
- `app/customer/login/page.tsx`
- `app/customer/page.tsx`
- `app/customer/projects/new/ProjectRequestForm.tsx`
- `app/customer/projects/new/page.tsx`
- `app/lib/customer/auth.ts`
- `app/lib/customer/config.ts`
- `app/lib/customer/database.ts`
- `app/lib/customer/emailContext.ts`
- `app/lib/customer/http.ts`
- `app/lib/customer/pages.ts`
- `app/lib/customer/rateLimit.ts`
- `app/lib/customer/repository.ts`
- `app/lib/customer/session.ts`
- `app/lib/customer/validation.ts`
- `app/privacy/page.tsx`
- `app/robots.ts`
- `docs/customer-platform-foundation.md`
- `docs/customer-platform-verification.md`
- `docs/monetcore-2-architecture.md`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `scripts/migrations/003_customer_foundation.down.sql`
- `scripts/migrations/003_customer_foundation.sql`
- `scripts/staging/customer-inspection.sql`
- `scripts/staging/local-check.mjs`
- `scripts/staging/verify-disposable-customer.mjs`
- `tests/browser-customer-platform.mjs`
- `tests/customer-fixture.mjs`
- `tests/customer-platform.test.mjs`
- `tests/staging/customer-live-pools.mjs`
- `vercel.json`
