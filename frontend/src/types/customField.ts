export type CustomFieldModule = 'product' | 'customer' | 'supplier'
export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'checkbox'

export interface CustomFieldDefinition {
  id: string
  business_id: string
  module: CustomFieldModule
  field_name: string
  field_label: string
  field_type: CustomFieldType
  options: string[] | null
  is_required: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface CustomFieldPayload {
  module: CustomFieldModule
  field_name: string
  field_label: string
  field_type: CustomFieldType
  options?: string[] | null
  is_required?: boolean
  sort_order?: number | null
}

export interface CustomFieldFilters {
  search?: string
  module?: CustomFieldModule | ''
  page?: number
  per_page?: number
}
