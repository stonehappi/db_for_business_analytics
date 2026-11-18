#!/bin/sh
set -e

# Load environment variables exported by container entrypoint for cron
[ -f /etc/environment ] && . /etc/environment

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/backups"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}

mkdir -p "$BACKUP_DIR"

echo "=========================================================="
echo " Starting Database Backup inside Container at $(date)"
echo "=========================================================="

# 1. Backup app_db
APP_FILE="${BACKUP_DIR}/app_db_${TIMESTAMP}.sql.gz"
echo "[1/2] Dumping ${POSTGRES_APP_DB:-app_db} from ${POSTGRES_APP_HOST:-postgres-app}..."
PGPASSWORD="${POSTGRES_APP_PASSWORD}" pg_dump \
  -h "${POSTGRES_APP_HOST:-postgres-app}" \
  -p "${POSTGRES_APP_PORT:-5432}" \
  -U "${POSTGRES_APP_USER:-postgres}" \
  -d "${POSTGRES_APP_DB:-app_db}" \
  --clean --if-exists | gzip > "$APP_FILE"

APP_SIZE=$(du -h "$APP_FILE" | cut -f1)
echo "      -> app_db saved (${APP_SIZE}): $APP_FILE"

# 2. Backup sandbox_db
SANDBOX_FILE="${BACKUP_DIR}/sandbox_db_${TIMESTAMP}.sql.gz"
echo "[2/2] Dumping ${POSTGRES_SANDBOX_DB:-sandbox_db} from ${POSTGRES_SANDBOX_HOST:-postgres-sandbox}..."
PGPASSWORD="${POSTGRES_SANDBOX_PASSWORD}" pg_dump \
  -h "${POSTGRES_SANDBOX_HOST:-postgres-sandbox}" \
  -p "${POSTGRES_SANDBOX_PORT:-5432}" \
  -U "${POSTGRES_SANDBOX_USER:-postgres}" \
  -d "${POSTGRES_SANDBOX_DB:-sandbox_db}" \
  --clean --if-exists | gzip > "$SANDBOX_FILE"

SANDBOX_SIZE=$(du -h "$SANDBOX_FILE" | cut -f1)
echo "      -> sandbox_db saved (${SANDBOX_SIZE}): $SANDBOX_FILE"

# 3. Clean up old backups past retention limit
echo "[3/3] Pruning backups older than ${RETENTION_DAYS} days in ${BACKUP_DIR}..."
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +"$RETENTION_DAYS" -exec rm -f {} +
REMAINING_COUNT=$(find "$BACKUP_DIR" -type f -name "*.sql.gz" | wc -l)
echo "      -> Total backups currently stored: ${REMAINING_COUNT}"

echo "=========================================================="
echo " Backup Completed Successfully at $(date)"
echo "=========================================================="
