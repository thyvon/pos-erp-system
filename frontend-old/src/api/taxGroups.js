import api from './axios'

export const getTaxGroups = (params = {}) => api.get('/tax-groups', { params })
export const createTaxGroup = (payload) => api.post('/tax-groups', payload)
export const updateTaxGroup = (id, payload) => api.put(`/tax-groups/${id}`, payload)
export const deleteTaxGroup = (id) => api.delete(`/tax-groups/${id}`)
