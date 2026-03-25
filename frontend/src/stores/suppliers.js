import { defineStore } from 'pinia'
import * as suppliersApi from '@api/suppliers'

const defaultFilters = () => ({
  search: '',
  status: '',
  page: 1,
  per_page: 15,
})

export const useSuppliersStore = defineStore('suppliers', {
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
    async fetchSuppliers(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await suppliersApi.getSuppliers({
          search: this.filters.search || undefined,
          status: this.filters.status || undefined,
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
    async createSupplier(payload) {
      this.saving = true

      try {
        const response = await suppliersApi.createSupplier(payload)
        await this.fetchSuppliers({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateSupplier(id, payload) {
      this.saving = true

      try {
        const response = await suppliersApi.updateSupplier(id, payload)
        await this.fetchSuppliers()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteSupplier(id) {
      this.deleting = true

      try {
        const response = await suppliersApi.deleteSupplier(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchSuppliers({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
