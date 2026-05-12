import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LayoutType = 'vertical' | 'mini'
export type ThemeMode = 'light' | 'dark' | 'system'
export type ColorPreset = 'default' | 'blue' | 'purple' | 'red' | 'green'
export type NavWidth = 'normal' | 'compact'

interface SettingsState {
  // Layout settings
  layoutType: LayoutType
  navWidth: NavWidth
  themeMode: ThemeMode
  colorPreset: ColorPreset

  // Font settings
  fontFamily: string
  fontSize: number

  // UI settings
  borderRadius: number
  showCustomizer: boolean

  // Actions
  setLayoutType: (type: LayoutType) => void
  setNavWidth: (width: NavWidth) => void
  setThemeMode: (mode: ThemeMode) => void
  setColorPreset: (preset: ColorPreset) => void
  setFontFamily: (family: string) => void
  setFontSize: (size: number) => void
  setBorderRadius: (radius: number) => void
  toggleCustomizer: () => void
  resetSettings: () => void
}

const defaultSettings = {
  layoutType: 'vertical' as LayoutType,
  navWidth: 'normal' as NavWidth,
  themeMode: 'light' as ThemeMode,
  colorPreset: 'default' as ColorPreset,
  fontFamily: '"Inter", "Kantumruy Pro", "Helvetica", "Arial", sans-serif',
  fontSize: 14,
  borderRadius: 8,
  showCustomizer: false,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...defaultSettings,

      setLayoutType: (type) => set({ layoutType: type }),

      setNavWidth: (width) => set({ navWidth: width }),

      setThemeMode: (mode) => set({ themeMode: mode }),

      setColorPreset: (preset) => set({ colorPreset: preset }),

      setFontFamily: (family) => set({ fontFamily: family }),

      setFontSize: (size) => set({ fontSize: size }),

      setBorderRadius: (radius) => set({ borderRadius: radius }),

      toggleCustomizer: () => set((state) => ({ showCustomizer: !state.showCustomizer })),

      resetSettings: () => set({ ...defaultSettings }),
    }),
    {
      name: 'settings-storage',
    }
  )
)
