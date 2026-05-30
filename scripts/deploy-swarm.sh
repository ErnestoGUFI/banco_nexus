#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Deploy Banco Nexus to an initialized Docker Swarm manager.

Required environment variables:
  MANAGER_HOST    Public DNS/IP for the Swarm manager
  SSH_KEY         Path to EC2 private key
  MONGO_URI       MongoDB Atlas connection string
  JWT_SECRET      Long random JWT signing secret
  BACKEND_IMAGE   Backend image, for example ghcr.io/owner/repo/backend:latest
  FRONTEND_IMAGE  Frontend image, for example ghcr.io/owner/repo/frontend:latest

Optional:
  SSH_USER        SSH user, default ec2-user
  GHCR_USER       GHCR username for private packages
  GHCR_TOKEN      GHCR token for private packages
  CORS_ORIGIN     Allowed browser origin
  RECREATE_SECRETS=1 to replace existing Swarm secrets

Example:
  MANAGER_HOST=1.2.3.4 SSH_KEY=~/.ssh/banco.pem MONGO_URI='mongodb+srv://...' \
  JWT_SECRET='...' BACKEND_IMAGE=ghcr.io/me/repo/backend:latest \
  FRONTEND_IMAGE=ghcr.io/me/repo/frontend:latest scripts/deploy-swarm.sh
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

: "${MANAGER_HOST:?Missing MANAGER_HOST}"
: "${SSH_KEY:?Missing SSH_KEY}"
: "${MONGO_URI:?Missing MONGO_URI}"
: "${JWT_SECRET:?Missing JWT_SECRET}"
: "${BACKEND_IMAGE:?Missing BACKEND_IMAGE}"
: "${FRONTEND_IMAGE:?Missing FRONTEND_IMAGE}"

SSH_USER="${SSH_USER:-ec2-user}"
CORS_ORIGIN="${CORS_ORIGIN:-}"
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)
STACK_FILE="/tmp/banco-nexus-stack.yml"

ssh_cmd() {
  ssh "${SSH_OPTS[@]}" "${SSH_USER}@${MANAGER_HOST}" "$@"
}

scp "${SSH_OPTS[@]}" deploy/swarm-stack.yml "${SSH_USER}@${MANAGER_HOST}:${STACK_FILE}"

if [[ -n "${GHCR_USER:-}" && -n "${GHCR_TOKEN:-}" ]]; then
  echo "Logging in to GHCR on Swarm manager..."
  printf '%s' "$GHCR_TOKEN" | ssh "${SSH_OPTS[@]}" "${SSH_USER}@${MANAGER_HOST}" "sudo docker login ghcr.io -u '${GHCR_USER}' --password-stdin"
fi

if [[ "${RECREATE_SECRETS:-0}" == "1" ]]; then
  ssh_cmd "sudo docker secret rm mongo_uri jwt_secret >/dev/null 2>&1 || true"
fi

if ! ssh_cmd "sudo docker secret inspect mongo_uri >/dev/null 2>&1"; then
  printf '%s' "$MONGO_URI" | ssh "${SSH_OPTS[@]}" "${SSH_USER}@${MANAGER_HOST}" "sudo docker secret create mongo_uri - >/dev/null"
fi

if ! ssh_cmd "sudo docker secret inspect jwt_secret >/dev/null 2>&1"; then
  printf '%s' "$JWT_SECRET" | ssh "${SSH_OPTS[@]}" "${SSH_USER}@${MANAGER_HOST}" "sudo docker secret create jwt_secret - >/dev/null"
fi

echo "Deploying stack..."
ssh_cmd "BACKEND_IMAGE='${BACKEND_IMAGE}' FRONTEND_IMAGE='${FRONTEND_IMAGE}' CORS_ORIGIN='${CORS_ORIGIN}' sudo -E docker stack deploy --with-registry-auth -c '${STACK_FILE}' banco_nexus"

echo "Stack services:"
ssh_cmd "sudo docker stack services banco_nexus"

echo "Service tasks:"
ssh_cmd "sudo docker service ps banco_nexus_backend --no-trunc && sudo docker service ps banco_nexus_frontend --no-trunc"
