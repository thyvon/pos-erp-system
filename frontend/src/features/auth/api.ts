import { apiClient } from '@/api/client'
import type { AuthLoginResponse, AuthMeResponse, LoginPayload, User } from '@/types/auth'

export const authApi = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthLoginResponse, LoginPayload>('/v1/auth/login', payload),
  me: () => apiClient.get<User>('/v1/auth/me'),
  logout: () => apiClient.post<null>('/v1/auth/logout'),
  updatePreferences: (payload: { locale: 'en' | 'km' }) =>
    apiClient.put<AuthMeResponse, { locale: 'en' | 'km' }>('/v1/auth/preferences', payload),
}
