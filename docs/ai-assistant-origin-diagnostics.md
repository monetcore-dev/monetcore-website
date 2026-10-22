# Temporary owner-origin diagnostics — not a validation change

## Deployment evidence collected read-only

PR #4 merged into main as `77e67c8512a019a9dbb7dd30f097b9f07efc09a0`.
GitHub's Vercel status is successful. GitHub deployment `7248339549` is labelled
Production, has that SHA and a successful deployment status pointing to:
`https://monetcore-website-b09j1l7qx-monetcore.vercel.app`.
Vercel's status link is:
`https://vercel.com/monetcore/monetcore-website/FBzdzKZXU7koL75s1jcPVMFLAEEW`.

This verifies a Production deployment of PR #4, NOT the current custom-domain
alias assignment. The owner must confirm in Vercel that the deployment currently
serving monetcore.dev has that source commit (or a descendant containing it).
No Vercel settings, Runtime Logs or credentials were accessed for this work.

## Inspect the failure after separately approved diagnostic deployment

This PR must not be merged/deployed without approval. It changes no validation,
authentication or activation settings. No OpenAI request is needed for diagnosis.

1. In Vercel, select monetcore-website, then the currently assigned Production
   deployment. Confirm Source/main and the exact Git SHA, and monetcore.dev under
   its assigned domains. Confirm the diagnostic commit is included when deployed.
2. Open Runtime Logs, select Production/current deployment, and the current time
   range. Include Proxy/Middleware logs as well as function logs and warning level.
3. In a fresh private browser window visit only `https://monetcore.dev/assistant`.
   Do not enter credentials, submit a question or call the POST API. A rejected GET
   executes the owner guard before authentication and cannot invoke OpenAI.
4. Search for the literal marker `Monetcore assistant origin diagnostic v1`.
   Use Vercel's own request/time correlation. No request ID, IP or user identity is
   added by this instrumentation. Capture the sanitized event and source SHA only.
5. Report the `reason` and fixed categories below. Do not share full request
   headers, Authorization, passwords, hashes, environment screenshots, query
   strings or message contents. If no event appears, check source SHA and log
   filters/Proxy visibility; absence is not evidence that origin validation passed.

| First failed check (`reason`) | Meaning |
| --- | --- |
| `host_mismatch` | Present Host is not exactly monetcore.dev. |
| `forwarded_host_mismatch` | Present x-forwarded-host is not exactly monetcore.dev. |
| `forwarded_protocol_mismatch` | Present x-forwarded-proto is not exactly https. |
| `fallback_not_vercel` | Noncanonical request URL cannot use fallback without VERCEL=1. |
| `fallback_host_missing` | Noncanonical URL has no routed Host after earlier mismatch checks. |
| `fallback_protocol_missing` | Noncanonical URL has no HTTPS forwarding metadata after earlier mismatch checks. |
| `nonproduction_non_https` | Non-Production runtime received a non-HTTPS URL. |

Checks retain their previous ordering. The first failing condition is logged;
additional mismatches may be visible in the other categories. No checks are relaxed.
Some reasons are unreachable through the owner guard while earlier activation
checks fail; they still cover direct shared-validator calls.

Each event contains only:
- `url_protocol`: https/http/other; `url_hostname`: canonical/www/loopback/vercel_domain/other;
  `url_port`: explicit/default.
- `host` and `forwarded_host`: missing/canonical/www/loopback/vercel_domain/other,
  additionally canonical_with_port or multiple as applicable.
- `forwarded_protocol`: missing/https/http/multiple/other.
- `vercel_runtime`: vercel/not_vercel; `deployment_environment`:
  production/preview/development/missing/other; `deployment_branch`:
  main/approved_feature/missing/other.
- `deployment_revision`: pr4_merge/missing/other. The diagnostic deployment itself
  normally reports other; use Vercel's Source panel for its actual public SHA.

No raw hostname/header/environment value, path, query, transcript, key, password,
Authorization, cookie, IP or full URL is logged. There is no success telemetry.
Logging errors are swallowed and the same access denial is returned.

## Remove after evidence collection

Prepare a follow-up PR removing the import/report calls from access.ts and restoring
ordinary null returns at the same branches, then delete originDiagnostics.ts and
its diagnostic-specific test. Preserve all existing origin/authentication tests.
Remove or archive this temporary runbook, retaining only a sanitized finding if
useful. Review that authorization behavior is unchanged; run tests, TypeScript,
ESLint and build. Obtain approval before merge/deployment. Do not revert any later
independent fixes accidentally by reverting a broad release commit.

Existing platform logs follow the owner's Vercel retention/access settings; this
code does not delete historical logs. No automated log deletion is claimed.
