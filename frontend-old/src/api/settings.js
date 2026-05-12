import api from './axios'

export const getSettingsGroup = (group) => api.get(`/settings/${group}`)
export const updateSettingsGroup = (group, settings) => api.put(`/settings/${group}`, { settings })
