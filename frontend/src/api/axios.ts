import axios, { AxiosInstance, AxiosResponse } from 'axios'

function resolveApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
  const trimmedUrl = configuredUrl.replace(/\/+$/, '')

  return trimmedUrl.endsWith('/api') ? trimmedUrl : `${trimmedUrl}/api`
}

const api: AxiosInstance = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('erp-auth')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
