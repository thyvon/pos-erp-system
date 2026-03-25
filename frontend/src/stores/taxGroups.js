import { defineStore } from 'pinia'
import * as taxGroupsApi from '@api/taxGroups'

const defaultFilters = () => ({
  search: '',
  is_active: '',
  page: 1,
  per_page: 15,
})

export const useTaxGroupsStore = defineStore('taxGroups', {
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
    async fetchTaxGroups(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await taxGroupsApi.getTaxGroups({
          search: this.filters.search || undefined,
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
    async createTaxGroup(payload) {
      this.saving = true

      try {
        const response = await taxGroupsApi.createTaxGroup(payload)
        await this.fetchTaxGroups({ page: 1 })
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateTaxGroup(id, payload) {
      this.saving = true

      try {
        const response = await taxGroupsApi.updateTaxGroup(id, payload)
        await this.fetchTaxGroups()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteTaxGroup(id) {
      this.deleting = true

      try {
        const response = await taxGroupsApi.deleteTaxGroup(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchTaxGroups({ page: nextPage })
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
