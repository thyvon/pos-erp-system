export interface SubUnit {
  id: string
  business_id: string
  parent_unit_id: string
  name: string
  short_name: string
  conversion_factor: string
  is_used: boolean
  created_at: string
  updated_at: string
}

export interface Unit {
  id: string
  business_id: string
  name: string
  short_name: string
  allow_decimal: boolean
  sub_units_count: number
  sub_units: SubUnit[]
  created_at: string
  updated_at: string
}

export interface SubUnitPayload {
  id?: string | null
  name: string
  short_name: string
  conversion_factor: number
}

export interface UnitPayload {
  name: string
  short_name: string
  allow_decimal: boolean
  sub_units?: SubUnitPayload[]
}

export interface UnitFilters {
  search?: string
  page?: number
  per_page?: number
}
