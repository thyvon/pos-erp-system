import { defineStore } from 'pinia'
import * as businessApi from '@api/business'

export const useBusinessStore = defineStore('business', {
  state: () => ({
    item: null,
    loading: false,
    saving: false,
  }),
  actions: {
    async fetchBusiness() {
      this.loading = true

      try {
        const response = await businessApi.getBusiness()
        this.item = response.data.data
        return response.data
      } finally {
        this.loading = false
      }
    },
    async updateBusiness(payload) {
      this.saving = true

      try {
        const response = await businessApi.updateBusiness(payload)
        this.item = response.data.data
        return response.data
      } finally {
        this.saving = false
      }
    },
  },
})
