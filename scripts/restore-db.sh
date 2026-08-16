#!/usr/bin/env bash
# PostgreSQL Database Restore Script (Bash)
# Usage: ./scripts/restore-db.sh <BACKUP_FILE> [DATABASE_URL] [--clean]

set -euo pipefail

BACKUP_FILE="${1:-}"
DB_URL="${2:-${DATABASE_URL:-}}"
CLEAN_FLAG="${3:-}"

if [ -z "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file argument is required." >&2
    echo "Usage: $0 <path/to/backup.dump> [DATABASE_URL] [--clean]" >&2
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file does not exist: $BACKUP_FILE" >&2
    exit 1
fi

if [ -z "$DB_URL" ]; then
    echo "ERROR: DATABASE_URL is not set." >&2
    exit 1
fi

EXTRA_ARGS=""
if [ "$CLEAN_FLAG" = "--clean" ]; then
    EXTRA_ARGS="--clean --if-exists"
fi

echo "Restoring PostgreSQL database from ${BACKUP_FILE}..."
pg_restore --dbname="$DB_URL" --no-owner --no-privileges $EXTRA_ARGS "$BACKUP_FILE" || {
    RET=$?
    if [ $RET -ne 0 ] && [ $RET -ne 1 ]; then
        echo "ERROR: Database restore failed with exit code $RET" >&2
        exit $RET
    fi
}

echo "Database restore completed successfully."
