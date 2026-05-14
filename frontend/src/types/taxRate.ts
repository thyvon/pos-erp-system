export type TaxRateType = 'percentage' | 'fixed'

export interface TaxRate {
  id: string
  business_id: string
  name: string
  rate: number
  type: TaxRateType
  is_default: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface TaxRatePayload {
  name: string
  rate: number
  type: TaxRateType
  is_default?: boolean
  is_active?: boolean
}

export interface TaxRateFilters {
  search?: string
  type?: TaxRateType | ''
  is_active?: boolean | ''
  page?: number
  per_page?: number
}
