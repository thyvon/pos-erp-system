import api from './axios'

export const getRoles = (params = {}) => api.get('/roles', { params })
export const getRoleOptions = () => api.get('/roles/options')
export const createRole = (payload) => api.post('/roles', payload)
export const updateRole = (id, payload) => api.put(`/roles/${id}`, payload)
export const deleteRole = (id) => api.delete(`/roles/${id}`)
