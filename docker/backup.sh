#!/bin/sh
set -e

# Load environment variables from .env.production if present
if [ -f ./.env.production ]; then
  set -a
  . ./.env.production
  set +a
elif [ -f ../.env.production ]; then
  set -a
  . ../.env.production
  set +a
fi

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

# Optional: Upload to S3 / Cloudflare R2 / MinIO if S3_BUCKET is configured
if [ -n "$S3_BUCKET" ]; then
  echo "[Backup] Syncing ${BACKUP_FILE} to s3://${S3_BUCKET}..."
  ENDPOINT_FLAG=""
  if [ -n "$S3_ENDPOINT_URL" ]; then
    ENDPOINT_FLAG="--endpoint-url ${S3_ENDPOINT_URL}"
  fi

  if command -v aws >/dev/null 2>&1; then
    aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/$(basename "$BACKUP_FILE")" ${ENDPOINT_FLAG}
    echo "[Backup] Remote S3 sync complete."
  elif command -v rclone >/dev/null 2>&1; then
    rclone copy "$BACKUP_FILE" "remote:${S3_BUCKET}/"
    echo "[Backup] Remote rclone sync complete."
  else
    echo "[Backup] Notice: S3_BUCKET set but 'aws' or 'rclone' CLI not detected on host."
  fi
fi
