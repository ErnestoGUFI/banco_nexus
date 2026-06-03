#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT_DIR/.local-run"
LOG_DIR="$RUN_DIR/logs"

FRONTEND_URL="${FRONTEND_URL:-http://localhost:5173}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
MONGO_URI_LOCAL="${MONGO_URI_LOCAL:-mongodb://localhost:27017,localhost:27018,localhost:27019/banco_nexus?replicaSet=rsBanco}"
JWT_SECRET_LOCAL="${JWT_SECRET_LOCAL:-banco-nexus-local-secret}"
SEED_LOCAL_DB="${SEED_LOCAL_DB:-true}"

log() {
  printf "\033[1;34m%s\033[0m\n" "$1"
}

ok() {
  printf "\033[1;32m%s\033[0m\n" "$1"
}

fail() {
  printf "\033[1;31mError: %s\033[0m\n" "$1" >&2
  exit 1
}

need_command() {
  command -v "$1" >/dev/null 2>&1 || fail "No encuentro '$1'. Instalalo y vuelve a correr este script."
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    fail "No encuentro Docker Compose."
  fi
}

ensure_docker_is_running() {
  if docker info >/dev/null 2>&1; then
    return 0
  fi

  if [[ "$(uname -s)" == "Darwin" ]] && command -v open >/dev/null 2>&1; then
    log "Docker no esta corriendo; intentando abrir Docker Desktop..."
    open -a Docker >/dev/null 2>&1 || true

    for _ in $(seq 1 60); do
      if docker info >/dev/null 2>&1; then
        return 0
      fi
      sleep 2
    done
  fi

  fail "Docker no esta corriendo. Abre Docker Desktop y vuelve a ejecutar ./run-project.sh."
}

ensure_port_available() {
  local port="$1"
  local service="$2"

  if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "El puerto $port ya esta ocupado. Ejecuta ./stop-project.sh y vuelve a intentar. Servicio: $service."
  fi
}

wait_for_mongo() {
  local output=""

  for _ in $(seq 1 45); do
    output="$(compose exec -T mongo-rs mongosh --quiet --port 27017 --eval 'db.adminCommand({ ping: 1 }).ok' 2>/dev/null || true)"
    if [[ "$output" == *"1"* ]]; then
      return 0
    fi
    sleep 2
  done

  fail "MongoDB no respondio a tiempo. Revisa $LOG_DIR o ejecuta docker compose logs mongo-rs."
}

wait_for_mongo_nodes() {
  local port=""
  local output=""

  for port in 27017 27018 27019; do
    for _ in $(seq 1 45); do
      output="$(compose exec -T mongo-rs mongosh --quiet --port "$port" --eval 'db.adminCommand({ ping: 1 }).ok' 2>/dev/null || true)"
      if [[ "$output" == *"1"* ]]; then
        break
      fi
      sleep 1
    done

    output="$(compose exec -T mongo-rs mongosh --quiet --port "$port" --eval 'db.adminCommand({ ping: 1 }).ok' 2>/dev/null || true)"
    if [[ "$output" != *"1"* ]]; then
      fail "MongoDB no respondio a tiempo en el puerto $port."
    fi
  done
}

wait_for_primary() {
  local output=""

  for _ in $(seq 1 45); do
    output="$(compose exec -T mongo-rs mongosh --quiet --port 27017 --eval 'try { rs.status().members.some((member) => member.stateStr === "PRIMARY") ? "PRIMARY" : "WAIT" } catch (error) { "WAIT" }' 2>/dev/null || true)"
    if [[ "$output" == *"PRIMARY"* ]]; then
      return 0
    fi
    sleep 2
  done

  fail "El replica set no eligio PRIMARY a tiempo."
}

install_dependencies_if_needed() {
  if [[ ! -d "$ROOT_DIR/backend/node_modules" ]]; then
    log "Instalando dependencias del backend..."
    (cd "$ROOT_DIR/backend" && npm ci)
  fi

  if [[ ! -d "$ROOT_DIR/frontend/node_modules" ]]; then
    log "Instalando dependencias del frontend..."
    (cd "$ROOT_DIR/frontend" && npm ci)
  fi
}

seed_database() {
  if [[ "$SEED_LOCAL_DB" != "true" ]]; then
    log "Seed omitido porque SEED_LOCAL_DB=$SEED_LOCAL_DB."
    return 0
  fi

  log "Cargando datos de prueba..."
  (
    cd "$ROOT_DIR/backend"
    DB_NAME=banco_nexus \
      MONGO_URI="$MONGO_URI_LOCAL" \
      JWT_SECRET="$JWT_SECRET_LOCAL" \
      npm run init-db
  )
}

wait_for_http() {
  local label="$1"
  local url="$2"
  local pid_file="$3"
  local log_file="$4"

  for _ in $(seq 1 45); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi

    if [[ -f "$pid_file" ]]; then
      local pid
      pid="$(cat "$pid_file")"
      if ! kill -0 "$pid" >/dev/null 2>&1; then
        tail -n 80 "$log_file" >&2 || true
        fail "$label se detuvo antes de responder."
      fi
    fi

    sleep 1
  done

  tail -n 80 "$log_file" >&2 || true
  fail "$label no respondio a tiempo en $url."
}

start_backend() {
  log "Levantando backend..."
  (
    cd "$ROOT_DIR/backend"
    exec env \
      PORT=3001 \
      DB_NAME=banco_nexus \
      MONGO_URI="$MONGO_URI_LOCAL" \
      JWT_SECRET="$JWT_SECRET_LOCAL" \
      CORS_ORIGIN="$FRONTEND_URL,http://localhost:8080" \
      npm start
  ) >"$LOG_DIR/backend.log" 2>&1 &
  echo "$!" >"$RUN_DIR/backend.pid"
  wait_for_http "Backend" "$BACKEND_URL/health" "$RUN_DIR/backend.pid" "$LOG_DIR/backend.log"
}

start_frontend() {
  log "Levantando frontend..."
  (
    cd "$ROOT_DIR/frontend"
    exec env VITE_API_URL="$BACKEND_URL" npm run dev -- --host 127.0.0.1 --port 5173
  ) >"$LOG_DIR/frontend.log" 2>&1 &
  echo "$!" >"$RUN_DIR/frontend.pid"
  wait_for_http "Frontend" "$FRONTEND_URL" "$RUN_DIR/frontend.pid" "$LOG_DIR/frontend.log"
}

main() {
  need_command docker
  need_command node
  need_command npm
  need_command curl
  ensure_docker_is_running

  mkdir -p "$LOG_DIR"

  log "Apagando ejecuciones locales previas de Banco Nexus..."
  "$ROOT_DIR/stop-project.sh" --quiet || true

  ensure_port_available 3001 "backend"
  ensure_port_available 5173 "frontend"

  log "Levantando MongoDB replica set..."
  compose up -d mongo-rs
  wait_for_mongo
  wait_for_mongo_nodes

  log "Inicializando replica set rsBanco..."
  compose exec -T mongo-rs mongosh --port 27017 /scripts/initializeReplicaSet.js >/dev/null
  wait_for_primary

  install_dependencies_if_needed
  seed_database
  start_backend
  start_frontend

  ok "Banco Nexus esta corriendo."
  printf "\n"
  printf "Frontend: %s\n" "$FRONTEND_URL"
  printf "Backend:  %s\n" "$BACKEND_URL"
  printf "Health:   %s/health\n" "$BACKEND_URL"
  printf "Logs:     %s\n" "$LOG_DIR"
  printf "\n"
  printf "Datos seed locales cargados. Puedes crear una cuenta nueva desde la interfaz.\n"
  printf "\n"
  printf "Para apagar todo:\n"
  printf "  ./stop-project.sh\n"
}

main "$@"
