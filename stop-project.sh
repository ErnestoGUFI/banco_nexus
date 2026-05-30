#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT_DIR/.local-run"

QUIET=false
CLEAN_DATA=false

for arg in "$@"; do
  case "$arg" in
    --quiet)
      QUIET=true
      ;;
    --clean-data)
      CLEAN_DATA=true
      ;;
    *)
      printf "Uso: ./stop-project.sh [--quiet] [--clean-data]\n" >&2
      exit 1
      ;;
  esac
done

log() {
  if [[ "$QUIET" != "true" ]]; then
    printf "\033[1;34m%s\033[0m\n" "$1"
  fi
}

warn() {
  if [[ "$QUIET" != "true" ]]; then
    printf "\033[1;33m%s\033[0m\n" "$1"
  fi
}

ok() {
  if [[ "$QUIET" != "true" ]]; then
    printf "\033[1;32m%s\033[0m\n" "$1"
  fi
}

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    return 1
  fi
}

process_cwd() {
  local pid="$1"

  if command -v lsof >/dev/null 2>&1; then
    lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
  fi
}

is_project_process() {
  local pid="$1"
  local cwd
  local command_line

  cwd="$(process_cwd "$pid" || true)"
  command_line="$(ps -p "$pid" -o command= 2>/dev/null || true)"

  [[ "$cwd" == "$ROOT_DIR"* || "$command_line" == *"$ROOT_DIR"* ]]
}

terminate_pid() {
  local pid="$1"
  local label="$2"

  if ! kill -0 "$pid" >/dev/null 2>&1; then
    return 0
  fi

  if ! is_project_process "$pid"; then
    warn "No apague $label PID $pid porque no parece pertenecer a este proyecto."
    return 0
  fi

  log "Apagando $label PID $pid..."
  kill "$pid" >/dev/null 2>&1 || true

  for _ in $(seq 1 20); do
    if ! kill -0 "$pid" >/dev/null 2>&1; then
      return 0
    fi
    sleep 0.5
  done

  warn "$label no cerro a tiempo; forzando apagado."
  kill -9 "$pid" >/dev/null 2>&1 || true
}

stop_pid_file() {
  local label="$1"
  local pid_file="$2"

  if [[ -f "$pid_file" ]]; then
    local pid
    pid="$(cat "$pid_file" 2>/dev/null || true)"
    if [[ -n "$pid" ]]; then
      terminate_pid "$pid" "$label"
    fi
    rm -f "$pid_file"
  fi
}

stop_port_processes() {
  local port="$1"
  local label="$2"

  if ! command -v lsof >/dev/null 2>&1; then
    return 0
  fi

  while IFS= read -r pid; do
    [[ -n "$pid" ]] || continue
    terminate_pid "$pid" "$label"
  done < <(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
}

stop_docker_services() {
  if ! command -v docker >/dev/null 2>&1; then
    return 0
  fi

  if ! docker info >/dev/null 2>&1; then
    warn "Docker no esta corriendo; omito apagado de contenedores."
    return 0
  fi

  log "Apagando contenedores Docker locales..."
  compose down --remove-orphans >/dev/null 2>&1 || true
}

main() {
  stop_pid_file "backend" "$RUN_DIR/backend.pid"
  stop_pid_file "frontend" "$RUN_DIR/frontend.pid"

  stop_port_processes 3001 "backend"
  stop_port_processes 5173 "frontend"

  stop_docker_services

  if [[ "$CLEAN_DATA" == "true" ]]; then
    log "Eliminando datos locales de MongoDB..."
    rm -rf "$ROOT_DIR/.mongo-rs"
  fi

  ok "Banco Nexus local quedo apagado."
}

main "$@"
