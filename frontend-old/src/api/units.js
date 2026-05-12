import api from './axios'

export const getUnits = (params = {}) => api.get('/units', { params })
export const getUnitOptions = () => api.get('/units/options')
export const createUnit = (payload) => api.post('/units', payload)
export const updateUnit = (id, payload) => api.put(`/units/${id}`, payload)
export const deleteUnit = (id) => api.delete(`/units/${id}`)
