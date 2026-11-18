#!/bin/sh
set -e

echo "[Docker-Prune] Starting automated Docker disk maintenance at $(date)..."

# 1. Prune stopped containers older than 24 hours
docker container prune -f --filter "until=24h"

# 2. Prune unused images older than 7 days (168 hours)
docker image prune -af --filter "until=168h"

# 3. Prune dangling build cache older than 7 days
docker builder prune -af --filter "until=168h"

echo "[Docker-Prune] Maintenance completed successfully at $(date)."
echo "[Docker-Prune] Current disk usage:"
docker system df
