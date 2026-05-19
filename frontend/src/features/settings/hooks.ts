'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from './api'
import type { SettingsGroupKey, SettingsGroupValues } from '@/types/settings'

export const settingsKeys = {
  all: ['settings'] as const,
  group: (group: SettingsGroupKey) => [...settingsKeys.all, group] as const,
}

export function useSettingsGroupQuery(group: SettingsGroupKey, enabled = true) {
  return useQuery({
    queryKey: settingsKeys.group(group),
    queryFn: () => settingsApi.getGroup(group),
    enabled,
  })
}

export function useUpdateSettingsGroupMutation(group: SettingsGroupKey) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: SettingsGroupValues) => settingsApi.updateGroup(group, settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.group(group) })
    },
  })
}
