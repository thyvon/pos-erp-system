// Application configuration
export const config = {
  app: {
    name: 'ERP System',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  },
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    timeout: 10000,
  },
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  features: {
    enableDevTools: process.env.NODE_ENV === 'development',
    enableAnalytics: false,
  },
} as const

export default config