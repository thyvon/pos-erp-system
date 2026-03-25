import { defineStore } from 'pinia'
import * as priceGroupsApi from '@api/priceGroups'

const defaultFilters = () => ({
  search: '',
  page: 1,
  per_page: 15,
})

export const usePriceGroupsStore = defineStore('priceGroups', {
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
    async fetchPriceGroups(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await priceGroupsApi.getPriceGroups({
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
    async createPriceGroup(payload) {
      this.saving = true

      try {
        const response = await priceGroupsApi.createPriceGroup(payload)
        await this.fetchPriceGroups({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updatePriceGroup(id, payload) {
      this.saving = true

      try {
        const response = await priceGroupsApi.updatePriceGroup(id, payload)
        await this.fetchPriceGroups()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deletePriceGroup(id) {
      this.deleting = true

      try {
        const response = await priceGroupsApi.deletePriceGroup(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchPriceGroups({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
