#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

STACK_NAME="${STACK_NAME:-banco-nexus-ec2}"
REPO="${REPO:-ErnestoGUFI/banco_nexus}"
SSH_USER="${SSH_USER:-ec2-user}"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/banco-nexus-key.pem}"

blue() {
  printf "\033[1;34m%s\033[0m\n" "$1"
}

green() {
  printf "\033[1;32m%s\033[0m\n" "$1"
}

yellow() {
  printf "\033[1;33m%s\033[0m\n" "$1"
}

red() {
  printf "\033[1;31m%s\033[0m\n" "$1" >&2
}

section() {
  printf "\n"
  blue "============================================================"
  blue "$1"
  blue "============================================================"
}

need_command() {
  command -v "$1" >/dev/null 2>&1 || {
    red "Falta instalar '$1'."
    exit 1
  }
}

aws_output() {
  local key="$1"
  aws cloudformation describe-stacks \
    --stack-name "$STACK_NAME" \
    --query "Stacks[0].Outputs[?OutputKey=='${key}'].OutputValue | [0]" \
    --output text
}

run_or_warn() {
  local description="$1"
  shift

  yellow "\$ $*"
  if "$@"; then
    green "OK: $description"
  else
    red "No se pudo comprobar: $description"
    return 1
  fi
}

ssh_manager() {
  ssh \
    -i "$SSH_KEY" \
    -o BatchMode=yes \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout=15 \
    "${SSH_USER}@${MANAGER_HOST}" \
    "$@"
}

print_intro() {
  clear 2>/dev/null || true
  blue "Banco Nexus - verificacion en vivo para exposicion"
  printf "\n"
  printf "Este script muestra evidencias sin imprimir secretos:\n"
  printf "%s\n" "- Repositorio y ultimo CI/CD en GitHub Actions."
  printf "%s\n" "- Stack CloudFormation y 3 instancias EC2."
  printf "%s\n" "- Cluster Docker Swarm, nodos y replicas."
  printf "%s\n" "- App publica, backend /health y conexion a MongoDB Atlas."
  printf "\n"
}

print_github_evidence() {
  section "1. Repositorio y CI/CD"
  printf "Repositorio: https://github.com/%s\n\n" "$REPO"

  if command -v gh >/dev/null 2>&1; then
    run_or_warn "GitHub Actions consultado" gh run list --repo "$REPO" --limit 3
  else
    yellow "gh no esta instalado; abre manualmente: https://github.com/${REPO}/actions"
  fi
}

print_aws_evidence() {
  section "2. AWS EC2 y CloudFormation"

  run_or_warn "Stack CloudFormation activo" \
    aws cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --query "Stacks[0].{Nombre:StackName,Estado:StackStatus,Region:StackId}" \
      --output table

  printf "\n"
  run_or_warn "Tres instancias EC2 del proyecto" \
    aws ec2 describe-instances \
      --filters "Name=tag:aws:cloudformation:stack-name,Values=${STACK_NAME}" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
      --query "Reservations[].Instances[].{Nombre:Tags[?Key=='Name']|[0].Value,Estado:State.Name,Tipo:InstanceType,PublicIp:PublicIpAddress,PrivateIp:PrivateIpAddress}" \
      --output table

  printf "\n"
  printf "Backend manager public IP: %s\n" "$MANAGER_HOST"
  printf "Backend worker public IP:  %s\n" "$BACKEND_WORKER_HOST"
  printf "Frontend public IP:        %s\n" "$FRONTEND_WORKER_HOST"
  printf "App publica:               %s\n" "$APP_URL"
}

print_swarm_evidence() {
  section "3. Docker Swarm"

  if [[ ! -f "$SSH_KEY" ]]; then
    red "No encuentro la llave SSH: $SSH_KEY"
    red "Puedes pasar otra con: SSH_KEY=/ruta/llave.pem ./show-compliance.sh"
    exit 1
  fi

  run_or_warn "Nodos Swarm activos" \
    ssh_manager "sudo docker node ls"

  printf "\n"
  run_or_warn "Servicios Swarm desplegados" \
    ssh_manager "sudo docker stack services banco_nexus"

  printf "\n"
  run_or_warn "Backend con replicas distribuidas" \
    ssh_manager "sudo docker service ps banco_nexus_backend --filter desired-state=running --format 'table {{.Name}}\t{{.Node}}\t{{.CurrentState}}\t{{.Error}}'"

  printf "\n"
  run_or_warn "Frontend en nodo dedicado" \
    ssh_manager "sudo docker service ps banco_nexus_frontend --filter desired-state=running --format 'table {{.Name}}\t{{.Node}}\t{{.CurrentState}}\t{{.Error}}'"
}

print_app_evidence() {
  section "4. App publica, backend y MongoDB Atlas"

  run_or_warn "Frontend publico responde HTTP" \
    curl -fsSI --max-time 10 "$APP_URL"

  printf "\n"
  yellow "\$ curl -sS ${APP_URL%/}/health"
  local health
  health="$(curl -fsS --max-time 10 "${APP_URL%/}/health")"

  if command -v jq >/dev/null 2>&1; then
    printf "%s\n" "$health" | jq '{
      status,
      dbName,
      replicaSet,
      readyState,
      primary,
      isWritablePrimary,
      latencyMs,
      members: [.members[] | {name, stateStr, health}]
    }'
  else
    printf "%s\n" "$health"
  fi

  if printf "%s\n" "$health" | grep -q "mongodb.net"; then
    green "OK: /health muestra nodos de MongoDB Atlas (*.mongodb.net)."
  else
    red "Advertencia: /health no mostro dominios mongodb.net."
  fi
}

print_rubric_summary() {
  section "5. Resumen para decir en voz alta"
  cat <<'SUMMARY'
Cumplimiento de rubrica:

[x] Backend monolitico contenedorizado.
[x] Frontend desacoplado en su propio contenedor.
[x] Docker Swarm real sobre AWS EC2.
[x] 2 instancias EC2 para backend con 2 replicas.
[x] 1 instancia EC2 dedicada para frontend.
[x] Red overlay y servicios orquestados por Swarm.
[x] Persistencia administrada externa con MongoDB Atlas.
[x] Transferencias con validacion de saldo y transaccion ACID.
[x] Auditoria de eventos criticos en base de datos.
[x] CI/CD con GitHub Actions: build, push de imagenes y rolling update.

Frase util:
"La aplicacion no depende de una base local en contenedores para produccion:
los contenedores del backend se conectan a MongoDB Atlas y el despliegue se
actualiza por GitHub Actions mediante rolling update sobre Docker Swarm."
SUMMARY
}

main() {
  need_command aws
  need_command ssh
  need_command curl

  cd "$ROOT_DIR"

  print_intro

  MANAGER_HOST="${MANAGER_HOST:-$(aws_output BackendManagerPublicIp)}"
  BACKEND_WORKER_HOST="${BACKEND_WORKER_HOST:-$(aws_output BackendWorkerPublicIp)}"
  FRONTEND_WORKER_HOST="${FRONTEND_WORKER_HOST:-$(aws_output FrontendWorkerPublicIp)}"
  APP_URL="${APP_URL:-http://${FRONTEND_WORKER_HOST}}"

  print_github_evidence
  print_aws_evidence
  print_swarm_evidence
  print_app_evidence
  print_rubric_summary

  printf "\n"
  green "Verificacion terminada."
}

main "$@"
