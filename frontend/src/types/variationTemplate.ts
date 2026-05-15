export interface VariationValue {
  id: string
  business_id: string
  variation_template_id: string
  name: string
  sort_order: number
  created_at: string
  updated_at: string
}

export interface VariationTemplate {
  id: string
  business_id: string
  name: string
  values_count: number
  values: VariationValue[]
  created_at: string
  updated_at: string
}

export interface VariationValuePayload {
  id?: string | null
  name: string
  sort_order?: number | null
}

export interface VariationTemplatePayload {
  name: string
  values: VariationValuePayload[]
}

export interface VariationTemplateFilters {
  search?: string
  page?: number
  per_page?: number
}
