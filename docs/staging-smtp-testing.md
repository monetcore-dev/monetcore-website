# Controlled preview SMTP testing

Prepared 20 October 2026. Only `feature/monetcore-stage1-websites` is eligible.
No live SMTP test or Vercel configuration change has been performed.

## Configure securely before enabling

In Vercel, open monetcore-website → Settings → Environment Variables. Scope each
setting to **Preview**, restricted to branch `feature/monetcore-stage1-websites`.
Do not select Production or change existing Production values. Use sensitive/secret
storage for the password. Do not put credentials in Git, NEXT_PUBLIC variables,
chat, screenshots or build commands. An authorized owner should enter the existing
Namecheap password directly into Vercel's secure environment-variable field.

| Variable | Setting |
| --- | --- |
| `MONETCORE_EMAIL` | `hello@monetcore.dev` |
| `MONETCORE_EMAIL_PASSWORD` | Existing approved Private Email password; secret |
| `STAGING_CONTACT_ENABLED` | Leave absent/false until ready; explicitly set `true` to enable |

Vercel supplies `VERCEL_ENV=preview` and `VERCEL_GIT_COMMIT_REF`; verify the deployment
branch is `feature/monetcore-stage1-websites`. Do not override VERCEL_ENV to bypass
safeguards. Host `mail.privateemail.com`, port 465 and secure TLS are fixed in the
server transport. No additional SMTP host, port or recipient variables are needed.

Existing limiter variables remain supported unchanged: `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_KEY_SECRET`, `RATE_LIMIT_REQUIRED`. Never
reuse production Redis credentials without separate approval. A configured limiter
fails closed; if shared limiting is required but not configured, requests fail 503.
Without shared configuration, the existing per-instance limiter remains active;
it is not a durable cross-instance abuse control. Keep Vercel Deployment Protection
on and restrict testing to authorized reviewers.

After entering the settings, redeploy **this preview branch only** so server and
rendered preview-notice configuration agree. Enabling the flag is an owner action;
no live test is implied by this code change. No Supabase/Calendar variables are
needed for this email-only phase. Booking POST and availability remain blocked.

## Safe manual test

1. With the flag absent/false, confirm contact POST rejects with 403 and sends no mail.
2. Enable the flag only on the restricted Preview branch and redeploy its preview.
   The notice must say test enquiries are enabled and booking remains disabled.
3. Use synthetic details and a clearly marked message such as `SMTP-STAGE-001`.
   Do not enter real customer information. Wait at least three seconds before sending;
   leave the hidden website field empty. Do not bypass rate or spam checks.
4. Test homepage enquiry, /contact, one service quotation, one product enquiry,
   one /website-packages quotation with consent, and a planner-generated enquiry.
   Review service/product context, company, budget, message and package details
   before submission. Submit a few requests at a time, respecting rate limits.
5. Confirm a success response only after SMTP accepts the recipient. Independently
   check hello@monetcore.dev (including spam) for each `[STAGING TEST]` message and
   all expected details. SMTP acceptance is not proof of inbox delivery.
6. Test required fields/invalid email in the browser. Mocked automated tests cover
   transport rejection/failure without altering real credentials. Do not repeatedly
   use a wrong live password; provider account lockout could affect production mail.
7. Confirm /book and /api/book/availability remain blocked; create no bookings.
8. Set the flag false/remove it and redeploy the preview when testing ends. Confirm
   403 again. Reconcile any ambiguous timeout by checking the mailbox before retrying;
   SMTP submission has no delivery idempotency guarantee and could duplicate a message.

Only hello@monetcore.dev is an application-controlled destination in staging.
Submitted email is Reply-To, not a recipient; there is no customer auto-confirmation.
Check separately for provider-side forwarding/auto-reply rules: application code
cannot prevent a mailbox rule from forwarding or auto-responding after delivery.

## Scope and executed checks

The shared ContactForm powers homepage, contact/contextual service/product enquiries
and package quotations. Existing product context and planner text are preserved;
no booking, database, Calendar, pricing or integration credential settings change.
Production ignores the staging opt-in and retains its existing SMTP behavior.

Mocked regression tests cover opt-in/branch restrictions, exact mailbox enforcement,
validation/origin checks, package details, SMTP acceptance/rejection/exception, and
continued booking/availability blocking. Live inbox delivery is not verified.
