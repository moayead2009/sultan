#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set}"

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
umask 077

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="$BACKUP_DIR/solutions-gate-$timestamp.dump"

pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-acl --file="$target"

if [[ -n "${BACKUP_RETENTION_DAYS:-}" ]]; then
  if [[ ! "$BACKUP_RETENTION_DAYS" =~ ^[1-9][0-9]*$ ]]; then
    echo "BACKUP_RETENTION_DAYS must be a positive integer when set." >&2
    exit 1
  fi
  find "$BACKUP_DIR" -type f -name 'solutions-gate-*.dump' -mtime "+$BACKUP_RETENTION_DAYS" -delete
fi

echo "Database backup completed: $target"
