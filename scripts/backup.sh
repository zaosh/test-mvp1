#!/bin/bash
set -euo pipefail

BACKUP_DIR="/var/testlab/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILENAME="testlab_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

PGPASSWORD="$DB_PASSWORD" pg_dump \
  -h 127.0.0.1 \
  -U "$DB_USER" \
  -d testlab \
  | gzip > "$BACKUP_DIR/$FILENAME"

# Keep last 30 days only
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: $FILENAME"

# Add to crontab: 0 2 * * * /path/to/backup.sh
