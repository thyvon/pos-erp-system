// Common types for the ERP system

export interface Product {
  id: number
  name: string
  sku: string
  price: number
  category_id: number
  brand_id?: number
  description?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: number
  name: string
  description?: string
}

export interface Sale {
  id: number
  customer_id?: number
  total_amount: number
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  items: SaleItem[]
}

export interface SaleItem {
  id: number
  product_id: number
  quantity: number
  unit_price: number
  total: number
  product: Product
}

export interface Customer {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
}

// API Response types
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}