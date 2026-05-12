# ERP System Frontend (Next.js)

A modern React frontend for the ERP system built with Next.js App Router.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Library:** Material-UI (MUI)
- **State Management:** Zustand
- **Data Fetching:** TanStack Query (React Query)
- **Forms:** React Hook Form
- **Validation:** Zod
- **HTTP Client:** Axios

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and layouts
├── components/            # Reusable React components
├── features/              # Feature-specific components and logic
├── layouts/               # Layout components
├── services/              # API services and external integrations
├── hooks/                 # Custom React hooks
├── providers/             # React context providers
├── stores/                # Zustand state stores
├── theme/                 # MUI theme configuration
├── types/                 # TypeScript type definitions
├── utils/                 # Helper functions and validation schemas
└── configs/               # Application configuration
```

## API Integration

The frontend is configured to proxy API requests to the Laravel backend running on `http://localhost:8000`. Make sure your Laravel API is running before starting the frontend.

## Key Features

- **Type Safety:** Full TypeScript support with strict type checking
- **Modern UI:** Material-UI components for consistent design
- **Efficient Data Fetching:** TanStack Query for caching and synchronization
- **Form Management:** React Hook Form with Zod validation
- **State Management:** Zustand for global state
- **Responsive Design:** Mobile-first approach with MUI

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Migration from Vue.js

This replaces the previous Vue.js frontend (`frontend-old/`). The new stack provides:

- Better TypeScript integration
- Improved performance with Next.js
- More mature ecosystem with MUI
- Enhanced developer experience
- Better SEO capabilities