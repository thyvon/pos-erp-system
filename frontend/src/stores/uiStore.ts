import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  DEFAULT_BORDER_RADIUS_LEVEL,
  normalizeBorderRadiusLevel,
  type BorderRadiusLevel,
  type FontPreset,
  type LayoutSize,
  type ThemeColorPreset,
} from '@/theme'

export type LayoutSurfaceTheme = 'inherit' | 'light' | 'dark'

interface UIState {
  sidebarOpen: boolean
  mobileSidebarOpen: boolean
  settingsOpen: boolean
  themeMode: 'light' | 'dark'
  language: 'en' | 'km'
  fontPreset: FontPreset
  colorPreset: ThemeColorPreset
  layoutSize: LayoutSize
  borderRadiusLevel: BorderRadiusLevel
  sidebarTheme: LayoutSurfaceTheme
  topbarTheme: LayoutSurfaceTheme
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
  setLayoutSize: (layoutSize: LayoutSize) => void
  setBorderRadiusLevel: (borderRadiusLevel: BorderRadiusLevel) => void
  setSidebarTheme: (theme: LayoutSurfaceTheme) => void
  setTopbarTheme: (theme: LayoutSurfaceTheme) => void
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
      layoutSize: 'small',
      borderRadiusLevel: DEFAULT_BORDER_RADIUS_LEVEL,
      sidebarTheme: 'inherit',
      topbarTheme: 'inherit',
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
      setLayoutSize: (layoutSize) => set({ layoutSize }),
      setBorderRadiusLevel: (borderRadiusLevel) => set({ borderRadiusLevel: normalizeBorderRadiusLevel(borderRadiusLevel) }),
      setSidebarTheme: (sidebarTheme) => set({ sidebarTheme }),
      setTopbarTheme: (topbarTheme) => set({ topbarTheme }),
      setContentStretch: (contentStretch) => set({ contentStretch }),
    }),
    {
      name: 'erp-ui',
      storage: createJSONStorage(() => localStorage),
      version: 6,
      migrate: (persistedState) => {
        const previousState = persistedState as Partial<UIStore> & {
          borderRadiusPreset?: unknown
          surfaceStyle?: unknown
        }
        const stateWithoutSurfaceStyle = { ...previousState }
        delete stateWithoutSurfaceStyle.surfaceStyle

        return {
          ...stateWithoutSurfaceStyle,
          contentStretch: true,
          language: previousState.language ?? 'en',
          fontPreset: previousState.fontPreset ?? 'publicSans',
          colorPreset: previousState.colorPreset ?? 'default',
          layoutSize: previousState.layoutSize ?? 'small',
          borderRadiusLevel: normalizeBorderRadiusLevel(
            previousState.borderRadiusLevel ?? previousState.borderRadiusPreset
          ),
          sidebarTheme: previousState.sidebarTheme ?? 'inherit',
          topbarTheme: previousState.topbarTheme ?? 'inherit',
        }
      },
    }
  )
)
