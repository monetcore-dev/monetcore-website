# Phase 2: local development and isolated review-build design

## Scope and preserved infrastructure

Development branch: `feature/phase2-isolated-review`, based on approved staged
commit `b7e198ba9fd0e5cc6c90b97ce8647849c726ef1f`. No remote push, VPS command,
GitHub dispatch, secret/variable change, PR #9 merge or production change is part
of this work. Keep `REVIEW_UPLOAD_ENABLED` absent. All running-instance information
below is owner-reported, not a new live observation:

- Restored tree `/home/monetcore/monetcore-website`, serving port 3000.
- Previous release `/home/monetcore/monetcore-vps-release`; its errored PM2 process
  must not be changed, deleted, restarted or assumed a working rollback target.
- Existing releases `/home/monetcore/monetcore-releases`; healthy instance on 3002.
- Incoming source `/srv/monetcore-review/incoming`.
- Nginx/Basic-auth `review.monetcore.dev` still targets 3000. Nothing here switches it.

Do not write builds into any of those directories. New build storage, if eventually
approved on the VPS, is `/home/monetcore/monetcore-review-builds`, owned by a separate
unprivileged builder and mode 0700. Its creation/access configuration requires owner
approval; this task does not create it. Prefer an isolated compatible cloud builder
if VPS headroom is uncertain. Builds and validation are not deployment approval.

## What the repository safeguards already provide

`review_receive.py` checks transfer checksum, rejects unsafe archive paths/types,
size/count overruns, overwrite and concurrent uploads. It never builds or starts
source. Its compressed-archive digest in `release.json` is useful transport evidence,
but the retained extracted files must also be checked before execution.

`check-release.mjs` rejects root env files, runs typecheck, server tests, offline
staging tests, lint and an optimized build. It allowlists build environment names,
removes business credentials and sets review markers with booking/contact/AI flags
off. This is credential hygiene, not an OS or network sandbox: npm scripts and
reviewed source are executable code. The offline staging runner additionally blocks
sockets and uses fixtures. Phase 2's exact development branch is now allowed in
that test-only branch guard; no runtime activation guard was changed.

`prepare_review_build.py` fills the extracted-source verification gap. Given a
complete owner-reviewed SHA and an independently trusted local reference checkout,
it compares the staged source inventory and every file's Git blob identity against
that exact commit. It rejects links/submodules, forbidden source paths, extra/missing
files, changed content, symlinked directories, root execution, non-private build
roots and overlapping/protected destinations. It opens source components without
following symlinks and copies verified bytes with private executable/non-executable permissions into a NEW `<build-root>/<sha>`.
Existing outputs are never overwritten or cleaned. Only a new partial output created
by this invocation is removed on failure. It emits `.review-source.json` with
`built=false`, `activated=false`; no npm/Git initialization/build/service runs.
The reference checkout and its reviewed Git objects must not be controlled by the
upload identity. No secret or customer data belongs in the source/reference tree.

Review hardening restricts output to the exact dedicated VPS build root or a private
child of `/workspace/scratch` or `/tmp`. Unrelated service/config paths are rejected,
even if writable by the caller. This code is a source-copy verifier, not an OS
sandbox: real isolation still requires the separately privileged builder identity,
trusted mount layout (no bind-mount aliases of live directories), and no service/DB
credentials or control sockets. It contains no SQL, PM2, Nginx or service commands;
its only subprocesses read Git objects. A privileged or compromised host/caller is
outside these code-level guarantees. Do not execute it against the VPS in this phase.

## Proposed repeatable process — future approval required

1. **Choose source, not a running directory.** Owner reviews a new development SHA
   and its changes/tests. The existing staging workflow stays restricted to
   `feature/monetcore-vps-completed`; future publication of reviewed development
   content to that branch and selection of its exact tip need separate approval.
   Do not widen its authorization gate for this development branch.
   Do not replace the restored source or assume the previous
   approved commit contains Phase 2 changes. Preserve/reconcile dirty VPS work via
   the existing private backup plan. Use a later explicitly approved staged snapshot;
   do not enable upload merely to test this design. Record source SHA and digest.
2. **Check capacity and compatibility privately.** Record architecture, Node 24,
   glibc, Python/Git versions, free disk, memory and existing-service headroom without
   dumping environments. Use a reviewed container image pinned by digest, matching
   architecture and with glibc no newer than the target runtime (a compatible Debian
   12 Node 24 image is a candidate, not an automatically verified choice). Rootless
   Podman/Docker, cgroup enforcement and the chosen image/digest are prerequisites,
   not installed/configured by this task. If two healthy instances leave insufficient
   capacity, build externally. Never stop services or alter swap/system packages.
3. **Provide a trusted, read-only source snapshot.** An approved operator transfers
   only the selected incoming source into builder-readable staging. Do not broaden
   permissions on incoming, restored source or runtime secrets. The builder gets no
   deployment SSH key, application home, PM2 socket, DB socket, host network, Docker
   socket, runtime config or privileged capabilities. Do not build as root, the upload
   identity, or an identity with production credentials. Administrator-mediated source
   access and new storage permissions need separate approval.
4. **Prepare an isolated copy.** With owner-supplied verified paths and SHA, run this
   only on the approved isolated build host, never against the restored website:

   ```sh
   python3 scripts/vps/prepare_review_build.py \
     --reference-repo "$TRUSTED_REFERENCE_REPO" \
     --staged-source "$APPROVED_SOURCE_SNAPSHOT" \
     --commit "$APPROVED_SHA" \
     --build-root "$PRIVATE_NEW_BUILD_ROOT"
   ```

   Require output source verification and `built=false`, `activated=false`. Failed
   verification stops the process. Do not override checks, delete an existing output,
   change the expected SHA/checksum or copy `.env` to force a build through.
5. **Install dependencies inside a disposable rootless sandbox.** Mount only the new
   output, give the container a fresh private temporary HOME/cache, cap memory/CPU/PIDs
   and temporary disk, use a read-only root filesystem, drop capabilities and disable
   privilege escalation. Start with a proposed 2 CPU / 2 GiB / 256 PID cap only if
   measured headroom supports it. Use locked `npm ci`; keep TLS and package integrity
   verification. Dependency installation must use an approved outbound proxy/allowlist
   for package hosts, with private/metadata/host-service networks blocked. Rootless
   networking alone does not prove egress isolation. Never pass runtime credentials
   or mount the host home to fix installation. A package lifecycle script can execute
   code even during installation; do not run it on the unsandboxed VPS host.
6. **Build and test with network disabled.** In the same private output volume,
   but a separate container invocation, disable all networking and expose no ports.
   The following is a command pattern, not executed VPS commands; `$BUILD_IMAGE`
   must be the owner-verified compatible image including an immutable digest:

   ```sh
   podman run --rm --userns=keep-id --network=none --read-only \
     --cap-drop=ALL --security-opt=no-new-privileges \
     --memory=2g --cpus=2 --pids-limit=256 \
     --tmpfs /tmp:rw,nosuid,nodev,size=512m \
     --env HOME=/tmp/review-home \
     --volume "$VERIFIED_NEW_OUTPUT:/workspace:rw" --workdir /workspace \
     "$BUILD_IMAGE" sh -eu -c '
       mkdir -p "$HOME"
       git init --initial-branch=feature/monetcore-vps-completed
       node scripts/vps/check-release.mjs
       python3 -B -m unittest discover -s tests -p "test_review_*.py"
     '
   ```

   Image must contain Git, Python and Node 24. Local Git initialization is only in
   the NEW output to satisfy the existing test branch guard; it does not identify a
   real source commit. Preserve the verified original SHA in the source manifest.
   Do not fabricate an original Git commit or run migrations/SQL/live provider tests.
   Rootless UID mapping, architecture, proxy CA, cgroup enforcement and npm native
   dependencies must be verified on the chosen builder before this is operational.
7. **Retain a build receipt.** Only after checks pass, record reviewed SHA, lockfile
   hash, image digest, Node/platform/glibc, check results, `.next/BUILD_ID` and output
   manifest/digest. Keep dependencies/build outputs private and separate from runtime
   secrets. Do not mark the preparation tool's `built=false` receipt as a passed build.
8. **Stop.** No `next start` on the VPS, PM2 command, process restart, nginx test/reload,
   routing change, database operation or live release activation belongs to a build.
   Optional runtime/browser smoke tests belong on a separately approved disposable
   build host with loopback-only access and flags off, not ports 3000/3002 on this VPS.

## Abort, cleanup and future recovery

Failure leaves all existing services untouched. Keep diagnostic logs private, remove
only the new incomplete container/output by its verified path under the dedicated
build root after approval, and retain the source/digest evidence. Power loss or
SIGKILL can leave partial source output; a missing/invalid receipt is not verified
preparation and never justifies overwriting the directory. A prepared output
with an existing SHA is not overwritten: use a separately approved fresh build root
for deliberate rebuilds. Do not delete/reuse existing release or incoming directories
or run broad cleanup commands. No process rollback is needed because nothing starts
or switches. A future release/routing change needs its own known-healthy rollback
candidate; the errored previous PM2 process is not one.

## Website changes and local checks

The hero now shares a full-width navy/blue/purple/magenta atmosphere instead of a
boxed visualization. Existing capability links, copy, pause control and honest
no-live-AI disclosure remain. Only decorative transforms/opacity animate; capability
labels remain stable. Pause, focus/hover pause and reduced-motion behavior also apply
to the new background. No canvas, new dependency, external image/font or API call
was added. Mobile uses the same readable dark atmosphere.

Desktop disclosures support first/last-link arrow entry, Escape focus return and
scrolling within short viewports. Current-section styling includes service/product
detail pages. Mobile navigation wraps keyboard focus while open; crossing the desktop
breakpoint closes stale state and unlocks scroll rather than reopening unexpectedly.
Navigation remains a set of disclosures/native links, not ARIA application menus.

Executed locally: lint, type generation/checking, 55 mocked server tests, nine
offline staging tests and the optimized review build passed. All 40 Python
security/source-preparation tests passed. Review hardening adds one output-root
policy regression test (41 total) and a static atmosphere fallback on browsers
without CSS `:has`, so shared pause support never depends on unsupported selectors.
Preparing the approved b7e198b Git
snapshot verified 186 source blobs in a disposable directory without building
or activating it. The complete 13-program browser regression suite and new Phase 2 browser checks
passed after correcting a conflicting legacy mobile light-surface rule found by
the accessibility audit. Screenshots are under `/workspace/artifacts/phase2/`.
The AI Core test observed zero final-navigation layout shift and zero API calls;
this is local simulation evidence, not field performance.
Python source-preparation tests use real disposable Git/filesystem fixtures. Browser
tests are Chromium simulations, not physical-device, Safari or screen-reader tests.
No hardware frame-rate/field performance claim follows from transform-only animation.

## Exact owner approvals still needed

- Accept the UI/tooling diff and select a new approved source SHA. Review hardening
  adds a `vercel.json` Git-deployment opt-out for this exact development branch,
  preserving the existing VPS-branch opt-out and leaving main/production untouched.
  A non-production PR is authorized for review; staging/build/deployment is separate.
- Approve the build host, compatible pinned image, resource/egress isolation, source
  handoff and dedicated builder storage/identity. Installing rootless tooling, account
  changes or permissions require explicit administrator approval, not passwords here.
- Approve any later isolated build execution, artifact transfer, temporary runtime
  test or staging upload separately. Keep `REVIEW_UPLOAD_ENABLED` absent for now.
- Deployment, PM2/Nginx/routing changes, production actions and PR #9/main changes
  remain outside this phase and require separate explicit authorization.
