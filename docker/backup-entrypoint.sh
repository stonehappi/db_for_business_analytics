#!/bin/sh
set -e

BACKUP_CRON_SCHEDULE=${BACKUP_CRON_SCHEDULE:-"0 2 * * *"}
LOG_FILE="/var/log/backup.log"

mkdir -p /backups /var/log
touch "$LOG_FILE"

# Export environment variables so cron subshell has access to DB passwords and hosts
printenv | grep -E '^(POSTGRES_|BACKUP_)' > /etc/environment
chmod 0600 /etc/environment

echo "=========================================================="
echo " Initializing Database Backup Container"
echo " Schedule: ${BACKUP_CRON_SCHEDULE} (Daily at 02:00 AM by default)"
echo " Storage Target: /backups"
echo " Retention: ${BACKUP_RETENTION_DAYS:-30} days"
echo "=========================================================="

# Install crontab for root
echo "${BACKUP_CRON_SCHEDULE} /bin/sh /usr/local/bin/backup-service.sh >> ${LOG_FILE} 2>&1" > /etc/crontabs/root

# Make scripts executable
chmod +x /usr/local/bin/backup-service.sh

# Run an initial backup check to verify connectivity
echo "[BACKUP SERVICE] Running initial backup verification..."
/bin/sh /usr/local/bin/backup-service.sh >> "${LOG_FILE}" 2>&1 || {
  echo "[WARNING] Initial backup attempt encountered an error. See ${LOG_FILE} for details."
}

# Stream backup log to container stdout for 'docker logs' visibility
tail -F "$LOG_FILE" &

echo "[BACKUP SERVICE] Cron scheduler active. Waiting for next trigger..."
exec crond -f -l 2
