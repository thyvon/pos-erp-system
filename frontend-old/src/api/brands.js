import api from './axios'

export const getBrands = (params = {}) => api.get('/brands', { params })
export const getBrandOptions = () => api.get('/brands/options')
export const createBrand = (payload) => api.post('/brands', payload)
export const updateBrand = (id, payload) => api.put(`/brands/${id}`, payload)
export const deleteBrand = (id) => api.delete(`/brands/${id}`)
