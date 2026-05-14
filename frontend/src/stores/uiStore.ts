import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { FontPreset, ThemeColorPreset } from '@/theme'

interface UIState {
  sidebarOpen: boolean
  mobileSidebarOpen: boolean
  settingsOpen: boolean
  themeMode: 'light' | 'dark'
  language: 'en' | 'km'
  fontPreset: FontPreset
  colorPreset: ThemeColorPreset
  contentStretch: boolean
}

interface UIActions {
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  toggleMobileSidebar: () => void
  setMobileSidebarOpen: (open: boolean) => void
  toggleSettings: () => void
  setSettingsOpen: (open: boolean) => void
  toggleTheme: () => void
  setTheme: (mode: 'light' | 'dark') => void
  setLanguage: (language: 'en' | 'km') => void
  setFontPreset: (fontPreset: FontPreset) => void
  setColorPreset: (colorPreset: ThemeColorPreset) => void
  setContentStretch: (stretch: boolean) => void
}

type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      mobileSidebarOpen: false,
      settingsOpen: false,
      themeMode: 'light',
      language: 'en',
      fontPreset: 'publicSans',
      colorPreset: 'default',
      contentStretch: true,

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleMobileSidebar: () => set((s) => ({ mobileSidebarOpen: !s.mobileSidebarOpen })),
      setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),
      toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      toggleTheme: () => set((s) => ({ themeMode: s.themeMode === 'light' ? 'dark' : 'light' })),
      setTheme: (mode) => set({ themeMode: mode }),
      setLanguage: (language) => set({ language }),
      setFontPreset: (fontPreset) => set({ fontPreset }),
      setColorPreset: (colorPreset) => set({ colorPreset }),
      setContentStretch: (contentStretch) => set({ contentStretch }),
    }),
    {
      name: 'erp-ui',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      migrate: (persistedState) => ({
        ...(persistedState as Partial<UIStore>),
        contentStretch: true,
        language: (persistedState as Partial<UIStore>)?.language ?? 'en',
        fontPreset: (persistedState as Partial<UIStore>)?.fontPreset ?? 'publicSans',
        colorPreset: (persistedState as Partial<UIStore>)?.colorPreset ?? 'default',
      }),
    }
  )
)
