# Deployment Guide

This guide documents the recommended production deployment flow for POS ERP System.

## Production Architecture

Recommended flow:

```text
Cloudflare DNS / Tunnel
        ↓
Nginx Proxy Manager
        ↓
Docker network
        ↓
Next.js frontend + Laravel API + PostgreSQL + Redis
```

## Services

| Service | Purpose |
|---|---|
| Laravel API | Backend business logic, authentication, modules, permissions |
| Next.js frontend | Modern ERP user interface |
| PostgreSQL 16 | Main relational database |
| Redis | Cache, queues, and sessions when enabled |
| Nginx Proxy Manager | Reverse proxy and SSL routing |
| Cloudflare | DNS, SSL edge, WAF, tunnel, and domain protection |

## Environment Files

Create and review:

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```

Backend important values:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.example.com
DB_CONNECTION=pgsql
DB_HOST=postgres
DB_PORT=5432
DB_DATABASE=erp_db
DB_USERNAME=erp_user
DB_PASSWORD=use-a-strong-secret
DB_SSLMODE=require
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
SANCTUM_STATEFUL_DOMAINS=example.com,app.example.com
```

Frontend important values:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.example.com/api
```

## Backend Setup

The project Docker image includes PHP's `pdo_pgsql` extension. Non-Docker PHP installations must enable it before running Artisan.

```bash
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Frontend Setup

```bash
cd frontend
npm install
npm run build
npm run start
```

## Docker Deployment

Recommended deployment command:

```bash
docker compose up -d --build
```

After deployment:

```bash
docker compose ps
docker compose logs -f
```

## Nginx Proxy Manager Routing

Recommended host setup:

| Domain | Forward Host | Forward Port |
|---|---|---|
| app.example.com | frontend container/service | 3000 |
| api.example.com | Laravel/Nginx container/service | 80 or mapped API port |

Enable:

- Force SSL
- HTTP/2
- WebSocket support for frontend if needed

## Production Checklist

- [ ] `APP_DEBUG=false`
- [ ] Strong database password
- [ ] Redis not exposed publicly
- [ ] PostgreSQL not exposed publicly
- [ ] NPM admin not publicly exposed
- [ ] Cloudflare proxy/tunnel enabled
- [ ] Laravel scheduler configured
- [ ] Queue worker configured
- [ ] Daily database backup configured
- [ ] Storage folder permissions verified
- [ ] SSL certificate active
- [ ] Frontend API URL points to production API

## Queue Worker

Run queue worker with Supervisor or a Docker worker service:

```bash
php artisan queue:work --tries=3 --timeout=90
```

## Scheduler

Add cron on the host or a scheduler container:

```bash
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```

## Backup Strategy

Minimum production backup policy:

- Daily PostgreSQL custom-format backup
- Daily uploaded files backup
- Keep 7 daily backups
- Keep 4 weekly backups
- Test restore monthly with `pg_restore` into an isolated database

Example database dump:

```bash
pg_dump --format=custom --file=erp_db.dump --dbname=postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME
```

## Deployment Verification

After every deployment, verify:

```bash
php artisan migrate:status
php artisan route:list
cd frontend && npm run build
```

Then test:

- Login
- Dashboard load
- Product list
- Sales/POS flow
- Inventory movement
- Permission-restricted pages
