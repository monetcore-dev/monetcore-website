# Phase 2 clean isolated review

Local branch: `feature/phase2-clean-review`.
Exact parent baseline: `b7e198ba9fd0e5cc6c90b97ce8647849c726ef1f`.
Original candidate preserved on `feature/phase2-isolated-review` at
`946a97dd5c113f116363e5637081436c9317da15`.

## Reconciliation scope

This is a new descendant of the approved staging baseline, not a merge of the
customer-foundation branch. Transfer only the hero background, compact sizing,
CTA routes, navigation accessibility/interaction refinement and relevant tests.
Keep the baseline's original corporate headline, company copy, metadata and all
lower sections. Do not import EngineeringCapabilities, customer portal/auth,
customer migrations, dependency changes or the older pinned deployment tool.

Changed files (11):

- `app/components/HeroBanner.tsx`
- `app/components/SiteHeader.tsx`
- `app/components/hero-banner.module.css`
- `app/page.tsx`
- `docs/phase2-hero-review.md`
- `package.json` (browser test command only; dependencies unchanged)
- `scripts/staging/local-check.mjs` (exact local offline-test branch allowlist only)
- `tests/browser-hero-banner.mjs`
- `tests/browser-motion.mjs`
- `tests/browser-routes.mjs`
- `vercel.json`

Keep the unused AICore component as-is for rollback. Its old homepage browser
checks are replaced in the default test command by the new hero checks; workflow,
FAQ, font and layout-shift checks remain in the updated motion suite.

## Deployment safety

`vercel.json` explicitly disables Git deployments for
`feature/phase2-clean-review` and retains the staging branch exclusion. No GitHub
settings, workflows, upload gates or secrets change. The baseline review workflow
has no push event; its PR event is path-filtered to receiver/workflow files which
this candidate does not change. Source upload requires manual workflow dispatch,
the exact staging branch, explicit owner intent and `REVIEW_UPLOAD_ENABLED=true`.
Do not dispatch it or enable that variable.

These checks establish the tracked repository configuration. They cannot rule out
uninspected external webhooks, separately configured Vercel projects, deploy hooks,
manual deployments or future configuration changes. Recheck remote target SHA and
provider settings before separately authorized publication. No push/PR/deployment
is authorized by this reconciliation task.

## Local review and verification

Use the baseline's existing `node scripts/vps/check-release.mjs` to run TypeScript,
unit tests, offline staging safety checks, lint and a safeguarded production build.
It strips inherited integration credentials for child checks and refuses env files.
It performs no upload, restart, database change or release activation.

Start a loopback-only local preview with review safeguards and all activation
flags off; then run browser suites against that local origin only:

```bash
QA_BASE_URL=http://127.0.0.1:4614 node tests/browser-hero-banner.mjs
QA_BASE_URL=http://127.0.0.1:4614 node tests/browser-routes.mjs
QA_BASE_URL=http://127.0.0.1:4614 node tests/browser-motion.mjs
QA_BASE_URL=http://127.0.0.1:4614 node tests/browser-home.mjs
QA_BASE_URL=http://127.0.0.1:4614 node tests/browser-booking-conflicts.mjs
QA_BASE_URL=http://127.0.0.1:4614 node tests/browser-booking-outcomes.mjs
python3 -B -m unittest discover -s tests -p 'test_review_*.py' -v
```

The focused hero suite blocks non-local network access and captures normal-motion
1440px/390px images and reduced-motion mobile images. Chromium viewport/touch
emulation is not a physical Android/iPhone test. Booking browser tests intercept
requests with synthetic responses; server integration tests use mocks. No real
SMTP, Calendar, Redis, OpenAI or PostgreSQL calls validate live configuration.

The running restored VPS source has not been inspected. Before any separately
approved private preview deployment, reconcile VPS-only/uncommitted source and
preserve its environment, services and rollback release. Do not overwrite it with
this branch on the assumption that the running source is identical.

## Executed verification — 27 October 2026

- Clean lockfile install: PASS; initial npm cache permission failure resolved with a private `/tmp` cache, without dependency changes.
- TypeScript, ESLint, production build: PASS through the baseline credential-stripping check-release runner.
- Application tests: 55/55 PASS; offline staging tests: 9/9 PASS.
- Upload receiver/authorization security tests: 29/29 PASS, disposable files/mocks only.
- Chromium: all six selected suites above PASS. Focused hero suite: 17 grouped checks, eight widths 320–1440px, real emulated touch taps, keyboard navigation, consistent background palette, pause/reduced motion, zero hero axe violations. Route suite: eight pages, internal links, nine widths, zero reported axe violations. Motion suite: observed layout shift 0. Homepage interaction/axe suite PASS. Booking conflicts: four viewport/refresh cases PASS; partial/unknown/confirmed outcome cases and retry locks PASS at 390px and 1440px, all responses intercepted.
- An initial offline-runner refusal was fixed by adding only this exact branch to its local-check allowlist; socket blocking remains unchanged.
- Screenshots: `/workspace/artifacts/phase2-clean-hero-review` (normal desktop/mobile and reduced-motion mobile); original candidate screenshots preserved.
- No live integration, physical-device or VPS-source equivalence claim. No push, PR, deployment, activation, environment/settings/gate change, service restart or infrastructure modification.
