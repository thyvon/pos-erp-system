import { PaletteOptions } from '@mui/material'

export type ThemeColorPreset =
  | 'default'
  | 'blue'
  | 'darkGreen'
  | 'orange'
  | 'red'

export type NavigationColorPreset = Extract<ThemeColorPreset, 'default' | 'blue' | 'darkGreen'>

export type LayoutSurfaceTheme = 'inherit' | 'light' | 'dark' | NavigationColorPreset

export const THEME_COLOR_PRESETS: Array<{
  value: ThemeColorPreset
  label: string
  labelKey: string
  main: string
  light: string
  dark: string
}> = [
  { value: 'default', label: 'Graphite', labelKey: 'layoutSettings.colorGraphite', main: '#334155', light: '#94A3B8', dark: '#0F172A' },
  { value: 'blue', label: 'Sapphire', labelKey: 'layoutSettings.colorSapphire', main: '#1D4ED8', light: '#93C5FD', dark: '#1E3A8A' },
  { value: 'darkGreen', label: 'System Solution Green', labelKey: 'layoutSettings.colorEmerald', main: '#1FC600', light: '#B8FF9F', dark: '#102A12' },
  { value: 'orange', label: 'Bronze', labelKey: 'layoutSettings.colorBronze', main: '#B45309', light: '#FCD34D', dark: '#78350F' },
  { value: 'red', label: 'Garnet', labelKey: 'layoutSettings.colorGarnet', main: '#9F1239', light: '#FDA4AF', dark: '#4C0519' },
]

export function getThemeColorPreset(preset: ThemeColorPreset) {
  return THEME_COLOR_PRESETS.find((item) => item.value === preset) ?? THEME_COLOR_PRESETS[0]
}

export function buildPalette(mode: 'light' | 'dark', preset: ThemeColorPreset): PaletteOptions {
  const base = mode === 'light' ? lightPalette : darkPalette
  const primary = getThemeColorPreset(preset)

  return {
    ...base,
    primary: {
      main: primary.main,
      light: primary.light,
      dark: primary.dark,
      contrastText: '#FFFFFF',
    },
  }
}

export const lightPalette: PaletteOptions = {
  mode: 'light',
  primary: {
    main: '#00A76F',
    light: '#5BE49B',
    dark: '#007867',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#8E33FF',
    light: '#C684FF',
    dark: '#5119B7',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F7F8FA',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1C252E',
    secondary: '#637381',
    disabled: '#919EAB',
  },
  divider: 'rgba(145, 158, 171, 0.24)',
  action: {
    hover: 'rgba(145, 158, 171, 0.08)',
    selected: 'rgba(145, 158, 171, 0.16)',
    focus: 'rgba(145, 158, 171, 0.24)',
  },
  error: { main: '#FF5630', light: '#FFAC82', dark: '#B71D18', contrastText: '#FFFFFF' },
  warning: { main: '#FFAB00', light: '#FFD666', dark: '#B76E00', contrastText: '#1C252E' },
  info: { main: '#00B8D9', light: '#61F3F3', dark: '#006C9C', contrastText: '#FFFFFF' },
  success: { main: '#22C55E', light: '#77ED8B', dark: '#118D57', contrastText: '#FFFFFF' },
}

export const darkPalette: PaletteOptions = {
  mode: 'dark',
  primary: {
    main: '#00A76F',
    light: '#5BE49B',
    dark: '#007867',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#8E33FF',
    light: '#C684FF',
    dark: '#5119B7',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#0F172A',
    paper: '#111827',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#919EAB',
    disabled: '#637381',
  },
  divider: 'rgba(145, 158, 171, 0.2)',
  action: {
    hover: 'rgba(145, 158, 171, 0.08)',
    selected: 'rgba(145, 158, 171, 0.16)',
    focus: 'rgba(145, 158, 171, 0.24)',
  },
  error: { main: '#FF5630', light: '#FFAC82', dark: '#B71D18', contrastText: '#FFFFFF' },
  warning: { main: '#FFAB00', light: '#FFD666', dark: '#B76E00', contrastText: '#1C252E' },
  info: { main: '#00B8D9', light: '#61F3F3', dark: '#006C9C', contrastText: '#FFFFFF' },
  success: { main: '#22C55E', light: '#77ED8B', dark: '#118D57', contrastText: '#FFFFFF' },
}
