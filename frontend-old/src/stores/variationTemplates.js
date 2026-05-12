import { defineStore } from 'pinia'
import * as variationTemplatesApi from '@api/variationTemplates'

const defaultFilters = () => ({
  search: '',
  page: 1,
  per_page: 15,
})

export const useVariationTemplatesStore = defineStore('variationTemplates', {
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
    async fetchVariationTemplates(overrides = {}) {
      this.loading = true
      this.filters = { ...this.filters, ...overrides }

      try {
        const response = await variationTemplatesApi.getVariationTemplates({
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
        const response = await variationTemplatesApi.getVariationTemplateOptions()
        this.options = response.data.data || []
        return this.options
      } finally {
        this.optionsLoading = false
      }
    },
    async createVariationTemplate(payload) {
      this.saving = true

      try {
        const response = await variationTemplatesApi.createVariationTemplate(payload)
        await this.fetchVariationTemplates({ page: 1 })
        await this.fetchOptions()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async updateVariationTemplate(id, payload) {
      this.saving = true

      try {
        const response = await variationTemplatesApi.updateVariationTemplate(id, payload)
        await this.fetchVariationTemplates()
        await this.fetchOptions()
        return response.data
      } finally {
        this.saving = false
      }
    },
    async deleteVariationTemplate(id) {
      this.deleting = true

      try {
        const response = await variationTemplatesApi.deleteVariationTemplate(id)
        const nextPage =
          this.items.length === 1 && this.pagination.current_page > 1
            ? this.pagination.current_page - 1
            : this.pagination.current_page

        await this.fetchVariationTemplates({ page: nextPage })
        await this.fetchOptions()
        return response.data
      } finally {
        this.deleting = false
      }
    },
  },
})
