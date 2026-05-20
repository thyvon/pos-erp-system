'use client'

import { useMemo } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsGroupQuery } from './hooks'

function resolveCurrency(value: unknown) {
  return typeof value === 'string' && /^[A-Z]{3}$/.test(value.trim().toUpperCase())
    ? value.trim().toUpperCase()
    : 'USD'
}

export function useAppCurrency() {
  const can = useAuthStore((state) => state.can)
  const authCurrency = useAuthStore(
    (state) => state.business?.currency ?? state.user?.business?.currency
  )
  const canReadSettings = can('settings.index')
  const generalSettings = useSettingsGroupQuery('general', canReadSettings)
  const settingsCurrency = generalSettings.data?.currency

  return useMemo(
    () => resolveCurrency(settingsCurrency ?? authCurrency),
    [authCurrency, settingsCurrency]
  )
}

export function useCurrencyFormatter() {
  const currency = useAppCurrency()

  return useMemo(
    () => new Intl.NumberFormat(undefined, { style: 'currency', currency }),
    [currency]
  )
}
