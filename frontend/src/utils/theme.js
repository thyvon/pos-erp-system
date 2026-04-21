export const themeFamilyKey = 'erp_theme_family'
export const glassModeKey = 'erp_glass_mode'
export const legacyThemeKey = 'erp_theme'

const themeFamilies = ['glass', 'light', 'dark']
const glassModes = ['light', 'dark']

const normalizeThemeFamily = (value) => (themeFamilies.includes(value) ? value : null)
const normalizeGlassMode = (value) => (glassModes.includes(value) ? value : null)

const getSystemGlassMode = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export const resolveThemePreference = () => {
  const storedThemeFamily = normalizeThemeFamily(localStorage.getItem(themeFamilyKey))
  const storedGlassMode = normalizeGlassMode(localStorage.getItem(glassModeKey))
  const legacyTheme = normalizeGlassMode(localStorage.getItem(legacyThemeKey))
  const fallbackGlassMode = storedGlassMode || legacyTheme || getSystemGlassMode()

  return {
    theme: storedThemeFamily || 'glass',
    glassMode: fallbackGlassMode,
  }
}

export const applyThemePreference = ({ theme, glassMode }) => {
  const root = document.documentElement
  const nextTheme = normalizeThemeFamily(theme) || 'glass'
  const nextGlassMode = normalizeGlassMode(glassMode) || getSystemGlassMode()
  const useDarkMode = nextTheme === 'dark' || (nextTheme === 'glass' && nextGlassMode === 'dark')

  root.classList.toggle('dark', useDarkMode)
  root.classList.toggle('theme-glass', nextTheme === 'glass')
  root.classList.toggle('theme-solid-light', nextTheme === 'light')
  root.classList.toggle('theme-solid-dark', nextTheme === 'dark')
  root.dataset.erpTheme = nextTheme
  root.dataset.erpGlassMode = nextGlassMode

  return {
    theme: nextTheme,
    glassMode: nextGlassMode,
  }
}

export const persistThemePreference = ({ theme, glassMode }) => {
  localStorage.setItem(themeFamilyKey, theme)
  localStorage.setItem(glassModeKey, glassMode)
  localStorage.removeItem(legacyThemeKey)
}

export const setThemePreference = ({ theme, glassMode }) => {
  const resolved = applyThemePreference({ theme, glassMode })

  persistThemePreference(resolved)

  return resolved
}
