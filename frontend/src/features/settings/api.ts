import { apiClient } from '@/api/client'
import type { BusinessProfile, BusinessProfilePayload } from '@/types/businessProfile'
import type { SettingsGroupKey, SettingsGroupValues } from '@/types/settings'

export const settingsApi = {
  getBusinessProfile: () =>
    apiClient.get<BusinessProfile>('/v1/business'),
  updateBusinessProfile: (payload: BusinessProfilePayload) =>
    apiClient.put<BusinessProfile, BusinessProfilePayload>('/v1/business', payload),
  getGroup: (group: SettingsGroupKey) =>
    apiClient.get<SettingsGroupValues>(`/v1/settings/${group}`),
  updateGroup: (group: SettingsGroupKey, settings: SettingsGroupValues) =>
    apiClient.put<SettingsGroupValues, { settings: SettingsGroupValues }>(
      `/v1/settings/${group}`,
      { settings }
    ),
}
