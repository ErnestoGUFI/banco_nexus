#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Collect deployment evidence from the Swarm manager.

Required:
  MANAGER_HOST   Public DNS/IP for Swarm manager
  SSH_KEY        Path to EC2 private key

Optional:
  SSH_USER       SSH user, default ec2-user
  FRONTEND_URL   Public app URL for /health check
  OUT_DIR        Output directory, default docs/evidence/final
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

: "${MANAGER_HOST:?Missing MANAGER_HOST}"
: "${SSH_KEY:?Missing SSH_KEY}"

SSH_USER="${SSH_USER:-ec2-user}"
OUT_DIR="${OUT_DIR:-docs/evidence/final}"
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)

mkdir -p "$OUT_DIR"

ssh "${SSH_OPTS[@]}" "${SSH_USER}@${MANAGER_HOST}" "sudo docker node ls" \
  > "${OUT_DIR}/docker-node-ls.txt"
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${MANAGER_HOST}" "sudo docker stack services banco_nexus" \
  > "${OUT_DIR}/docker-stack-services.txt"
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${MANAGER_HOST}" "sudo docker service ps banco_nexus_backend --no-trunc" \
  > "${OUT_DIR}/docker-service-ps-backend.txt"
ssh "${SSH_OPTS[@]}" "${SSH_USER}@${MANAGER_HOST}" "sudo docker service ps banco_nexus_frontend --no-trunc" \
  > "${OUT_DIR}/docker-service-ps-frontend.txt"

if [[ -n "${FRONTEND_URL:-}" ]]; then
  curl -fsS "${FRONTEND_URL%/}/health" > "${OUT_DIR}/health.json"
fi

echo "Evidence saved to ${OUT_DIR}"
