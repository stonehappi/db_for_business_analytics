#!/bin/sh
set -e

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="${APP_DB_CONTAINER:-db_platform_postgres_app}"
DB_USER="${POSTGRES_APP_USER:-postgres}"
DB_NAME="${POSTGRES_APP_DB:-app_db}"
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[Backup] Starting backup of ${DB_NAME} from container ${CONTAINER_NAME}..."

docker exec -t "$CONTAINER_NAME" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

echo "[Backup] Backup completed successfully: ${BACKUP_FILE} ($(du -h "$BACKUP_FILE" | cut -f1))"

# Keep last 30 days of backups (prune older)
find "$BACKUP_DIR" -name "backup_${DB_NAME}_*.sql.gz" -mtime +30 -delete 2>/dev/null || true
echo "[Backup] Retention policy applied (pruned backups older than 30 days)."
