# Contact and quotation replacement

Local candidate: fix/monetcore-enquiry-forms-clean-20261105.
Foundation:171b6d972b2e79e3fd5185dbc0be808a135423e0 (approved form-restoration website source).
Source publication is separately authorized. No VPS deployment or routing change is performed by source publication.

## Scope

Preserve the approved form markup, package prices, website design, booking code,
existing schema and notification records. Both forms POST to /api/contact;
production accepts only a verified, committed PostgreSQL receipt. Explicit
quotation type is validated and retained even for non-package quotations.
Legacy non-production service demonstration handling remains separate and
unchanged, including its existing staging security gates.
The client bounds requests at20seconds and locks unknown receipts against blind
resubmission. Correctable refusals retain the same idempotency key. No new API
exception, database provider, service or migration is required. The exact source
branch is excluded in vercel.json; existing Vercel branch rules are preserved.

Existing monetcore_enquiries.enquiries/request_keys/rate_windows and notification
worker are reused. Acceptance and SMTP delivery are distinct:202 means saved,
not delivered. Every saved enquiry has a pending notification; safe pre-message
SMTP failures retry with backoff, while uncertain sends require reconciliation
rather than risking duplicates. SMTP is TLS465 mail.privateemail.com, exclusively
to hello@monetcore.dev. SMTP acceptance is not proof of inbox arrival.

## Verification

95 application tests;19 disposable PostgreSQL16 checks including real route ->
storage -> mocked SMTP for both forms;142 security/controller tests;9 guarded
offline checks;28 browser groups at320/390/768/1440 including accessibility,
validation,quotes/consent,correctable retry,unknown receipt,network error,
false-success rejection,20second abort,WhatsApp and no horizontal overflow.
ESLint,TypeScript and production webpack build pass.
The initial offline command omitted offline-guard and failed3checks; the corrected
mandatory guarded invocation passes all9. No real provider was contacted.
No live persistence,SMTP/inbox or current VPS configuration has been verified.

## Reversible deployment using existing production conventions

1. Obtain current service WorkingDirectory,launch convention and secret bindings
without printing Environment or credentials. Confirm production4307,review4306
and existing candidate4308. Verify current production source/assets against this
candidate baseline before replacing anything. Preserve any newer live changes.
2. Keep the current production release and unit/config backups. Build/package the
reviewed source with the established Ubuntu24.04/Linuxx64/Node24.22.1 toolchain.
The current local build is not a claim of VPS native-binary compatibility.
Use a recorded commit and archive checksum; do not invent a release identity.
3. Reuse existing4308 for private verification, not another service. Preserve the
production launcher and environment. Do NOT install the old enquiry runtime-config
as a whole-site replacement: it clears booking credentials/flags and would risk
changing unrelated functionality. Do not enable booking or AI flags in this work.
4. Keep existing database and secret files. Do not repeat004,create roles or resend
historical notifications. Verify existing grants/schema read-only. Supply the
existing DB/rate credentials securely to the web process; SMTP stays server-side
in the existing worker. Use a recorded new-notification cutoff and preserve its
existing durable records; never reset historical attempts.
5. Verify only loopback ingress and Nginx overwriting Host,Origin expectations,
X-Real-IP and X-Forwarded-Proto before enabling the existing CONTACT flags.
Run one identified synthetic Contact and one Quotation submission on private4308.
Record reference IDs,verify committed rows,process only those new notifications,
then require the operator to confirm both actual inbox messages. Preserve unknown
sends for inspection; do not blindly repeat submissions or notifications.
6. Present the exact production unit/routing diff and rollback commands for owner
approval. Do not route public traffic before candidate verification and approval.
Prefer the existing deployment mechanism; preserve4307 as immediate rollback until
stability is established. nginx -t must pass before any approved reload. Keep all
unrelated API protections and review4306 unchanged.
7. After authorized cutover,verify HTTPS,Contact/Quotation submissions,new rows,
new inbox messages,worker status,booking navigation and review health. Mark live
success only after those observations. Roll back routing/release/unit configuration
if checks fail; never roll back/drop enquiry tables or delete submitted records.

## Current blocker

The managed environment has no VPS/SMTP credentials or supported VPS connection.
Real database/inbox checks and exact live deployment commands require the owner's
noVNC execution or secure VPS access. No commissioning state may be marked passed
based on these local tests. No production changes are authorized by this document.


## Owner-confirmed VPS inventory (2026-11-05)

Production monetcore-production.service is active as monetcore_public with
DynamicUser=yes and release b9894ef3ef271d2a36dce70361bbfc37007d81cd.
The existing candidate and worker both use the legacy4f release and DynamicUser;
candidate ActiveState=active with MainPID=0 is NOT proof of a running candidate.
No restart or public routing operation follows from these inventory findings.
Use actual process/socket/release identity and HTTP checks before accepting4308.
