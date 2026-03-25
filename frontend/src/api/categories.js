import api from './axios'

export const getCategories = (params = {}) => api.get('/categories', { params })
export const getCategoryOptions = () => api.get('/categories/options')
export const createCategory = (payload) => api.post('/categories', payload)
export const updateCategory = (id, payload) => api.put(`/categories/${id}`, payload)
export const deleteCategory = (id) => api.delete(`/categories/${id}`)
