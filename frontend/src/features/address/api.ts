import { apiClient } from '@/api/client'
import type { CambodiaAddressDivision, CambodiaAddressSyncResult, CambodiaAddressSyncStatus } from './types'

export const cambodiaAddressApi = {
  provinces: () =>
    apiClient.get<CambodiaAddressDivision[]>('/v1/locations/cambodia/provinces'),
  districts: (provinceId: string) =>
    apiClient.get<CambodiaAddressDivision[]>('/v1/locations/cambodia/districts', {
      province_id: provinceId,
    }),
  communes: (districtId: string) =>
    apiClient.get<CambodiaAddressDivision[]>('/v1/locations/cambodia/communes', {
      district_id: districtId,
    }),
  villages: (communeId: string) =>
    apiClient.get<CambodiaAddressDivision[]>('/v1/locations/cambodia/villages', {
      commune_id: communeId,
    }),
  syncStatus: () =>
    apiClient.get<CambodiaAddressSyncStatus>('/v1/locations/cambodia/sync-status'),
  sync: () =>
    apiClient.post<CambodiaAddressSyncResult>('/v1/locations/cambodia/sync', undefined, {
      timeout: 120_000,
    }),
}
