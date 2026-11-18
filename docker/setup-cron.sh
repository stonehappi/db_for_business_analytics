#!/bin/sh
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

BACKUP_SCRIPT="$PROJECT_ROOT/docker/backup.sh"
PRUNE_SCRIPT="$PROJECT_ROOT/docker/prune.sh"

chmod +x "$BACKUP_SCRIPT" "$PRUNE_SCRIPT"

echo "=============================================================================="
echo "Installing Production Cron Jobs for Database Analytics Platform"
echo "Project Path: $PROJECT_ROOT"
echo "=============================================================================="

TMP_CRON=$(mktemp)
crontab -l 2>/dev/null > "$TMP_CRON" || true

# Check if jobs already installed
if grep -q "docker/backup.sh" "$TMP_CRON"; then
  echo "[Cron] Backup job already installed in crontab."
else
  echo "[Cron] Adding daily 02:00 AM database backup..."
  echo "0 2 * * * $BACKUP_SCRIPT >> /var/log/db_platform_backup.log 2>&1" >> "$TMP_CRON"
fi

if grep -q "docker/prune.sh" "$TMP_CRON"; then
  echo "[Cron] Docker prune job already installed in crontab."
else
  echo "[Cron] Adding weekly Sunday 03:00 AM Docker cleanup..."
  echo "0 3 * * 0 $PRUNE_SCRIPT >> /var/log/db_platform_prune.log 2>&1" >> "$TMP_CRON"
fi

crontab "$TMP_CRON"
rm -f "$TMP_CRON"

echo ""
echo "[Cron] Current active crontab:"
crontab -l
echo ""
echo "=============================================================================="
echo "Production cron jobs installed successfully!"
echo "=============================================================================="
