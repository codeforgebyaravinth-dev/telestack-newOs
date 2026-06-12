#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/backend/.env.docker"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

dc() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

load_env() {
  if [ ! -f "$ENV_FILE" ]; then
    echo "Missing $ENV_FILE — copy backend/.env.docker.example first."
    exit 1
  fi
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
}

ensure_env_var() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    return
  fi
  printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
  echo "Added $key=$value to backend/.env.docker"
}

cmd_setup() {
  load_env
  ensure_env_var "SIGNAGE_HOST_ROOT" "$ROOT_DIR"
  ensure_env_var "BOOKING_SSL_COMPOSE_ROOT" "$ROOT_DIR"
  ensure_env_var "BOOKING_DOMAIN_CNAME_TARGET" "booking.rpsignage.com"

  mkdir -p \
    "$ROOT_DIR/nginx/booking-domains" \
    "$ROOT_DIR/nginx/certs" \
    "$ROOT_DIR/nginx/www/.well-known/acme-challenge"
  chmod 755 "$ROOT_DIR/nginx/booking-domains" "$ROOT_DIR/nginx/www"

  echo "==> Rebuilding backend (Docker CLI for SSL automation)"
  dc build backend
  dc up -d mongodb minio redis backend frontend nginx

  echo "==> Stopping idle certbot container (only used via 'run')"
  dc stop certbot 2>/dev/null || true
  dc rm -f certbot 2>/dev/null || true

  echo "==> Verifying backend can run Docker Compose"
  dc exec -T backend docker compose version
  dc exec -T backend sh -c 'test -f "$BOOKING_SSL_COMPOSE_ROOT/docker-compose.yml" && echo "compose project path OK"'

  echo "==> Nginx config test"
  dc exec -T nginx nginx -t

  echo "Setup complete. Provision domains with:"
  echo "  $0 provision-all"
  echo "  $0 provision book.client.com"
}

cmd_doctor() {
  load_env
  local domain="${1:-}"

  echo "==> Env"
  grep -E '^(LETSENCRYPT_EMAIL|SIGNAGE_HOST_ROOT|BOOKING_SSL_COMPOSE_ROOT|BOOKING_DOMAIN_CNAME_TARGET)=' "$ENV_FILE" || true

  echo "==> Containers"
  dc ps backend nginx mongodb

  echo "==> Backend Docker access"
  dc exec -T backend docker compose version
  dc exec -T backend sh -c 'ls -la "$BOOKING_SSL_COMPOSE_ROOT/docker-compose.yml" "$BOOKING_DOMAINS_DIR" 2>/dev/null || true'

  echo "==> Nginx"
  dc exec -T nginx nginx -t
  ls -la "$ROOT_DIR/nginx/booking-domains/" 2>/dev/null || true

  if [ -n "$domain" ]; then
    echo "==> DNS for $domain"
    dig +short A "$domain" || true
    dig +short CNAME "$domain" || true
    if [ -n "${BOOKING_DOMAIN_CNAME_TARGET:-}" ]; then
      dig +short A "$BOOKING_DOMAIN_CNAME_TARGET" || true
    fi
    echo "==> ACME path test for $domain"
    echo "doctor-test" >"$ROOT_DIR/nginx/www/.well-known/acme-challenge/doctor-test"
    curl -fsS "http://${domain}/.well-known/acme-challenge/doctor-test" && echo " (OK)" || echo "ACME HTTP test failed"
  fi
}

cmd_provision() {
  load_env
  if [ "$#" -lt 1 ]; then
    echo "Usage: $0 provision <domain> [domain2 ...]"
    exit 1
  fi
  dc exec -T backend python -m backend.booking_ssl_cli provision "$@"
}

cmd_provision_all() {
  load_env
  dc exec -T backend python -m backend.booking_ssl_cli provision-all
}

usage() {
  cat <<EOF
Automate custom booking-domain SSL on the VPS.

Usage:
  $0 setup                 One-time setup (dirs, env paths, rebuild backend)
  $0 doctor [domain]       Health checks (+ optional ACME HTTP test)
  $0 provision <domain>    Issue SSL for one domain and update MongoDB
  $0 provision-all         Provision every non-active client custom domain

Examples:
  cd ~/rpsignage/signagex && ./scripts/booking-ssl.sh setup
  ./scripts/booking-ssl.sh provision-all
  ./scripts/booking-ssl.sh provision book.clinic.com

Cron (retry pending domains every 15 minutes):
  */15 * * * * cd /root/rpsignage/signagex && ./scripts/booking-ssl.sh provision-all >> /var/log/booking-ssl.log 2>&1
EOF
}

main() {
  local cmd="${1:-}"
  shift || true
  case "$cmd" in
    setup) cmd_setup "$@" ;;
    doctor) cmd_doctor "$@" ;;
    provision) cmd_provision "$@" ;;
    provision-all) cmd_provision_all "$@" ;;
    -h|--help|help|"") usage ;;
    *)
      echo "Unknown command: $cmd"
      usage
      exit 1
      ;;
  esac
}

main "$@"
