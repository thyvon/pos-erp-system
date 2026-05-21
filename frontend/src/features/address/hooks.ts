'use client'

import { useQuery } from '@tanstack/react-query'
import { cambodiaAddressApi } from './api'

export const cambodiaAddressKeys = {
  all: ['cambodia-address'] as const,
  provinces: () => [...cambodiaAddressKeys.all, 'provinces'] as const,
  districts: (provinceId: string) => [...cambodiaAddressKeys.all, 'districts', provinceId] as const,
  communes: (districtId: string) => [...cambodiaAddressKeys.all, 'communes', districtId] as const,
  villages: (communeId: string) => [...cambodiaAddressKeys.all, 'villages', communeId] as const,
}

export function useCambodiaProvincesQuery(enabled = true) {
  return useQuery({
    queryKey: cambodiaAddressKeys.provinces(),
    queryFn: () => cambodiaAddressApi.provinces(),
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useCambodiaDistrictsQuery(provinceId: string, enabled = true) {
  return useQuery({
    queryKey: cambodiaAddressKeys.districts(provinceId),
    queryFn: () => cambodiaAddressApi.districts(provinceId),
    enabled: enabled && provinceId !== '',
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useCambodiaCommunesQuery(districtId: string, enabled = true) {
  return useQuery({
    queryKey: cambodiaAddressKeys.communes(districtId),
    queryFn: () => cambodiaAddressApi.communes(districtId),
    enabled: enabled && districtId !== '',
    staleTime: 24 * 60 * 60 * 1000,
  })
}

export function useCambodiaVillagesQuery(communeId: string, enabled = true) {
  return useQuery({
    queryKey: cambodiaAddressKeys.villages(communeId),
    queryFn: () => cambodiaAddressApi.villages(communeId),
    enabled: enabled && communeId !== '',
    staleTime: 24 * 60 * 60 * 1000,
  })
}
