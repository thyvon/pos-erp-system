import { PaletteOptions } from '@mui/material'

export type ThemeColorPreset =
  | 'default'
  | 'cyan'
  | 'purple'
  | 'blue'
  | 'orange'
  | 'red'

export type NavigationColorPreset = ThemeColorPreset

export type LayoutSurfaceTheme = 'inherit' | 'light' | 'dark' | NavigationColorPreset

export const THEME_COLOR_PRESETS: Array<{
  value: ThemeColorPreset
  label: string
  labelKey: string
  main: string
  light: string
  dark: string
}> = [
  { value: 'default', label: 'Green', labelKey: 'layoutSettings.colorGreen', main: '#00A76F', light: '#5BE49B', dark: '#007867' },
  { value: 'cyan', label: 'Cyan', labelKey: 'layoutSettings.colorCyan', main: '#078DEE', light: '#68CDF9', dark: '#0351AB' },
  { value: 'purple', label: 'Purple', labelKey: 'layoutSettings.colorPurple', main: '#7635DC', light: '#B985F4', dark: '#431A9E' },
  { value: 'blue', label: 'Blue', labelKey: 'layoutSettings.colorBlue', main: '#0C68E9', light: '#6BB1F8', dark: '#063BA7' },
  { value: 'orange', label: 'Orange', labelKey: 'layoutSettings.colorOrange', main: '#FDA92D', light: '#FED680', dark: '#B66816' },
  { value: 'red', label: 'Red', labelKey: 'layoutSettings.colorRed', main: '#FF3030', light: '#FFC1AC', dark: '#B71833' },
]

const SURFACE_PRESETS: Record<ThemeColorPreset, {
  lightDefault: string
  lightPaper: string
  darkDefault: string
  darkPaper: string
  success: string
  successLight: string
  successDark: string
}> = {
  default: {
    lightDefault: '#F4F6F8',
    lightPaper: '#FFFFFF',
    darkDefault: '#141A21',
    darkPaper: '#1C252E',
    success: '#22C55E',
    successLight: '#77ED8B',
    successDark: '#118D57',
  },
  cyan: {
    lightDefault: '#F4F6F8',
    lightPaper: '#FFFFFF',
    darkDefault: '#141A21',
    darkPaper: '#1C252E',
    success: '#22C55E',
    successLight: '#77ED8B',
    successDark: '#118D57',
  },
  purple: {
    lightDefault: '#F4F6F8',
    lightPaper: '#FFFFFF',
    darkDefault: '#141A21',
    darkPaper: '#1C252E',
    success: '#22C55E',
    successLight: '#77ED8B',
    successDark: '#118D57',
  },
  blue: {
    lightDefault: '#F4F6F8',
    lightPaper: '#FFFFFF',
    darkDefault: '#141A21',
    darkPaper: '#1C252E',
    success: '#22C55E',
    successLight: '#77ED8B',
    successDark: '#118D57',
  },
  orange: {
    lightDefault: '#F4F6F8',
    lightPaper: '#FFFFFF',
    darkDefault: '#141A21',
    darkPaper: '#1C252E',
    success: '#22C55E',
    successLight: '#77ED8B',
    successDark: '#118D57',
  },
  red: {
    lightDefault: '#F4F6F8',
    lightPaper: '#FFFFFF',
    darkDefault: '#141A21',
    darkPaper: '#1C252E',
    success: '#22C55E',
    successLight: '#77ED8B',
    successDark: '#118D57',
  },
}

export function getThemeColorPreset(preset: ThemeColorPreset) {
  return THEME_COLOR_PRESETS.find((item) => item.value === preset) ?? THEME_COLOR_PRESETS[0]
}

export function buildPalette(mode: 'light' | 'dark', preset: ThemeColorPreset): PaletteOptions {
  const base = mode === 'light' ? lightPalette : darkPalette
  const primary = getThemeColorPreset(preset)
  const surface = SURFACE_PRESETS[preset] ?? SURFACE_PRESETS.default

  return {
    ...base,
    primary: {
      main: primary.main,
      light: primary.light,
      dark: primary.dark,
      contrastText: '#FFFFFF',
    },
    background: {
      default: mode === 'light' ? surface.lightDefault : surface.darkDefault,
      paper: mode === 'light' ? surface.lightPaper : surface.darkPaper,
    },
    success: {
      main: surface.success,
      light: surface.successLight,
      dark: surface.successDark,
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
    default: '#F4F6F8',
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
  success: { main: '#22C55E', light: '#86EFAC', dark: '#15803D', contrastText: '#FFFFFF' },
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
    default: '#141A21',
    paper: '#1C252E',
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
  success: { main: '#22C55E', light: '#86EFAC', dark: '#15803D', contrastText: '#FFFFFF' },
}
