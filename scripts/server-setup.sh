#!/usr/bin/env bash
# Run on the Hetzner box as root. Idempotent.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

APP_DIR="${APP_DIR:-/opt/media}"

apt-get update
apt-get install -y ca-certificates curl gnupg ufw fail2ban unattended-upgrades

if [ ! -f /swapfile ]; then
  fallocate -l 3G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=3072
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

systemctl enable --now docker
systemctl enable --now fail2ban
dpkg-reconfigure -f noninteractive unattended-upgrades || true

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

mkdir -p "$APP_DIR"
echo "Server setup complete. Docker $(docker --version)"
