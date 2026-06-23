# POS ERP System

This repository is now split into:

- Laravel backend API in the project root
- Standalone Next.js React frontend in [frontend](/home/vun/Project/ERP-SYSTEM/frontend)

## Database

PostgreSQL 16 is the only supported relational database.

The project Docker image includes `pdo_pgsql`. When running Artisan through local XAMPP PHP, enable `extension=pdo_pgsql` in `php.ini` first.

```bash
cp .env.example .env
docker compose up -d postgres redis mailhog pgadmin
php artisan key:generate
php artisan migrate --seed
```

Backend tests use the isolated PostgreSQL service:

```bash
docker compose --profile test up -d postgres-test
php artisan test
```

## Backend

Run the Laravel API from the project root:

```bash
php artisan serve
```

Default backend URL:

```text
http://127.0.0.1:8000
```

## Frontend

Run the standalone Next.js frontend:

```bash
cd frontend
npm install
npm run dev
```

Default frontend URL:

```text
http://127.0.0.1:3000
```

The frontend is configured to call:

```text
http://127.0.0.1:8000/api
```

## Current Active Frontend

The old Blade/Vite frontend has been removed.

The active UI code now lives only in:

- [frontend/src](/home/vun/Project/ERP-SYSTEM/frontend/src)
