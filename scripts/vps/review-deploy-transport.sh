#!/bin/bash
# Runner-side only. Synthetic/production application credentials are never used.
set -euo pipefail
[[ "${REVIEW_DEPLOY_HOST:-}" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*$ ]]
[[ "${REVIEW_DEPLOY_PORT:-}" =~ ^[0-9]{1,5}$ ]]
(( 10#$REVIEW_DEPLOY_PORT >= 1 && 10#$REVIEW_DEPLOY_PORT <= 65535 ))
[[ "${OPERATION:-}" == deploy || "${OPERATION:-}" == rollback ]]
keydir=$(mktemp -d)
trap 'rm -rf "$keydir"' EXIT
umask 077
printf '%s\n' "$REVIEW_DEPLOY_KEY" > "$keydir/key"
printf '%s\n' "$REVIEW_DEPLOY_KNOWN_HOSTS" > "$keydir/known_hosts"
ssh_args=(-F /dev/null -T -i "$keydir/key" -p "$REVIEW_DEPLOY_PORT" -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile="$keydir/known_hosts" -o ConnectTimeout=15 -o ServerAliveInterval=15 -o ServerAliveCountMax=3)
protocol=monetcore-review-v2-1
# No artifact bytes are sent until the installed controller proves readiness.
status=$(ssh "${ssh_args[@]}" "monetcore_review_actions@$REVIEW_DEPLOY_HOST" "review-status $protocol")
printf '%s' "$status" | python3 -I -c '
import json, sys
try:
    value=json.load(sys.stdin)
    assert isinstance(value,dict) and value.get("status")=="ready"
    assert value.get("protocol")=="monetcore-review-v2-1"
    assert type(value.get("index_version")) is int and value["index_version"]==2
    assert value.get("migration_complete") is True
    assert value.get("automatic_restore")=="verified-pair-v1"
except Exception:
    sys.exit("STOP controller compatibility/readiness handshake failed")
'
printf '%s\n' 'Verified controller protocol, migration and automatic restore readiness.'
if [[ "$OPERATION" == deploy ]]; then
  [[ "$CANDIDATE_SHA" =~ ^[a-f0-9]{40}$ ]]
  checksum=$(sha256sum "$ARTIFACT_DIR/review.tar.gz"); checksum=${checksum%% *}
  [[ "$checksum" == "$(cat "$ARTIFACT_DIR/review.sha256")" ]]
  ssh "${ssh_args[@]}" "monetcore_review_actions@$REVIEW_DEPLOY_HOST" "review-deploy $CANDIDATE_SHA $checksum $protocol" < "$ARTIFACT_DIR/review.tar.gz"
else
  [[ "$ROLLBACK_RELEASE" =~ ^[0-9]{8}T[0-9]{6}Z-[a-f0-9]{8}$ ]]
  ssh "${ssh_args[@]}" "monetcore_review_actions@$REVIEW_DEPLOY_HOST" "review-rollback $ROLLBACK_RELEASE $protocol"
fi
