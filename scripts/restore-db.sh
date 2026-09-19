#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL must be set}"

if [[ $# -ne 1 ]]; then
  echo "Usage: CONFIRM_RESTORE=YES npm run ops:restore-db -- /path/to/backup.dump" >&2
  exit 2
fi

if [[ "${CONFIRM_RESTORE:-}" != "YES" ]]; then
  echo "Restore is destructive. Set CONFIRM_RESTORE=YES only after verifying the target database and backup." >&2
  exit 2
fi

backup="$1"
if [[ ! -r "$backup" ]]; then
  echo "Backup file is not readable: $backup" >&2
  exit 2
fi

pg_restore --dbname="$DATABASE_URL" --clean --if-exists --no-owner --no-acl --exit-on-error "$backup"
echo "Database restore completed. Run application smoke checks before returning traffic."
