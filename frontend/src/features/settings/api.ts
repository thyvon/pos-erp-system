import api from '@/api/axios'
import { apiClient, unwrapApiResponse } from '@/api/client'
import type { BusinessProfile, BusinessProfilePayload } from '@/types/businessProfile'
import type { SettingsGroupKey, SettingsGroupValues } from '@/types/settings'

function toBusinessFormData(payload: BusinessProfilePayload) {
  const formData = new FormData()
  formData.append('_method', 'PUT')
  formData.append('name', payload.name)
  formData.append('email', payload.email)
  if (payload.legal_name) formData.append('legal_name', payload.legal_name)
  if (payload.tax_id) formData.append('tax_id', payload.tax_id)
  if (payload.phone) formData.append('phone', payload.phone)
  if (payload.country) formData.append('country', payload.country)
  formData.append('logo_url', payload.logo_url ?? '')
  if (payload.logo_file instanceof File) {
    formData.append('logo_file', payload.logo_file)
  }
  if (payload.address) {
    Object.entries(payload.address).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(`address[${key}]`, String(value))
      }
    })
  }

  return formData
}

export const settingsApi = {
  getBusinessProfile: () =>
    apiClient.get<BusinessProfile>('/v1/business'),
  updateBusinessProfile: (payload: BusinessProfilePayload) =>
    payload.logo_file instanceof File
      ? unwrapApiResponse<BusinessProfile>(
          api.post('/v1/business', toBusinessFormData(payload), {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        )
      : apiClient.put<BusinessProfile, BusinessProfilePayload>('/v1/business', payload),
  getGroup: (group: SettingsGroupKey) =>
    apiClient.get<SettingsGroupValues>(`/v1/settings/${group}`),
  updateGroup: (group: SettingsGroupKey, settings: SettingsGroupValues) =>
    apiClient.put<SettingsGroupValues, { settings: SettingsGroupValues }>(
      `/v1/settings/${group}`,
      { settings }
    ),
}
