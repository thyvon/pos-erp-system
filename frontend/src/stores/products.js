import { defineStore } from 'pinia'
import * as productsApi from '@api/products'

const defaultFilters = () => ({
  search: '',
  type: '',
  stock_tracking: '',
  is_active: '',
  category_id: '',
  brand_id: '',
  page: 1,
  per_page: 15,
})

const defaultFormOptions = () => ({
  categories: [],
  brands: [],
  units: [],
  tax_rates: [],
  price_groups: [],
  variation_templates: [],
  rack_locations_enabled: false,
  rack_locations: [],
  custom_fields: [],
  combo_products: [],
})

export const useProductsStore = defineStore('products', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    deleting: false,
    optionsLoading: false,
    filters: defaultFilters(),
    pagination: {
      total: 0,
      current_page: 1,
      last_page: 1,
      per_page: 15,
    },
    formOptions: defaultFormOptions(),
  }),
  actions: {
    async fetchProducts(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await productsApi.getProducts({
          search: this.filters.search || undefined,
          type: this.filters.type || undefined,
          stock_tracking: this.filters.stock_tracking || undefined,
          is_active: this.filters.is_active === '' ? undefined : this.filters.is_active,
          category_id: this.filters.category_id || undefined,
          brand_id: this.filters.brand_id || undefined,
          per_page: this.filters.per_page,
          page: this.filters.page,
        })

        this.items = response.data.data
        this.pagination = response.data.meta
        return response.data
      } finally {
        this.loading = false
      }
    },
    async fetchProduct(id) {
      const response = await productsApi.getProduct(id)
      return response.data.data
    },
    async fetchFormOptions(force = false) {
      if (!force && this.formOptions.categories.length) {
        return this.formOptions
      }

      this.optionsLoading = true

      try {
        const response = await productsApi.getProductFormOptions()
        this.formOptions = {
          ...defaultFormOptions(),
          ...response.data.data,
        }

        return this.formOptions
      } finally {
        this.optionsLoading = false
      }
    },
    async createProduct(payload) {
      this.saving = true

      try {
        const response = await productsApi.createProduct(payload)
        await Promise.all([
          this.fetchProducts({ page: 1 }),
          this.fetchFormOptions(true),
        ])
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateProduct(id, payload) {
      this.saving = true

      try {
        const response = await productsApi.updateProduct(id, payload)
        await Promise.all([
          this.fetchProducts(),
          this.fetchFormOptions(true),
        ])
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteProduct(id) {
      this.deleting = true

      try {
        const response = await productsApi.deleteProduct(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await Promise.all([
          this.fetchProducts({ page: nextPage }),
          this.fetchFormOptions(true),
        ])
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
