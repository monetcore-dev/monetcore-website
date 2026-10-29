#!/bin/sh
# Root-owned daemon-only launcher, executed as the isolated runtime UID.
# The separate root-owned monetcore-review-restore.service verifies the lifecycle
# index and restores only its approved pair. Never execute a mutable PM2 dump.
set -eu
exec /usr/bin/pm2 ping
