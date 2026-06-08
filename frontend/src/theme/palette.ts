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
    lightDefault: '#F8FAFC',
    lightPaper: '#FFFFFF',
    darkDefault: '#0F172A',
    darkPaper: '#111827',
    success: '#22C55E',
    successLight: '#86EFAC',
    successDark: '#15803D',
  },
  blue: {
    lightDefault: '#F6F9FF',
    lightPaper: '#FFFFFF',
    darkDefault: '#0B1220',
    darkPaper: '#111C31',
    success: '#16A34A',
    successLight: '#86EFAC',
    successDark: '#166534',
  },
  darkGreen: {
    lightDefault: '#F6FDF4',
    lightPaper: '#FFFFFF',
    darkDefault: '#0B1410',
    darkPaper: '#102A12',
    success: '#1FC600',
    successLight: '#B8FF9F',
    successDark: '#18A000',
  },
  orange: {
    lightDefault: '#FFFBF3',
    lightPaper: '#FFFFFF',
    darkDefault: '#1C1207',
    darkPaper: '#2A1A0B',
    success: '#16A34A',
    successLight: '#86EFAC',
    successDark: '#166534',
  },
  red: {
    lightDefault: '#FFF7F8',
    lightPaper: '#FFFFFF',
    darkDefault: '#1A0710',
    darkPaper: '#260B16',
    success: '#16A34A',
    successLight: '#86EFAC',
    successDark: '#166534',
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
    main: '#334155',
    light: '#94A3B8',
    dark: '#0F172A',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#8E33FF',
    light: '#C684FF',
    dark: '#5119B7',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F8FAFC',
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
    main: '#94A3B8',
    light: '#CBD5E1',
    dark: '#334155',
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
  success: { main: '#22C55E', light: '#86EFAC', dark: '#15803D', contrastText: '#FFFFFF' },
}
