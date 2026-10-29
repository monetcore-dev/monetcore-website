#!/bin/sh
# Root-owned entrypoint, executed as the isolated runtime UID.
# V2 intentionally never executes a mutable or stale PM2 dump at service boot.
# Start only the daemon. A separately authorized root reconciliation restores
# verified releases; daemon/PID changes must not be silently adopted.
set -eu
exec /usr/bin/pm2 ping
