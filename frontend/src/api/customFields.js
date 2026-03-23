import api from './axios'

export const getCustomFields = (params = {}) => api.get('/custom-field-definitions', { params })
export const createCustomField = (payload) => api.post('/custom-field-definitions', payload)
export const updateCustomField = (id, payload) => api.put(`/custom-field-definitions/${id}`, payload)
export const deleteCustomField = (id) => api.delete(`/custom-field-definitions/${id}`)
