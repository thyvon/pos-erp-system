import { PaletteOptions } from '@mui/material'

export type ThemeColorPreset =
  | 'default'
  | 'cyan'
  | 'purple'
  | 'blue'
  | 'darkBlue'
  | 'darkGreen'
  | 'orange'
  | 'red'

export const THEME_COLOR_PRESETS: Array<{
  value: ThemeColorPreset
  label: string
  main: string
  light: string
  dark: string
}> = [
  { value: 'default', label: 'Slate', main: '#475569', light: '#94A3B8', dark: '#1E293B' },
  { value: 'cyan', label: 'Teal', main: '#14B8A6', light: '#5EEAD4', dark: '#0F766E' },
  { value: 'purple', label: 'Violet', main: '#7C3AED', light: '#A78BFA', dark: '#5B21B6' },
  { value: 'blue', label: 'Azure', main: '#2563EB', light: '#93C5FD', dark: '#1E40AF' },
  { value: 'darkBlue', label: 'Dark Blue', main: '#1E3A8A', light: '#60A5FA', dark: '#172554' },
  { value: 'darkGreen', label: 'Dark Green', main: '#166534', light: '#86EFAC', dark: '#052E16' },
  { value: 'orange', label: 'Amber', main: '#F59E0B', light: '#FCD34D', dark: '#B45309' },
  { value: 'red', label: 'Rose', main: '#E11D48', light: '#FDA4AF', dark: '#9F1239' },
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
    default: '#F9FAFB',
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
    default: '#161C24',
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
  success: { main: '#22C55E', light: '#77ED8B', dark: '#118D57', contrastText: '#FFFFFF' },
}
