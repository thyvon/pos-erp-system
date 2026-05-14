export interface CategorySummary {
  id: string
  name: string
}

export interface Category {
  id: string
  business_id: string
  parent_id: string | null
  name: string
  code: string | null
  short_code: string | null
  image_url: string | null
  sort_order: number
  parent?: CategorySummary | null
  children_count: number
  created_at: string
  updated_at: string
}

export interface CategoryPayload {
  parent_id?: string | null
  name: string
  code?: string | null
  short_code?: string | null
  image_url?: string | null
  sort_order?: number | null
}

export interface CategoryFilters {
  search?: string
  parent_id?: string
  page?: number
  per_page?: number
}
