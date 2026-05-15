export interface PriceGroup {
  id: string
  business_id: string
  name: string
  description: string | null
  is_default: boolean
  customer_groups_count: number
  created_at: string
  updated_at: string
}

export interface PriceGroupPayload {
  name: string
  description?: string | null
  is_default: boolean
}

export interface PriceGroupFilters {
  search?: string
  page?: number
  per_page?: number
}
