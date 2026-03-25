import api from './axios'

export const getPriceGroups = (params = {}) => api.get('/price-groups', { params })
export const createPriceGroup = (payload) => api.post('/price-groups', payload)
export const updatePriceGroup = (id, payload) => api.put(`/price-groups/${id}`, payload)
export const deletePriceGroup = (id) => api.delete(`/price-groups/${id}`)
