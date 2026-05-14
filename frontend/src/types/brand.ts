export interface Brand {
  id: string
  business_id: string
  name: string
  description: string | null
  image_url: string | null
  products_count: number
  created_at: string
  updated_at: string
}

export interface BrandPayload {
  name: string
  description?: string | null
  image_url?: string | null
  image_file?: File | null
}

export interface BrandFilters {
  search?: string
  page?: number
  per_page?: number
}
