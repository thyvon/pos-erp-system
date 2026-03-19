# POS ERP System

This repository is now split into:

- Laravel backend API in the project root
- Standalone Vue frontend SPA in [frontend](/home/vun/Project/ERP-SYSTEM/frontend)

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

Run the standalone Vue frontend:

```bash
cd frontend
npm install
npm run dev
```

Default frontend URL:

```text
http://127.0.0.1:5173
```

The frontend is configured to call:

```text
http://127.0.0.1:8000/api/v1
```

## Current Active Frontend

The old Blade/Vite frontend has been removed.

The active UI code now lives only in:

- [frontend/src](/home/vun/Project/ERP-SYSTEM/frontend/src)
