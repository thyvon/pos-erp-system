import { defineStore } from 'pinia'
import * as rackLocationsApi from '@api/rackLocations'

const defaultFilters = () => ({
  search: '',
  warehouse_id: '',
  page: 1,
  per_page: 15,
})

export const useRackLocationsStore = defineStore('rackLocations', {
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
    async fetchRackLocations(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await rackLocationsApi.getRackLocations({
          search: this.filters.search || undefined,
          warehouse_id: this.filters.warehouse_id || undefined,
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
        const response = await rackLocationsApi.getRackLocationOptions()
        this.options = response.data.data || []
        return this.options
      } finally {
        this.optionsLoading = false
      }
    },
    async createRackLocation(payload) {
      this.saving = true

      try {
        const response = await rackLocationsApi.createRackLocation(payload)
        await this.fetchRackLocations({ page: 1 })
        await this.fetchOptions()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateRackLocation(id, payload) {
      this.saving = true

      try {
        const response = await rackLocationsApi.updateRackLocation(id, payload)
        await this.fetchRackLocations()
        await this.fetchOptions()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteRackLocation(id) {
      this.deleting = true

      try {
        const response = await rackLocationsApi.deleteRackLocation(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchRackLocations({ page: nextPage })
        await this.fetchOptions()
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
