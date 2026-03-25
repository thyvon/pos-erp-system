import api from './axios'

export const login = (payload) => api.post('/auth/login', payload)
export const logout = () => api.post('/auth/logout')
export const me = () => api.get('/auth/me')
export const updatePreferences = (payload) => api.put('/auth/preferences', payload)
export const forgotPassword = (payload) => api.post('/auth/forgot-password', payload)
export const resetPassword = (payload) => api.post('/auth/reset-password', payload)
