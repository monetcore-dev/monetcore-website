#!/bin/sh
# Root-owned service entrypoint, executed as the isolated runtime UID.
set -eu
if [ -f /var/lib/monetcore-review-runtime/.pm2/dump.pm2 ]; then
  exec /usr/bin/pm2 resurrect
fi
exec /usr/bin/pm2 ping
