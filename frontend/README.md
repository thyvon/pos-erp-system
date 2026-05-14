# ERP Frontend

Next.js frontend for the ERP API.

## Stack

- Next.js App Router
- React 19
- TypeScript strict mode
- MUI for dense operational UI
- TanStack Query for server state
- Zustand for local UI/auth session state
- Axios for API transport
- React Hook Form + Zod for forms
- i18next for English/Khmer translations

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to the Laravel API root. Both of these are valid:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Quality Checks

```bash
npm run lint
npm run type-check
npm run build
```

or run all checks:

```bash
npm run check
```

## Architecture Rules

- Put API transport concerns in `src/api`.
- Put feature-specific API calls and hooks in `src/features/<feature>`.
- Keep route files thin; pages should compose feature hooks and UI.
- Use TanStack Query for backend data, loading, caching, and invalidation.
- Use Zustand only for local UI state and persisted session state.
- Use MUI Data Grid for ERP list pages that need pagination, sorting, filtering, and bulk actions.
- Keep styling functional and dense; prioritize scanability, keyboard-friendly controls, and clear form errors.
