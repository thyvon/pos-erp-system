import { defineStore } from 'pinia'
import * as taxRatesApi from '@api/taxRates'

const defaultFilters = () => ({
  search: '',
  type: '',
  is_active: '',
  page: 1,
  per_page: 15,
})

export const useTaxRatesStore = defineStore('taxRates', {
  state: () => ({
    items: [],
    loading: false,
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
    async fetchTaxRates(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await taxRatesApi.getTaxRates({
          search: this.filters.search || undefined,
          type: this.filters.type || undefined,
          is_active:
            this.filters.is_active === '' || this.filters.is_active === null
              ? undefined
              : this.filters.is_active,
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
    async createTaxRate(payload) {
      this.saving = true

      try {
        const response = await taxRatesApi.createTaxRate(payload)
        await this.fetchTaxRates({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateTaxRate(id, payload) {
      this.saving = true

      try {
        const response = await taxRatesApi.updateTaxRate(id, payload)
        await this.fetchTaxRates()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteTaxRate(id) {
      this.deleting = true

      try {
        const response = await taxRatesApi.deleteTaxRate(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchTaxRates({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
