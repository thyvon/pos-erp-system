import { defineStore } from 'pinia'
import * as unitsApi from '@api/units'

const defaultFilters = () => ({
  search: '',
  page: 1,
  per_page: 15,
})

export const useUnitsStore = defineStore('units', {
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
    async fetchUnits(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await unitsApi.getUnits({
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
        const response = await unitsApi.getUnitOptions()
        this.options = response.data.data || []
        return this.options
      } finally {
        this.optionsLoading = false
      }
    },
    async createUnit(payload) {
      this.saving = true

      try {
        const response = await unitsApi.createUnit(payload)
        await this.fetchUnits({ page: 1 })
        await this.fetchOptions()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateUnit(id, payload) {
      this.saving = true

      try {
        const response = await unitsApi.updateUnit(id, payload)
        await this.fetchUnits()
        await this.fetchOptions()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteUnit(id) {
      this.deleting = true

      try {
        const response = await unitsApi.deleteUnit(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchUnits({ page: nextPage })
        await this.fetchOptions()
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
