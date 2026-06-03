'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsApi } from './api'
import { useAuthStore } from '@/stores/authStore'
import type { BusinessProfilePayload } from '@/types/businessProfile'
import type { SettingsGroupKey, SettingsGroupValues } from '@/types/settings'

export const settingsKeys = {
  all: ['settings'] as const,
  businessProfile: () => [...settingsKeys.all, 'business-profile'] as const,
  group: (group: SettingsGroupKey) => [...settingsKeys.all, group] as const,
}

export function useBusinessProfileQuery(enabled = true) {
  return useQuery({
    queryKey: settingsKeys.businessProfile(),
    queryFn: () => settingsApi.getBusinessProfile(),
    enabled,
  })
}

export function useUpdateBusinessProfileMutation() {
  const queryClient = useQueryClient()
  const setBusiness = useAuthStore((state) => state.setBusiness)

  return useMutation({
    mutationFn: (payload: BusinessProfilePayload) => settingsApi.updateBusinessProfile(payload),
    onSuccess: (business) => {
      setBusiness({
        ...business,
        locale: business.locale ?? 'en',
      })
      queryClient.setQueryData(settingsKeys.businessProfile(), business)
      queryClient.invalidateQueries({ queryKey: settingsKeys.businessProfile() })
    },
  })
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
