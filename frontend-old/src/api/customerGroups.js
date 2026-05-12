import api from './axios'

export const getCustomerGroups = (params = {}) => api.get('/customer-groups', { params })
export const createCustomerGroup = (payload) => api.post('/customer-groups', payload)
export const updateCustomerGroup = (id, payload) => api.put(`/customer-groups/${id}`, payload)
export const deleteCustomerGroup = (id) => api.delete(`/customer-groups/${id}`)
