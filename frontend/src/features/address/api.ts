import { apiClient } from '@/api/client'
import type { CambodiaAddressDivision } from './types'

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
}
