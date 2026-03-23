import { defineStore } from 'pinia'
import * as settingsApi from '@api/settings'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    groups: {},
    loading: false,
    saving: false,
  }),
  actions: {
    async fetchGroup(group) {
      this.loading = true

      try {
        const response = await settingsApi.getSettingsGroup(group)
        this.groups[group] = response.data.data
        return response.data
      } finally {
        this.loading = false
      }
    },
    async updateGroup(group, settings) {
      this.saving = true

      try {
        const response = await settingsApi.updateSettingsGroup(group, settings)
        this.groups[group] = response.data.data
        return response.data
      } finally {
        this.saving = false
      }
    },
  },
})
