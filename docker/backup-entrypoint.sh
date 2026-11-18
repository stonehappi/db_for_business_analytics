#!/bin/sh
set -e

BACKUP_CRON_SCHEDULE=${BACKUP_CRON_SCHEDULE:-"0 2 * * *"}
LOG_FILE="/var/log/backup.log"

mkdir -p /backups /var/log
touch "$LOG_FILE"

# Export environment variables so cron subshell has access to DB passwords, hosts, and cloud keys
export -p | grep -E '(POSTGRES_|BACKUP_|S3_|AWS_)' > /etc/environment
chmod 0600 /etc/environment

# If S3/R2 upload is configured, ensure aws-cli is available inside the container
if [ -n "$S3_BUCKET" ]; then
  echo "[BACKUP SERVICE] Cloud upload enabled for s3://${S3_BUCKET}"
  if ! command -v aws >/dev/null 2>&1; then
    echo "[BACKUP SERVICE] Installing aws-cli inside backup container..."
    apk add --no-cache aws-cli >/dev/null 2>&1 || echo "[WARNING] Could not install aws-cli inside container."
  fi
fi

echo "=========================================================="
echo " Initializing Database Backup Container"
echo " Schedule: ${BACKUP_CRON_SCHEDULE} (Daily at 02:00 AM by default)"
echo " Storage Target: /backups"
echo " Retention: ${BACKUP_RETENTION_DAYS:-30} days"
echo "=========================================================="

# Install crontab for root
echo "${BACKUP_CRON_SCHEDULE} /bin/sh /usr/local/bin/backup-service.sh >> ${LOG_FILE} 2>&1" > /etc/crontabs/root

# Make scripts executable
chmod +x /usr/local/bin/backup-service.sh 2>/dev/null || true

# Run an initial backup check to verify connectivity
echo "[BACKUP SERVICE] Running initial backup verification..."
/bin/sh /usr/local/bin/backup-service.sh >> "${LOG_FILE}" 2>&1 || {
  echo "[WARNING] Initial backup attempt encountered an error. See ${LOG_FILE} for details."
}

# Stream backup log to container stdout for 'docker logs' visibility
tail -F "$LOG_FILE" &

echo "[BACKUP SERVICE] Cron scheduler active. Waiting for next trigger..."
exec crond -f -l 2
