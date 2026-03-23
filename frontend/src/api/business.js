import api from './axios'

export const getBusiness = () => api.get('/business')
export const updateBusiness = (payload) => api.put('/business', payload)
