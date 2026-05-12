import { defineStore } from 'pinia'
import * as brandsApi from '@api/brands'

const defaultFilters = () => ({
  search: '',
  page: 1,
  per_page: 15,
})

export const useBrandsStore = defineStore('brands', {
  state: () => ({
    items: [],
    options: [],
    loading: false,
    optionsLoading: false,
    saving: false,
    deleting: false,
    filters: defaultFilters(),
    pagination: {
      total: 0,
      current_page: 1,
      last_page: 1,
      per_page: 15,
    },
  }),
  actions: {
    async fetchBrands(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await brandsApi.getBrands({
          search: this.filters.search || undefined,
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
    async fetchOptions() {
      this.optionsLoading = true

      try {
        const response = await brandsApi.getBrandOptions()
        this.options = response.data.data || []
        return this.options
      } finally {
        this.optionsLoading = false
      }
    },
    async createBrand(payload) {
      this.saving = true

      try {
        const response = await brandsApi.createBrand(payload)
        await this.fetchBrands({ page: 1 })
        await this.fetchOptions()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateBrand(id, payload) {
      this.saving = true

      try {
        const response = await brandsApi.updateBrand(id, payload)
        await this.fetchBrands()
        await this.fetchOptions()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteBrand(id) {
      this.deleting = true

      try {
        const response = await brandsApi.deleteBrand(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchBrands({ page: nextPage })
        await this.fetchOptions()
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
