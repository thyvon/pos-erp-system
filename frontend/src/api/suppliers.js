import api from './axios'

export const getSuppliers = (params = {}) => api.get('/suppliers', { params })
export const createSupplier = (payload) => api.post('/suppliers', payload)
export const updateSupplier = (id, payload) => api.put(`/suppliers/${id}`, payload)
export const deleteSupplier = (id) => api.delete(`/suppliers/${id}`)
