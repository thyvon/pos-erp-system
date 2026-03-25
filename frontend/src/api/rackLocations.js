import api from './axios'

export const getRackLocations = (params = {}) => api.get('/rack-locations', { params })
export const getRackLocationOptions = () => api.get('/rack-locations/options')
export const createRackLocation = (payload) => api.post('/rack-locations', payload)
export const updateRackLocation = (id, payload) => api.put(`/rack-locations/${id}`, payload)
export const deleteRackLocation = (id) => api.delete(`/rack-locations/${id}`)
