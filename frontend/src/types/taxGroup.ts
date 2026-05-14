import type { TaxRateType } from './taxRate'

export interface TaxGroupRate {
  id: string
  name: string
  type: TaxRateType
  rate: number
}

export interface TaxGroup {
  id: string
  business_id: string
  name: string
  description: string | null
  is_active: boolean
  tax_rate_count: number
  tax_rate_ids: string[]
  tax_rates: TaxGroupRate[]
  created_at: string
  updated_at: string
}

export interface TaxGroupPayload {
  name: string
  description?: string | null
  is_active?: boolean
  tax_rate_ids: string[]
}

export interface TaxGroupFilters {
  search?: string
  is_active?: boolean | ''
  page?: number
  per_page?: number
}
