import { createTheme, Theme, alpha } from '@mui/material/styles'
import type { Shadows } from '@mui/material/styles'
import { buildPalette, THEME_COLOR_PRESETS, type ThemeColorPreset } from './palette'

export { THEME_COLOR_PRESETS }
export type { ThemeColorPreset }

export const SIDEBAR_WIDTH = 280
export const SIDEBAR_COLLAPSED_WIDTH = 88
export const TOPBAR_HEIGHT = 64
export const CONTENT_MAX_WIDTH = 1440

export type FontPreset = 'publicSans' | 'inter' | 'dmSans' | 'nunitoSans'

export const ENGLISH_FONT_OPTIONS: Array<{ value: FontPreset; label: string; family: string }> = [
  { value: 'publicSans', label: 'Public Sans', family: 'Public Sans' },
  { value: 'inter', label: 'Inter', family: 'Inter' },
  { value: 'dmSans', label: 'DM Sans', family: 'DM Sans' },
  { value: 'nunitoSans', label: 'Nunito Sans', family: 'Nunito Sans' },
]

const SYSTEM_FONT_STACK = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

function resolveFontFamily(fontPreset: FontPreset) {
  const fontOption = ENGLISH_FONT_OPTIONS.find((option) => option.value === fontPreset)
  return `"${fontOption?.family ?? 'Public Sans'}", "Kantumruy Pro", ${SYSTEM_FONT_STACK}`
}

export function createAppTheme(
  mode: 'light' | 'dark',
  fontPreset: FontPreset = 'publicSans',
  colorPreset: ThemeColorPreset = 'default'
): Theme {
  const palette = buildPalette(mode, colorPreset)
  const primaryMain =
    palette.primary && 'main' in palette.primary ? palette.primary.main : '#00A76F'
  const fontFamily = resolveFontFamily(fontPreset)

  return createTheme({
    palette,
    typography: {
      fontFamily,
      h1: { fontWeight: 800, fontSize: '2.5rem', lineHeight: 1.2 },
      h2: { fontWeight: 800, fontSize: '2rem', lineHeight: 1.3 },
      h3: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.5 },
      h4: { fontWeight: 700, fontSize: '1.25rem', lineHeight: 1.5 },
      h5: { fontWeight: 700, fontSize: '1.125rem', lineHeight: 1.5 },
      h6: { fontWeight: 700, fontSize: '1rem', lineHeight: 1.5 },
      subtitle1: { fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 },
      subtitle2: { fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.5 },
      body1: { fontSize: '1rem', lineHeight: 1.5 },
      body2: { fontSize: '0.875rem', lineHeight: 1.5 },
      caption: { fontSize: '0.75rem', lineHeight: 1.5 },
      overline: { fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1.1px', lineHeight: 1.5, textTransform: 'uppercase' },
    },
    shape: { borderRadius: 8 },
    shadows: [
      'none',
      `0 1px 2px 0 ${alpha('#919EAB', 0.16)}`,
      `0 4px 8px -4px ${alpha('#919EAB', 0.2)}`,
      `0 8px 16px -4px ${alpha('#919EAB', 0.2)}`,
      `0 12px 24px -4px ${alpha('#919EAB', 0.16)}`,
      `0 16px 32px -8px ${alpha('#919EAB', 0.16)}`,
      `0 20px 40px -12px ${alpha('#919EAB', 0.12)}`,
      ...Array(18).fill('none'),
    ] as Shadows,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          '*': {
            boxSizing: 'border-box',
          },
          html: {
            width: '100%',
            height: '100%',
            WebkitOverflowScrolling: 'touch',
          },
          body: {
            width: '100%',
            height: '100%',
            backgroundColor: palette.background?.default,
            color: palette.text?.primary,
            fontFamily,
          },
          'button, input, textarea, select': {
            fontFamily: 'inherit',
          },
          '#root, #__next': {
            width: '100%',
            height: '100%',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 8,
            padding: '6px 16px',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: mode === 'light' ? '#F9FAFB' : alpha('#FFFFFF', 0.04),
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: primaryMain,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 1,
              borderColor: primaryMain,
            },
          },
          notchedOutline: {
            borderColor: mode === 'light' ? alpha('#919EAB', 0.24) : alpha('#919EAB', 0.32),
          },
          input: {
            paddingTop: 15,
            paddingBottom: 15,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            position: 'relative',
            boxShadow: `0 0 2px 0 ${alpha('#919EAB', 0.2)}, 0 12px 24px -4px ${alpha('#919EAB', 0.12)}`,
            borderRadius: 8,
            zIndex: 0,
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            border: 'none',
            backgroundImage: 'none',
          },
        },
      },
      MuiAppBar: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
            color: palette.text?.primary,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '4px 8px',
            color: palette.text?.secondary,
            '&.Mui-selected': {
              color: primaryMain,
              backgroundColor: alpha(primaryMain, 0.08),
              '&:hover': {
                backgroundColor: alpha(primaryMain, 0.16),
              },
            },

          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            color: 'inherit',
            minWidth: 40,
          },
        },
      },
    },
  })
}
