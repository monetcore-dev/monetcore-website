# Enquiry notification delivery investigation

## Confirmed facts and unknowns

The owner confirms two durable enquiry rows and SMTP acceptance,with neither
message observed in hello@monetcore.dev. Gmail inbound mail,SMTP authentication
and IMAP connectivity work. These observations do not identify the final delivery
disposition of the two specific SMTP messages. Self-addressed delivery has not
been established as the cause. Do not change sender/login to an invented alias or
use customer email as From/envelope sender.

The existing worker uses authenticated TLS465 mail.privateemail.com with both
From/envelope sender and recipient fixed to hello@monetcore.dev. Reply-To is the
validated customer address. Message-ID is unique per enquiry and stable across
safe retries. SMTP acceptance remains notification_state=accepted; it does not
mean inbox receipt. No existing accepted row is reset or resent by these changes.

Confirmed software gaps: the old verifier checked INBOX only and the original
worker discarded the provider's SMTP response/queue reference. The new read-only
audit checks all selectable folders using UID SEARCH and BODY.PEEK of exact
Message-ID/custom enquiry headers,including matching DSNs. Sent/Junk/Trash/Archive
copies never qualify as inbox delivery. Partial scans never establish absence.
No mail is moved,marked read,deleted or sent. No unrelated customer message body
is fetched: DSN MIME fetching is limited to reports matching the exact test ID.

Future worker sends add X-Monetcore-Enquiry-ID,request failure/delay DSNs where
advertised by the SMTP server,and log whitelisted SMTP code/queue ID with the
stable message/enquiry references and whether the SMTP receipt was persisted.
If that final database update fails,the provider trace is still logged and the
existing started/uncertain recovery rules prevent blind resending. No raw SMTP
replies,customer payloads or credentials are logged. This provides provider trace
information; it is not an unsupported promise that filtering is fixed.

## Next action and production gate

Use the private delivery checkout's clean-forms/audit-delivery.py against the
existing controlled receipts. It does not resubmit enquiries,send notifications,
restart services or modify Nginx. It saves new root-private evidence without
rewriting historical state. The report distinguishes inbox matches,filtered
messages,Sent copies,delivery failures and incomplete/missing evidence.

If no folder/DSN explains delivery,Namecheap must trace the exact Message-IDs,
SMTP acceptance timestamps,recipient and any recorded queue ID. Historical queue
IDs were not retained and must never be invented. Request final local-delivery,
filter/quarantine/duplicate-discard or queue disposition. Do not publish passwords
or send a support request automatically. Do not assume SPF/DKIM,filter rules or
self-addressing failed without provider evidence.

Keep the current4307 production and4306 review unchanged. The existing candidate
and all records remain preserved for rollback. Public activation stays blocked
until the actual new form notifications are found in INBOX and the owner approves
the exact Nginx/release change. Preserve normal booking behavior and unrelated API
restrictions. Accepted-but-unfound messages require reconciliation,not blind retry.
No schema migration or new provider/service is introduced.
