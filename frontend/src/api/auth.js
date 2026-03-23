import api from './axios'

export const login = (payload) => api.post('/auth/login', payload)
export const logout = () => api.post('/auth/logout')
export const me = () => api.get('/auth/me')
export const updatePreferences = (payload) => api.put('/auth/preferences', payload)
