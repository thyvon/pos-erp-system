import api from './axios'

export const getBusinesses = (params = {}) => api.get('/admin/businesses', { params })
export const createBusiness = (payload) => api.post('/admin/businesses', payload)
export const updateBusiness = (id, payload) => api.put(`/admin/businesses/${id}`, payload)
