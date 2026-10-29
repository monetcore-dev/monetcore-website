# Review deployment lifecycle V2 (local preparation; VPS installation needs approval)

This supersedes V1's unlimited preservation of running applications. It never
changes production, services, accounts, MemoryMax, environment settings or DNS
on installation by itself. Only a separately authorized administrator may install
or invoke it on the VPS. Do not rerun the deployment workflow to migrate.

## Invariants and state

`/srv/monetcore-review-deploy/state/lifecycle.json` is an atomic root-owned 0600
index. It records version 2, an explicit current/rollback pair, daemon identity
(including boot ID), the expected review routing hash, memory policy, acknowledged
historical record checksums and pending transaction. Historical `active` flags
are never used to elect a current release. An absent index is a migration blocker.

Normal deployment validates both live applications, exact single IPv4-loopback
listeners, UID, PID/start ticks, PM2 ID/restart count, cgroup, root-owned working
directory, immutable file-tree seal and exact release markers. Public HTTPS pages
must return 200 and all existing `/api` and `/api/…` method checks must return 403.
It preserves the Nginx parser, other-file/directory fingerprints, certificate
verification, exact artifact SHA-256, tar validation and atomic Nginx replacement.
The versioned restricted SSH protocol accepts only status/deploy/rollback; no admin command
or arbitrary path is exposed through the deployment key.

Phases are durable: intent -> starting -> candidate_verified -> switching ->
retiring -> committed. Failure may produce rolled-back or blocked. Intent and an
Nginx backup precede PM2 startup, including uncertain start acceptance. A critical
or incomplete record blocks another deployment unless an explicit administrator
reconciliation acknowledges the *exact original bytes*. Original records and
backups are never rewritten to disguise recovery.

Steady state has two verified applications. A candidate temporarily makes three.
After the new public release and retained rollback are verified, only the proven
obsolete third application is deleted from the isolated PM2 daemon. The current
and rollback IDs/ports are protected. Name, age or port alone never authorizes
retirement: the controller checks exact registered PM2/process/script/cwd/artifact
identity, routing and other Nginx fingerprints immediately before deletion and
again afterwards. It checks that the retired main PID and observed workers exited and that the
listener disappeared. It inspects only the dedicated service cgroup; unknown or
orphan processes block operation and are never killed speculatively. Cleanup
or persistence uncertainty blocks the lifecycle rather than reporting success.
Release directories, Nginx backups and transaction records remain on disk.
The existing 12-directory disk-retention stop still applies; file pruning is a
separate future authorization, not part of this implementation.

Before admission and after persistence, service processes must be the verified
daemon, registered application roots, or their identifiable descendants.

The saved PM2 dump is checked to contain exactly the verified pair with their
expected scripts and directories. A root-owned seal records the accepted artifact
checksum and a hash of immutable files. Only `.next/cache` and generated
`review-ecosystem.json` are excluded from the tree hash; runtime bindings are
verified separately. Cache is never followed/read during this hash.

## Memory admission

The existing host `MemAvailable >= 768 MiB` check remains. Admission additionally
reads cgroup v2 `memory.current`, `memory.max`, optional `memory.high`, and `memory.events` for the isolated
service and relevant parents. Every finite ancestor must have at least:

`approved candidate startup budget + safety reserve`

A finite `memory.high` is treated conservatively as another admission boundary,
not ignored because it is technically a soft throttle.

A root-reviewed memory policy is mandatory. `startup_bytes` must be at least
512 MiB; `reserve_bytes` must be at least 128 MiB. These are conservative minimum
admission estimates, **not hard per-process allocations or a verified worst-case
Next.js bound**. The administrator must choose a measured or conservatively
justified budget and record its basis. If measured startup requires more, raise
the budget; do not lower it to get a deployment through. Insufficient capacity
blocks *before startup*, even with abundant host RAM. No MemoryMax/CPU/unit changes
are made. The 512M PM2 restart threshold remains asynchronous and is not treated
as a hard budget.

During startup/switch, cgroup generations/limits, reserve and max/OOM counters are
checked again. Pressure, OOM or daemon changes require explicit reconciliation
even if the previous pair was restored. Snapshot evidence stays in the private
transaction. Parent-wide pressure may conservatively stop a review operation.
This cannot prevent an external host OOM or guarantee uninterrupted service.

At the reported ~681 MB inside a 1 GB unit, another candidate will not pass the
minimum budget/reserve. Approved reconciliation may retire only verified obsolete
review applications first. Then measure headroom again; accounted file cache may not disappear immediately
after process retirement. Never automatically
increase MemoryMax or borrow production's resource allocation.

## One-time migration of the existing six records

Do not restart the unit or delete any process to prepare for migration. Keep the
restored review upstream (reported port 4304) and all release files intact.

1. Freeze manual dispatches. After separate **controller installation** authorization,
   privately back up the installed controller, SSH wrapper, sudo policy, launcher,
   runtime unit, root state, PM2 dump and review Nginx configuration. Record exact
   hashes and the live 4304 identity/health. Install the reviewed controller and
   versioned SSH wrapper at their existing root-owned paths and the narrowly scoped
   sudo rules documented in `review-deployment-automation.md`. Do **not** replace
   the running service/launcher yet; do not stop/restart PM2 or edit Nginx.
   Installation does not perform reconciliation or retirement. Old clients are
   intentionally incompatible. The status handshake fails closed until all steps
   below are complete. Preserve the current root configuration and source work.
2. From an existing privileged administrator console (never the deployment key),
   run `/usr/local/libexec/monetcore-review-deploy inventory`. It reports only
   sanitized review identities, hashes, memory counters and history checksums;
   it does not print environments, arguments, raw Nginx or PM2 JSON.
3. Identify current from actual Nginx routing + HTTPS marker, not the largest ID.
   Verify 4304 is still the current healthy release. Choose a different healthy,
   integration-disabled review release as rollback. Inspect **all six** history
   records, including the failed 4305 record and its preserved Nginx backup.
4. For each running legacy application to retain or retire, retrieve its original
   approved GitHub Actions standalone artifact and independently verified SHA-256.
   Place a root-owned copy at the fixed incoming path
   `incoming/<release-id>.migration.tar.gz`. Preserve the artifact and source work.
   V2 validates checksum, bounded tar contents, commit/runtime compatibility and
   immutable extracted-tree equality. Missing artifacts, changed files, unknown
   PM2 entries, missing listeners or an unhealthy retained release are blockers;
   it will not trust loose legacy files or guessed checksums.
5. Create a root-owned mode 0600 file at
   `/srv/monetcore-review-deploy/state/lifecycle-reconcile.json`. Use the fields
   below. `records` must account for every entry in the isolated PM2 daemon,
   including stopped/errored entries; no unknown application may be swept up.
   Every listed obsolete application is an explicit retirement authorization.
   Offline entries must have process=null, PID zero in PM2 and no listener. A
   disappeared failed candidate needs no live record, but its historical record
   and release directory remain preserved and acknowledged.
6. Include every history record ID and exact digest in `acknowledge`, including
   all six original records. Record an explicit reason describing the restored
   routing and investigation of the critical failure. Preserve the original
   `CRITICAL-rollback-unconfirmed` JSON unchanged. V2 verifies its backup checksum
   and that restored routing matches the latest unresolved record's preserved
   before/after configuration hash. Missing forensic evidence stops recovery.
7. Record the reconciliation plan's `sha256sum`. Run administrator-only
   `reconcile-check <plan-sha256>`. This validates without changing applications,
   Nginx, seals or lifecycle state (archive checking uses temporary scratch files).
8. Review its retire count and the exact obsolete identities. Only after explicit
   approval for review-process retirement, run `reconcile-apply <same-sha256>`.
   It revalidates under the deployment lock, stores a durable copy of the approved
   plan, seals artifact-backed releases, retires only listed obsolete entries,
   saves/checks the two-application PM2 dump and commits the new index. It does not
   modify Nginx, release directories, the original critical record or backups.
   Any partial failure leaves a blocked index and durable evidence. Generate and
   review a fresh plan after investigating; never edit status flags to bypass it.
9. After separate **startup commissioning** authorization, follow the installation
   sequence below without restarting the runtime. Verify public pages 200, `/api` and `/api/` 403, both release markers/identities,
   the final PM2 pair and cgroup headroom. Only then separately approve deployment.

Plan shape (values below are placeholders, never paste them as real metadata):

```json
{
  "version": 2,
  "index_hash": null,
  "nginx_hash": "<exact current review configuration SHA-256>",
  "other_nginx_sha256": "<existing approved other-config fingerprint>",
  "daemon": {"pid": 123, "start": "456", "uid": 1004, "boot_id": "<actual boot UUID>"},
  "current_id": "<verified current release ID>",
  "rollback_id": "<verified healthy rollback release ID>",
  "records": [{
    "id": "<review release ID>", "commit": "<full SHA>",
    "checksum": "<independently verified original artifact SHA-256>",
    "port": 4304, "pm_id": 1, "restarts": 0,
    "process": {"pid": 1234, "start": "5678", "uid": 1004,
                "cwd": "/srv/monetcore-review-deploy/releases/<release ID>"}
  }],
  "acknowledge": {"<each historical record ID>": "<exact JSON file SHA-256>"},
  "restore_policy": "verified-pair-v1",
  "memory_policy": {
    "startup_bytes": 536870912,
    "reserve_bytes": 134217728,
    "basis": "<replace with reviewed measurements or conservative justification>"
  },
  "reason": "<explicit approved migration/critical-recovery rationale>"
}
```

Use at least two distinct records and add every additional known obsolete PM2
entry. Example numeric identities are not verified VPS values. For subsequent
recovery, `index_hash` must match the existing index bytes instead of null.
Changes to plan, index, history, configuration, daemon, process or artifact
invalidate the check; never relax the checks to accept them.

## Restart, interruption and rollback recovery

Normal rollback uses the same restricted manual workflow and exact current release
ID. It validates the live pair and swaps roles only after verified routing/health;
it does not infer a target from an old transaction. A failed switch restores the
recorded previous pair with the existing exact PID/start/config/backup checks.
A changed PID is a reconciliation requirement, not a reason to discard identity
checks. Retirement failures leave the new route untouched and blocked if undoing
cleanup would require guessing whether an old process is still available.

### Verified automatic restoration

The daemon launcher runs **only `pm2 ping`**. It never executes `dump.pm2`.
The separate root-owned `monetcore-review-restore.service` restores the pair using
`boot-restore`. Its dependency on the runtime unit is ordered, restart-bound and
requested by the runtime unit. A normal service/host restart or unexpected daemon
exit followed by systemd restart therefore requests verification/restoration.
The runtime remains the isolated UID, loopback-only, CPU-limited and **MemoryMax=1G**.
The root oneshot has its own loopback-only sandbox; it does not inherit production
credentials and cannot enable external integrations. HTTPS verification connects
locally to Nginx with the public hostname/SNI and certificate verification.
It does not start, reload or change Nginx.

Before any start, restoration requires a ready root-private index, explicit
`restore_policy: verified-pair-v1`, resolved/acknowledged historical evidence, exact
recorded routing and other-config fingerprint, and valid trusted paths, artifact
seals and both release identities. Only an actual new verified daemon generation
permits recapturing process identities. Repeating restoration in the same daemon
generation verifies the exact existing pair and starts nothing. Ordinary PM2 app
restarts or inconsistent state are not silently adopted. Unknown entries, port
conflicts and unexpected cgroup processes block; no application is deleted.

The controller durably saves the approved index backup and boot intent before
starting live first, rollback second. Each start has host/ancestor cgroup memory
admission, health, PID/start/UID/cwd/PM2/cgroup checks and pressure checkpoints.
Only fixed generated ecosystems for the two sealed releases are used, never saved
environments. It persists/checks exactly the pair and verifies public routing/API
403s before committing fresh daemon/process metadata. The root service remains
active/exited after success. Status refuses deployment otherwise.

### Startup installation sequence (separate authorization)

After successful approved reconciliation has bounded PM2 to the verified pair:

1. Install `scripts/vps/monetcore-review-restore.service` as root:root 0644 at
   `/etc/systemd/system/monetcore-review-restore.service`. Install the reviewed
   runtime unit at its existing `/etc/systemd/system/monetcore-review-pm2.service`
   path, retaining **all** existing reviewed security/resource settings. Compare
   the file; the runtime-unit changes are the restore `Wants=` edge and `Restart=always`
   with `RestartSec=3` (intentional `systemctl stop` still remains stopped).
   If other existing unit settings differ, stop and review them rather than overwrite.
2. Run `systemd-analyze verify` on both files, then separately authorized
   `systemctl daemon-reload`. This does not restart applications. Verify loaded
   dependencies and no unreviewed drop-ins. Confirm `systemctl is-enabled
   monetcore-review-pm2.service` returns `enabled` (persistent boot enablement).
   If not, stop for separate authorization to enable **only this review unit**;
   the handshake rejects disabled/runtime-only enablement. The restore unit is
   pulled in by the runtime and needs no independent enable. Do not enable a
   second runtime service.
3. Only once the restore unit and dependencies are loaded, install the reviewed
   daemon-only launcher root:root 0755 at
   `/usr/local/libexec/monetcore-review-pm2-start`. The controller pins the exact
   restore-unit and launcher hashes. Never install this launcher first on a service
   which lacks the verified restorer. The existing already-running daemon remains.
4. Under separate startup-verification approval, run
   `systemctl start monetcore-review-restore.service` (not a runtime restart).
   With the same verified daemon/pair this is idempotent verification, zero app
   starts. Confirm active/exited; review sanitized journal status. No service is
   automatically restarted during controller installation or reconciliation.
5. From the restricted SSH client run `review-status monetcore-review-v2-1`.
   Required response is status=ready, protocol=monetcore-review-v2-1,
   index_version=2, migration_complete=true, automatic_restore=verified-pair-v1.
   Legacy unversioned deploy/rollback is rejected by wrapper and controller.
6. Measure actual two-app memory usage against the approved startup+reserve budget.
   A 1G service may still have insufficient room for a third application. That is
   a genuine admission blocker, not permission to lower budgets or raise MemoryMax.
   Later, separately authorize a **review-service-only** restart test to confirm
   actual PM2/systemd behavior. Do not reboot the shared VPS just to test this.

The workflow performs this handshake **before streaming an artifact** and rechecks
state inside the deployment lock. Missing migration, invalid/blocked index,
failed root restorer, incompatible controller or stale client stops deployment.
No push-triggered deployment is introduced; manual dispatch, environment approval
and existing enable gates remain required. Keep gates off during commissioning.

### Interrupted boot and administrator recovery

Invalid/incomplete indexes and unresolved critical history never start apps.
If startup fails after intent (including accepted-but-timed-out PM2 starts), the
controller blocks the index and preserves already-restored approved processes.
It makes no speculative deletion, Nginx change or automatic retry. The service
reports sanitized failure categories in its journal; the root-private transaction
records retain exact evidence. This is exceptional recovery, not routine reboot
operation. A failed rollback start may leave live 4304 working but deployment blocked.

Administrator procedure after diagnosing the failure:

1. Keep manual deployment disabled. Preserve the root index/journal/approved-index
   backup and original critical history. Verify actual route, current health,
   PM2/proc identities, memory events, seals and other Nginx fingerprints.
2. For **this controller's boot transaction only**, obtain the current lifecycle
   file SHA-256 and separately approve root-console
   `/usr/local/libexec/monetcore-review-deploy boot-retry <index-sha256>`.
   It requires the exact blocked index/journal and approved-index backup hashes,
   acknowledges only the failed boot transaction, revalidates all original
   approvals, and starts only missing approved apps. It never refunds evidence or
   rewrites old records. Existing approved processes must have zero PM2 restarts
   and exact verified identities. Unrelated critical history still blocks.
3. A torn/mismatched journal, changed artifacts/identities, unknown process,
   unresolved original critical record or changed routing requires the full
   explicit inventory/reconciliation procedure, not boot-retry or manual JSON edits.
4. After successful recovery, separately start the root restore oneshot to obtain
   active/exited readiness, then recheck status and public API restrictions.

A failed install/check leaves existing processes and Nginx unchanged. A failed
reconciliation may already have retired explicitly approved obsolete processes,
so retain the blocked evidence and reconcile afresh; do not imply every operation
is side-effect-free. Restore backed-up controller/wrapper/sudo/unit/launcher only
as a reviewed, coordinated set with compatible state. Never restore an old PM2 dump
or revert a migrated index to resurrect obsolete apps. Do not restart a healthy
runtime merely to roll back tooling. Preserve current/rollback release directories.

Never use `pm2 delete all`, `pm2 resurrect`, a production PM2 home, generic PID/port
kill commands, memory-limit increases or forced index edits as recovery shortcuts.

## Local verification scope

Run `python3 -B -m unittest discover -s tests -p 'test_review_*.py' -v`.
The test models exercise real controller transactions with disposable state,
synthetic PM2/process/cgroup/HTTP boundaries and archive-backed legacy validation.
No real PM2, SSH, systemd, Nginx, VPS, database or provider call is made. Real PM2
7.1.1 JSON normalization, kernel OOM behavior, actual systemd/PM2 boot and restart propagation, loaded unit sandbox behavior and available
VPS headroom still require separately approved commissioning. No live migration,
process retirement, service restart or memory-limit change is authorized by this
local commit.
