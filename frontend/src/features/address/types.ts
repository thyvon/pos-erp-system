export interface CambodiaAddressDivision {
  id: string
  name_en: string
  name_km: string
  province_id: string | null
  district_id: string | null
  commune_id: string | null
  type: 'province' | 'district' | 'commune' | 'village'
  parent_code: string | null
  synced_at: string | null
}

export interface CambodiaAddressSyncStatus {
  last_synced_at: string | null
  counts: {
    provinces: number
    districts: number
    communes: number
    villages: number
  }
}

export interface CambodiaAddressSyncResult {
  synced_at: string
  total: number
  resources: Record<
    string,
    {
      created: number
      updated: number
      total: number
    }
  >
  status: CambodiaAddressSyncStatus
}
