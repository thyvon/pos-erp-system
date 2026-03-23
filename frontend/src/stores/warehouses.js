import { defineStore } from 'pinia'
import * as warehousesApi from '@api/warehouses'

const defaultFilters = () => ({
  search: '',
  page: 1,
  per_page: 15,
})

export const useWarehousesStore = defineStore('warehouses', {
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
    async fetchWarehouses(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await warehousesApi.getWarehouses({
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
    async createWarehouse(payload) {
      this.saving = true

      try {
        const response = await warehousesApi.createWarehouse(payload)
        await this.fetchWarehouses({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateWarehouse(id, payload) {
      this.saving = true

      try {
        const response = await warehousesApi.updateWarehouse(id, payload)
        await this.fetchWarehouses()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteWarehouse(id) {
      this.deleting = true

      try {
        const response = await warehousesApi.deleteWarehouse(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchWarehouses({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
