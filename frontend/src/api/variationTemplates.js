import api from './axios'

export const getVariationTemplates = (params = {}) => api.get('/variation-templates', { params })
export const getVariationTemplateOptions = () => api.get('/variation-templates/options')
export const createVariationTemplate = (payload) => api.post('/variation-templates', payload)
export const updateVariationTemplate = (id, payload) => api.put(`/variation-templates/${id}`, payload)
export const deleteVariationTemplate = (id) => api.delete(`/variation-templates/${id}`)
