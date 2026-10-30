#!/usr/bin/env bash
# Dedicated backup operator only; defaults to private local PostgreSQL socket.
set -euo pipefail
umask 077
[[ $# == 1 && $1 == /var/backups/monetcore-production ]] || { echo 'Refusing unexpected backup destination' >&2; exit 1; }
[[ -d "$1" && ! -L "$1" ]] || exit 1
# Peer-authenticated OS postgres role; no password in arguments or logs.
[[ $(id -un) == postgres ]] || { echo 'Run as the dedicated PostgreSQL backup operator' >&2; exit 1; }
export PGHOST=/var/run/postgresql PGPORT=5432 PGDATABASE=monetcore_db PGUSER=postgres
unset PGSERVICE PGSERVICEFILE PGOPTIONS PGPASSWORD PGHOSTADDR
stamp=$(date -u +%Y%m%dT%H%M%S)-$$
partial="$1/.booking-$stamp.partial"
trap 'rm -f -- "$partial"' EXIT
pg_dump --format=custom --no-password --file="$partial"
pg_restore --list "$partial" >/dev/null
mv -- "$partial" "$1/booking-$stamp.dump"
sha256sum "$1/booking-$stamp.dump" > "$1/booking-$stamp.dump.sha256"
echo 'Backup created; restore rehearsal and encrypted off-host copy remain required.'
# No automatic pruning. Retention/deletion needs separately approved policy.
