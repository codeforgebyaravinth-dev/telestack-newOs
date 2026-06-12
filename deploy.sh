#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/backend/.env.docker"
COMPOSE_FILE="$ROOT_DIR/docker-compose.yml"

if [ ! -f "$ENV_FILE" ]; then
  cat <<'EOF'
Missing backend/.env.docker.
Copy backend/.env.docker.example to backend/.env.docker and set your secrets, then rerun this script.
EOF
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed or not on PATH."
  exit 1
fi

mkdir -p "$ROOT_DIR/nginx/certs/live/rpsignage.com" "$ROOT_DIR/nginx/certs/archive/rpsignage.com" "$ROOT_DIR/nginx/www" "$ROOT_DIR/nginx/booking-domains"

ensure_env_var() {
  local key="$1"
  local value="$2"
  if grep -q "^${key}=" "$ENV_FILE"; then
    return
  fi
  printf '%s=%s\n' "$key" "$value" >>"$ENV_FILE"
}

ensure_env_var "SIGNAGE_HOST_ROOT" "$ROOT_DIR"
ensure_env_var "BOOKING_SSL_COMPOSE_ROOT" "$ROOT_DIR"
ensure_env_var "BOOKING_DOMAIN_CNAME_TARGET" "booking.rpsignage.com"

if [ ! -f "$ROOT_DIR/nginx/certs/live/rpsignage.com/fullchain.pem" ] || [ ! -f "$ROOT_DIR/nginx/certs/live/rpsignage.com/privkey.pem" ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 3650 \
    -keyout "$ROOT_DIR/nginx/certs/live/rpsignage.com/privkey.pem" \
    -out "$ROOT_DIR/nginx/certs/live/rpsignage.com/fullchain.pem" \
    -subj "/CN=rpsignage.com"
fi

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" build backend frontend nginx

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d mongodb minio redis backend frontend nginx

CERT_CHECK_OUTPUT="$(docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm certbot certificates 2>/dev/null || true)"
if ! printf '%s' "$CERT_CHECK_OUTPUT" | grep -q "Certificate Name: rpsignage.com"; then
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" run --rm certbot certonly \
    --webroot -w /var/www/certbot \
    --email "$LETSENCRYPT_EMAIL" \
    --agree-tos --no-eff-email --non-interactive \
    -d rpsignage.com -d rpsignage.in
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" restart nginx
fi

chmod +x "$ROOT_DIR/scripts/booking-ssl.sh"
"$ROOT_DIR/scripts/booking-ssl.sh" setup

echo "Provisioning pending client booking domains (if any)..."
"$ROOT_DIR/scripts/booking-ssl.sh" provision-all || true

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
