import api from './axios'

export const getBranches = (params = {}) => api.get('/branches', { params })
export const createBranch = (payload) => api.post('/branches', payload)
export const updateBranch = (id, payload) => api.put(`/branches/${id}`, payload)
export const deleteBranch = (id) => api.delete(`/branches/${id}`)
