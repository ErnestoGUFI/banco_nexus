#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'USAGE'
Bootstrap Docker Swarm labels for Banco Nexus.

Required environment variables:
  MANAGER_HOST          Public DNS/IP for backend manager EC2
  BACKEND_WORKER_HOST   Public DNS/IP for second backend EC2
  FRONTEND_WORKER_HOST  Public DNS/IP for frontend EC2
  SSH_KEY               Path to EC2 private key

Optional:
  SSH_USER              SSH user, default ec2-user
  MANAGER_PRIVATE_IP    Private IP for Swarm advertise addr; auto-detected

Example:
  MANAGER_HOST=1.2.3.4 BACKEND_WORKER_HOST=1.2.3.5 FRONTEND_WORKER_HOST=1.2.3.6 \
  SSH_KEY=~/.ssh/banco.pem scripts/bootstrap-swarm.sh
USAGE
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

: "${MANAGER_HOST:?Missing MANAGER_HOST}"
: "${BACKEND_WORKER_HOST:?Missing BACKEND_WORKER_HOST}"
: "${FRONTEND_WORKER_HOST:?Missing FRONTEND_WORKER_HOST}"
: "${SSH_KEY:?Missing SSH_KEY}"

SSH_USER="${SSH_USER:-ec2-user}"
SSH_OPTS=(-i "$SSH_KEY" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15)

ssh_cmd() {
  local host="$1"
  shift
  ssh "${SSH_OPTS[@]}" "${SSH_USER}@${host}" "$@"
}

ensure_docker() {
  local host="$1"
  ssh_cmd "$host" "sudo systemctl enable --now docker >/dev/null && sudo docker version >/dev/null"
}

node_hostname() {
  local host="$1"
  ssh_cmd "$host" "hostname"
}

swarm_state() {
  local host="$1"
  ssh_cmd "$host" "sudo docker info --format '{{.Swarm.LocalNodeState}}' 2>/dev/null || true"
}

echo "Checking Docker on EC2 nodes..."
ensure_docker "$MANAGER_HOST"
ensure_docker "$BACKEND_WORKER_HOST"
ensure_docker "$FRONTEND_WORKER_HOST"

MANAGER_PRIVATE_IP="${MANAGER_PRIVATE_IP:-$(ssh_cmd "$MANAGER_HOST" "hostname -I | awk '{print \$1}'")}"
manager_state="$(swarm_state "$MANAGER_HOST")"

if [[ "$manager_state" != "active" ]]; then
  echo "Initializing Swarm on manager ${MANAGER_HOST} (${MANAGER_PRIVATE_IP})..."
  ssh_cmd "$MANAGER_HOST" "sudo docker swarm init --advertise-addr '${MANAGER_PRIVATE_IP}'"
else
  echo "Manager already belongs to a Swarm."
fi

join_token="$(ssh_cmd "$MANAGER_HOST" "sudo docker swarm join-token -q worker")"

join_worker() {
  local host="$1"
  local state
  state="$(swarm_state "$host")"

  if [[ "$state" != "active" ]]; then
    echo "Joining ${host} to Swarm..."
    ssh_cmd "$host" "sudo docker swarm join --token '${join_token}' '${MANAGER_PRIVATE_IP}:2377'"
  else
    echo "${host} already belongs to a Swarm."
  fi
}

join_worker "$BACKEND_WORKER_HOST"
join_worker "$FRONTEND_WORKER_HOST"

manager_node="$(node_hostname "$MANAGER_HOST")"
backend_worker_node="$(node_hostname "$BACKEND_WORKER_HOST")"
frontend_worker_node="$(node_hostname "$FRONTEND_WORKER_HOST")"

echo "Applying node labels..."
ssh_cmd "$MANAGER_HOST" "sudo docker node update --label-add banco_role=backend '${manager_node}' >/dev/null"
ssh_cmd "$MANAGER_HOST" "sudo docker node update --label-add banco_role=backend '${backend_worker_node}' >/dev/null"
ssh_cmd "$MANAGER_HOST" "sudo docker node update --label-add banco_role=frontend '${frontend_worker_node}' >/dev/null"

echo "Swarm nodes:"
ssh_cmd "$MANAGER_HOST" "sudo docker node ls && sudo docker node inspect '${manager_node}' '${backend_worker_node}' '${frontend_worker_node}' --format '{{ .Description.Hostname }} {{ .Spec.Labels }}'"
