#!/usr/bin/env bash
# PostgreSQL Database Backup Script (Bash)
# Usage: ./scripts/backup-db.sh [DATABASE_URL] [OUTPUT_DIR]

set -euo pipefail

DB_URL="${1:-${DATABASE_URL:-}}"
OUT_DIR="${2:-./backups}"

if [ -z "$DB_URL" ]; then
    echo "ERROR: DATABASE_URL is not set." >&2
    exit 1
fi

mkdir -p "$OUT_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${OUT_DIR}/quran_forum_backup_${TIMESTAMP}.dump"

echo "Starting PostgreSQL database backup to ${BACKUP_FILE}..."
pg_dump --dbname="$DB_URL" --format=custom --file="$BACKUP_FILE" --no-owner --no-privileges

if [ -f "$BACKUP_FILE" ]; then
    FILE_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup completed successfully: ${BACKUP_FILE} (${FILE_SIZE})"
else
    echo "ERROR: Database backup failed." >&2
    exit 1
fi
