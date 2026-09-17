#!/usr/bin/env bash
# Deploy this repo to the dedicated Hetzner media portal server.
# Usage: scripts/deploy.sh
# Optional: DEPLOY_HOST DEPLOY_USER DEPLOY_DIR DEPLOY_SSH_KEY
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOST="${DEPLOY_HOST:-167.233.21.108}"
USER="${DEPLOY_USER:-root}"
DIR="${DEPLOY_DIR:-/opt/media}"
KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/id_ed25519_itsnomatata_api2}"
SSH=(ssh -i "$KEY" -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new)

echo "Syncing to ${USER}@${HOST}:${DIR}"
rsync -az --delete \
  --exclude node_modules \
  --exclude .next \
  --exclude .git \
  --exclude .env \
  --exclude .env.local \
  --exclude .env.production \
  -e "ssh -i ${KEY} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new" \
  "$ROOT/" "${USER}@${HOST}:${DIR}/"

if ! "${SSH[@]}" "${USER}@${HOST}" "test -f ${DIR}/.env"; then
  echo "Missing ${DIR}/.env on the server. Copy a production env file first." >&2
  exit 1
fi

echo "Building and starting containers..."
"${SSH[@]}" "${USER}@${HOST}" "cd ${DIR} && docker compose -f docker-compose.prod.yml up -d --build"

echo "Waiting for health..."
for i in $(seq 1 60); do
  if curl -fsS "http://${HOST}/api/health" >/dev/null 2>&1; then
    echo "Portal is up at http://${HOST}"
    exit 0
  fi
  sleep 5
done

echo "Health check did not pass. Check logs with:"
echo "  ssh -i ${KEY} ${USER}@${HOST} 'cd ${DIR} && docker compose -f docker-compose.prod.yml logs --tail=80'"
exit 1
