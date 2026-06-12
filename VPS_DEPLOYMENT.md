# VPS Deployment Guide

This deployment uses Docker Compose with:

- MongoDB in a container
- MinIO as the S3-compatible object store
- Redis for websocket/event fan-out
- FastAPI backend
- React frontend served by Nginx
- Public Nginx reverse proxy for `rpsignage.com` and `rpsignage.in`

## 1) Prerequisites

Install on the VPS:

- Docker Engine
- Docker Compose v2
- Git
- Port `80` and `443` open
- DNS A records for both domains pointing to the VPS

## 2) Clone the project

```bash
git clone <your-repo-url>
cd SignageOS1-main
```

## 3) Configure Docker environment

Copy the example env file:

```bash
cp backend/.env.docker.example backend/.env.docker
```

Edit `backend/.env.docker` and set at least:

```env
JWT_SECRET=<strong-random-secret>
ADMIN_PASSWORD=<strong-admin-password>
MINIO_ROOT_PASSWORD=<strong-minio-password>
LETSENCRYPT_EMAIL=admin@rpsignage.com
SIGNAGE_HOST_ROOT=/home/ubuntu/SignageOS1-main
BOOKING_SSL_COMPOSE_ROOT=/home/ubuntu/SignageOS1-main
BOOKING_DOMAIN_CNAME_TARGET=booking.rpsignage.com
```

Use the **real absolute path** where you cloned the repo for `SIGNAGE_HOST_ROOT` and `BOOKING_SSL_COMPOSE_ROOT` (or run `./deploy.sh`, which writes them for you).

The example file already points the stack to:

- `mongodb://mongodb:27017`
- `http://minio:9000`
- `https://rpsignage.com,https://rpsignage.in`

## 4) Start the stack

Run the single deployment script:

```bash
chmod +x deploy.sh
./deploy.sh
```

What the script does:

1. Generates a temporary self-signed certificate if one does not exist yet.
2. Builds the backend, frontend, and Nginx images.
3. Starts MongoDB, MinIO, Redis, backend, frontend, and public Nginx.
4. Requests a real Let's Encrypt certificate for both domains.
5. Restarts Nginx after certificates are issued.

## 5) Service layout

- `mongodb` stores application data.
- `minio` stores uploaded media.
- `redis` carries announcement and payload refresh events.
- `backend` serves `/api/*` and streams media from MinIO.
- `frontend` serves the React SPA.
- `nginx` terminates TLS and routes both domains to the same app.

## 6) Public URLs

- `https://rpsignage.com`
- `https://rpsignage.in`

Both domains serve the same application.

## 7) Notes

- Uploaded media is stored in MinIO and served through `/api/media/serve/{id}`.
- MongoDB and MinIO data persist in Docker volumes.
- If you change the primary public domain, update `PUBLIC_APP_URL` in `backend/.env.docker`.
- MinIO console is kept internal by default. If you want it public, add a separate protected host later.

## 8) Custom booking domains (client SSL)

Each dealer client can use a domain like `book.clinic.com` for public booking.

### DNS (at the client's registrar)

Add **one** of:

- **CNAME** `book.clinic.com` → `booking.rpsignage.com` (or your `BOOKING_DOMAIN_CNAME_TARGET`)
- **A record** `book.clinic.com` → your VPS public IP (`BOOKING_DOMAIN_TARGET_IP`)

Also ensure `booking.rpsignage.com` has an **A record** to the same VPS IP (used as the CNAME target).

### Automated SSL (recommended)

`deploy.sh` runs this automatically. You can also run it manually:

```bash
cd /root/rpsignage/signagex   # your repo path

chmod +x scripts/booking-ssl.sh
./scripts/booking-ssl.sh setup          # one-time: dirs, rebuild backend, verify Docker/nginx
./scripts/booking-ssl.sh provision-all  # issue SSL for every pending client domain
./scripts/booking-ssl.sh doctor book.clinic.com  # optional diagnostics + ACME HTTP test
```

**Workflow**

1. In **Dealer → Clients**, set the custom domain and save.
2. Client adds DNS: CNAME → `booking.rpsignage.com`.
3. Run `./scripts/booking-ssl.sh provision-all` (or wait for cron — see below).

Status flow: **DNS pending** → **SSL pending** → **Live**.

**Cron** (auto-retry every 15 minutes until SSL is live):

```bash
crontab -e
```

Add:

```cron
*/15 * * * * cd /root/rpsignage/signagex && ./scripts/booking-ssl.sh provision-all >> /var/log/booking-ssl.log 2>&1
```

Replace `/root/rpsignage/signagex` with your real path.

### Common SSL errors

| Symptom | Fix |
|---------|-----|
| `LETSENCRYPT_EMAIL is not configured` | Set `LETSENCRYPT_EMAIL` in `backend/.env.docker`, recreate backend |
| `no such file or directory` (docker/compose) | Set `SIGNAGE_HOST_ROOT` and `BOOKING_SSL_COMPOSE_ROOT` to the repo's absolute path on the VPS, rebuild backend |
| `Connection refused` / timeout on port 80 | Open firewall: `ufw allow 80` and `ufw allow 443` |
| DNS pending | CNAME not propagated yet; check with `dig book.clinic.com` |
| certbot 404 on ACME challenge | Ensure nginx is up and `nginx/booking-domains/*.conf` exists for that domain |

## 9) Backups

Create a backup with:

```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

This saves:

- A MongoDB dump as `mongodump` archive
- The MinIO data volume as a compressed tarball
- A snapshot of `backend/.env.docker` for reference

Restore is intentionally manual so you can verify where the data is going before overwriting production volumes.
