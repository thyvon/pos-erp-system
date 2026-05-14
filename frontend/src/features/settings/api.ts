import { apiClient } from '@/api/client'
import type { SettingsGroupKey, SettingsGroupValues } from '@/types/settings'

export const settingsApi = {
  getGroup: (group: SettingsGroupKey) =>
    apiClient.get<SettingsGroupValues>(`/v1/settings/${group}`),
  updateGroup: (group: SettingsGroupKey, settings: SettingsGroupValues) =>
    apiClient.put<SettingsGroupValues, { settings: SettingsGroupValues }>(
      `/v1/settings/${group}`,
      { settings }
    ),
}
