'use client'

import { useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { resolveAppDateFormat } from '@/utils/dateFormat'
import { useSettingsGroupQuery } from './hooks'

export function useAppDateFormat() {
  const can = useAuthStore((state) => state.can)
  const authDateFormat = useAuthStore(
    (state) => state.business?.date_format ?? state.user?.business?.date_format
  )
  const canReadSettings = can('settings.index')
  const generalSettings = useSettingsGroupQuery('general', canReadSettings)
  const settingsDateFormat = generalSettings.data?.date_format

  return useMemo(
    () => resolveAppDateFormat(settingsDateFormat ?? authDateFormat),
    [authDateFormat, settingsDateFormat]
  )
}
