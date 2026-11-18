#!/bin/sh
set -e

echo "=============================================================================="
echo "Production Host Firewall Setup (UFW)"
echo "=============================================================================="

if ! command -v ufw >/dev/null 2>&1; then
  echo "Error: ufw is not installed. Run: sudo apt-get update && sudo apt-get install -y ufw"
  exit 1
fi

SSH_PORT="${SSH_PORT:-22}"

echo "[UFW] Setting default policies (Deny incoming, Allow outgoing)..."
sudo ufw default deny incoming
sudo ufw default allow outgoing

echo "[UFW] Allowing SSH on port ${SSH_PORT}..."
sudo ufw allow "${SSH_PORT}/tcp" comment "SSH Remote Management"

echo "[UFW] Allowing HTTP (Port 80) and HTTPS (Port 443)..."
sudo ufw allow 80/tcp comment "HTTP (Caddy SSL redirect)"
sudo ufw allow 443/tcp comment "HTTPS (Caddy Encrypted Traffic)"

echo "[UFW] Enabling UFW firewall..."
sudo ufw --force enable

echo ""
echo "[UFW] Status check:"
sudo ufw status verbose

echo ""
echo "=============================================================================="
echo "Firewall configured successfully!"
echo "NOTE: In docker-compose.yml, database and web ports run strictly on the private Docker network"
echo "and only Caddy (ports 80 and 443) communicates with external traffic."
echo "=============================================================================="
