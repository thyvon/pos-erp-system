import { defineStore } from 'pinia'
import * as adminBusinessesApi from '@api/adminBusinesses'

const defaultFilters = () => ({
  search: '',
  page: 1,
  per_page: 15,
})

export const useAdminBusinessesStore = defineStore('adminBusinesses', {
  state: () => ({
    items: [],
    loading: false,
    saving: false,
    filters: defaultFilters(),
    pagination: {
      total: 0,
      current_page: 1,
      last_page: 1,
      per_page: 15,
    },
  }),
  actions: {
    async fetchBusinesses(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await adminBusinessesApi.getBusinesses({
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
    async createBusiness(payload) {
      this.saving = true

      try {
        const response = await adminBusinessesApi.createBusiness(payload)
        await this.fetchBusinesses({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateBusiness(id, payload) {
      this.saving = true

      try {
        const response = await adminBusinessesApi.updateBusiness(id, payload)
        await this.fetchBusinesses()
        return response.data
      } finally {
        this.saving = false
      }
    },
  },
})
