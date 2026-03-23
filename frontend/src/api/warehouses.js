import api from './axios'

export const getWarehouses = (params = {}) => api.get('/warehouses', { params })
export const createWarehouse = (payload) => api.post('/warehouses', payload)
export const updateWarehouse = (id, payload) => api.put(`/warehouses/${id}`, payload)
export const deleteWarehouse = (id) => api.delete(`/warehouses/${id}`)
