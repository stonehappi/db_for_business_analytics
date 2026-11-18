#!/bin/sh
set -e

echo "[Docker] Initializing DB Analytics Platform..."

# Run database schema migrations if enabled
if [ "$AUTO_MIGRATE" = "true" ]; then
  echo "[Docker] Running database migrations..."
  tsx packages/db/src/migrate.ts || echo "[Docker] Migration finished with status code $?"
fi

# Run database seed if enabled
if [ "$AUTO_SEED" = "true" ]; then
  echo "[Docker] Running database seed..."
  tsx packages/db/src/seed.ts || echo "[Docker] Seed finished with status code $?"
fi

echo "[Docker] Launching application server on port ${PORT:-3000}..."
exec "$@"
