import api from './axios'

export const getTaxRates = (params = {}) => api.get('/tax-rates', { params })
export const createTaxRate = (payload) => api.post('/tax-rates', payload)
export const updateTaxRate = (id, payload) => api.put(`/tax-rates/${id}`, payload)
export const deleteTaxRate = (id) => api.delete(`/tax-rates/${id}`)
