# Owner-test origin validation

## Cause and scope

The previous guard compared `new URL(request.url).origin` directly with
`https://monetcore.dev`. Next.js can reconstruct the proxy/API request URL from
its listening hostname and port instead of the external routed authority. The
installed Next.js implementation does this in `NextNodeServer.runMiddleware`
and `attachRequestMeta` (`node_modules/next/dist/server/next-server.js`). The
reported 403 is returned before Basic authentication and inference. Actual
Production runtime URL values have not been inspected; internal reconstruction
is the supported explanation, not a claimed live deployment observation.

## Trust boundary

`assistantRequestOrigin` is shared by owner access in Proxy/API and the API's
same-origin submission validation. Production keeps exactly one public origin:
`https://monetcore.dev`. Canonical URLs remain supported. Conflicting Host,
x-forwarded-host or x-forwarded-proto values fail closed even on canonical URLs.

An internal-URL fallback requires all of:

- Server runtime `VERCEL=1` and `VERCEL_ENV=production`.
- Actual HTTP Host exactly `monetcore.dev` (Vercel's routed authority).
- `x-forwarded-proto` exactly `https` from Vercel's TLS-terminating ingress.
- If supplied, `x-forwarded-host` must also match exactly; it is never an
  independent source of authority. Generic Forwarded and x-vercel-id are unused.

Trust is in the managed Vercel ingress and server runtime, not the presence of
client-supplied Vercel-looking headers. Comma lists, ports, www/alternate hosts,
HTTP indicators, absent routing Host and generic forwarded-only claims cannot
activate the fallback. Do not copy this policy to self-hosted infrastructure or
another upstream proxy without separately establishing header sanitization and
routing provenance. Do not manually spoof VERCEL variables outside Vercel.

Preview retains its existing HTTPS/branch/authentication rules and gets no new
internal-URL fallback. The fix does not change activation, owner hashing, pricing,
model, emergency stop, local controls, booking/contact code or environment values.
An approved owner still receives Basic authentication's 401 challenge before the
page can render; incorrect passwords remain rejected. POST Origin must match the
same externally resolved origin, not the internal transport URL.

## Verification and release

Synthetic regression tests cover internal proxy/API URLs, missing/incorrect
credentials, spoofed or conflicting authorities, protocol lists, cross-origin
POSTs, deployment boundaries and unchanged disabled flags. OpenAI is mocked;
there are no live provider requests or credential reads. Local tests do not prove
this deployment's ingress metadata. After separately approved deployment, first
verify only an unauthenticated GET to /assistant: expect HTTP 401 with the Basic
challenge on the exact canonical HTTPS host. Do not submit a question without
separate inference-test authorization. If it still returns 403, collect only
sanitized protocol/hostname and routing metadata categories, never Authorization,
passwords, hashes, tokens, message text or environment dumps.
