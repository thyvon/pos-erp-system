export interface CustomerGroup {
  id: string
  business_id: string
  name: string
  discount: number
  price_group_id: string | null
  price_group: {
    id: string
    name: string
  } | null
  created_at: string
  updated_at: string
}

export interface CustomerGroupPayload {
  name: string
  discount: number
  price_group_id?: string | null
}

export interface CustomerGroupFilters {
  search?: string
  page?: number
  per_page?: number
}
