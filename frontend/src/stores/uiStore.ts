import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import {
  DEFAULT_BORDER_RADIUS_LEVEL,
  isLayoutSurfaceTheme,
  normalizeBorderRadiusLevel,
  type BorderRadiusLevel,
  type FontPreset,
  type LayoutSurfaceTheme,
  type LayoutSize,
  type ThemeColorPreset,
} from '@/theme'

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
  hasHydrated: boolean
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
  setHasHydrated: (hasHydrated: boolean) => void
}

type UIStore = UIState & UIActions

const initialState: UIState = {
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
  hasHydrated: false,
}

const COLOR_SURFACE_THEMES: LayoutSurfaceTheme[] = ['default', 'cyan', 'purple', 'blue', 'orange', 'red']

function normalizeColorPreset(value: unknown): ThemeColorPreset {
  if (value === 'darkGreen') return 'default'
  if (value === 'default' || value === 'cyan' || value === 'purple' || value === 'blue' || value === 'orange' || value === 'red') {
    return value
  }

  return initialState.colorPreset
}

function normalizeSurfaceTheme(value: unknown): LayoutSurfaceTheme {
  if (!isLayoutSurfaceTheme(value)) return 'inherit'

  // Old saved settings could keep the layout shell locked to darkGreen even after
  // switching brand colors. Reset color-specific shell values to inherit so the
  // active theme color controls cards, tables, topbar and sidebar consistently.
  if (COLOR_SURFACE_THEMES.includes(value)) return 'inherit'

  return value
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,

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
      setColorPreset: (colorPreset) => set((state) => ({
        colorPreset,
        sidebarTheme: COLOR_SURFACE_THEMES.includes(state.sidebarTheme) ? 'inherit' : state.sidebarTheme,
        topbarTheme: COLOR_SURFACE_THEMES.includes(state.topbarTheme) ? 'inherit' : state.topbarTheme,
      })),
      setLayoutSize: (layoutSize) => set({ layoutSize }),
      setBorderRadiusLevel: (borderRadiusLevel) => set({ borderRadiusLevel: normalizeBorderRadiusLevel(borderRadiusLevel) }),
      setSidebarTheme: (sidebarTheme) => set({ sidebarTheme }),
      setTopbarTheme: (topbarTheme) => set({ topbarTheme }),
      setContentStretch: (contentStretch) => set({ contentStretch }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'erp-ui',
      storage: createJSONStorage(() => localStorage),
      version: 9,
      partialize: (state) => {
        const { hasHydrated: _, ...rest } = state
        return rest
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
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
          language: previousState.language ?? initialState.language,
          fontPreset: previousState.fontPreset ?? initialState.fontPreset,
          colorPreset: normalizeColorPreset(previousState.colorPreset),
          layoutSize: previousState.layoutSize ?? initialState.layoutSize,
          borderRadiusLevel: normalizeBorderRadiusLevel(
            previousState.borderRadiusLevel ?? previousState.borderRadiusPreset
          ),
          sidebarTheme: normalizeSurfaceTheme(previousState.sidebarTheme),
          topbarTheme: normalizeSurfaceTheme(previousState.topbarTheme),
        }
      },
    }
  )
)
