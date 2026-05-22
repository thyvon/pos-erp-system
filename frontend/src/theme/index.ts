import { createTheme, Theme, alpha } from '@mui/material/styles'
import type { Shadows } from '@mui/material/styles'
import type {} from '@mui/x-date-pickers/themeAugmentation'
import { buildPalette, THEME_COLOR_PRESETS, type ThemeColorPreset } from './palette'

export { THEME_COLOR_PRESETS }
export type { ThemeColorPreset }

export const SIDEBAR_WIDTH = 280
export const SIDEBAR_COLLAPSED_WIDTH = 88
export const TOPBAR_HEIGHT = 64
export const CONTENT_MAX_WIDTH = 1440

export type FontPreset = 'publicSans' | 'inter' | 'dmSans' | 'nunitoSans'
export type LayoutSize = 'small' | 'normal' | 'large'

export const ENGLISH_FONT_OPTIONS: Array<{ value: FontPreset; label: string; family: string }> = [
  { value: 'publicSans', label: 'Public Sans', family: 'Public Sans' },
  { value: 'inter', label: 'Inter', family: 'Inter' },
  { value: 'dmSans', label: 'DM Sans', family: 'DM Sans' },
  { value: 'nunitoSans', label: 'Nunito Sans', family: 'Nunito Sans' },
]

export const LAYOUT_SIZE_OPTIONS: Array<{ value: LayoutSize; labelKey: string }> = [
  { value: 'small', labelKey: 'layoutSettings.small' },
  { value: 'normal', labelKey: 'layoutSettings.normal' },
  { value: 'large', labelKey: 'layoutSettings.large' },
]

const LAYOUT_SIZE_PRESETS: Record<LayoutSize, {
  spacing: number
  controlHeight: number
  smallControlHeight: number
  largeControlHeight: number
  typography: {
    h1: string
    h2: string
    h3: string
    h4: string
    h5: string
    h6: string
    subtitle1: string
    subtitle2: string
    body1: string
    body2: string
    caption: string
    overline: string
  }
}> = {
  small: {
    spacing: 7,
    controlHeight: 48,
    smallControlHeight: 34,
    largeControlHeight: 52,
    typography: {
      h1: '2.25rem',
      h2: '1.875rem',
      h3: '1.375rem',
      h4: '1.125rem',
      h5: '1rem',
      h6: '0.9375rem',
      subtitle1: '0.9375rem',
      subtitle2: '0.8125rem',
      body1: '0.9375rem',
      body2: '0.8125rem',
      caption: '0.6875rem',
      overline: '0.6875rem',
    },
  },
  normal: {
    spacing: 8,
    controlHeight: 54,
    smallControlHeight: 36,
    largeControlHeight: 56,
    typography: {
      h1: '2.5rem',
      h2: '2rem',
      h3: '1.5rem',
      h4: '1.25rem',
      h5: '1.125rem',
      h6: '1rem',
      subtitle1: '1rem',
      subtitle2: '0.875rem',
      body1: '1rem',
      body2: '0.875rem',
      caption: '0.75rem',
      overline: '0.75rem',
    },
  },
  large: {
    spacing: 9,
    controlHeight: 60,
    smallControlHeight: 40,
    largeControlHeight: 64,
    typography: {
      h1: '2.75rem',
      h2: '2.25rem',
      h3: '1.625rem',
      h4: '1.375rem',
      h5: '1.25rem',
      h6: '1.125rem',
      subtitle1: '1.0625rem',
      subtitle2: '0.9375rem',
      body1: '1.0625rem',
      body2: '0.9375rem',
      caption: '0.8125rem',
      overline: '0.8125rem',
    },
  },
}

const SYSTEM_FONT_STACK = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

function resolveFontFamily(fontPreset: FontPreset) {
  const fontOption = ENGLISH_FONT_OPTIONS.find((option) => option.value === fontPreset)
  return `"${fontOption?.family ?? 'Public Sans'}", "Kantumruy Pro", ${SYSTEM_FONT_STACK}`
}

export function createAppTheme(
  mode: 'light' | 'dark',
  fontPreset: FontPreset = 'publicSans',
  colorPreset: ThemeColorPreset = 'default',
  layoutSize: LayoutSize = 'normal'
): Theme {
  const palette = buildPalette(mode, colorPreset)
  const primaryMain =
    palette.primary && 'main' in palette.primary ? palette.primary.main : '#00A76F'
  const fontFamily = resolveFontFamily(fontPreset)
  const sizePreset = LAYOUT_SIZE_PRESETS[layoutSize]
  const isSmallLayout = layoutSize === 'small'

  return createTheme({
    palette,
    spacing: sizePreset.spacing,
    typography: {
      fontFamily,
      h1: { fontWeight: 800, fontSize: sizePreset.typography.h1, lineHeight: 1.2 },
      h2: { fontWeight: 800, fontSize: sizePreset.typography.h2, lineHeight: 1.3 },
      h3: { fontWeight: 700, fontSize: sizePreset.typography.h3, lineHeight: 1.5 },
      h4: { fontWeight: 700, fontSize: sizePreset.typography.h4, lineHeight: 1.5 },
      h5: { fontWeight: 700, fontSize: sizePreset.typography.h5, lineHeight: 1.5 },
      h6: { fontWeight: 700, fontSize: sizePreset.typography.h6, lineHeight: 1.5 },
      subtitle1: { fontWeight: 600, fontSize: sizePreset.typography.subtitle1, lineHeight: 1.5 },
      subtitle2: { fontWeight: 600, fontSize: sizePreset.typography.subtitle2, lineHeight: 1.5 },
      body1: { fontSize: sizePreset.typography.body1, lineHeight: 1.5 },
      body2: { fontSize: sizePreset.typography.body2, lineHeight: 1.5 },
      caption: { fontSize: sizePreset.typography.caption, lineHeight: 1.5 },
      overline: { fontSize: sizePreset.typography.overline, fontWeight: 700, letterSpacing: '1.1px', lineHeight: 1.5, textTransform: 'uppercase' },
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
            minHeight: sizePreset.controlHeight,
            padding: '6px 16px',
          },
          sizeSmall: {
            minHeight: sizePreset.smallControlHeight,
            padding: '4px 10px',
          },
          sizeLarge: {
            minHeight: sizePreset.largeControlHeight,
            padding: '8px 18px',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: mode === 'light' ? '#F9FAFB' : alpha('#FFFFFF', 0.04),
            minHeight: sizePreset.controlHeight,
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
            paddingTop: (sizePreset.controlHeight - 24) / 2,
            paddingBottom: (sizePreset.controlHeight - 24) / 2,
          },
          sizeSmall: {
            minHeight: sizePreset.smallControlHeight,
            '& .MuiOutlinedInput-input': {
              paddingTop: Math.max((sizePreset.smallControlHeight - 23) / 2, 5),
              paddingBottom: Math.max((sizePreset.smallControlHeight - 23) / 2, 5),
            },
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          inputRoot: {
            minHeight: sizePreset.controlHeight,
            alignItems: 'center',
            paddingTop: '0 !important',
            paddingBottom: '0 !important',
            '&.MuiInputBase-sizeSmall': {
              minHeight: sizePreset.smallControlHeight,
            },
            '& .MuiAutocomplete-input': {
              paddingTop: '0 !important',
              paddingBottom: '0 !important',
            },
          },
          endAdornment: {
            top: '50%',
            transform: 'translateY(-50%)',
          },
        },
      },
      MuiPickersOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: mode === 'light' ? '#F9FAFB' : alpha('#FFFFFF', 0.04),
            height: sizePreset.controlHeight,
            minHeight: sizePreset.controlHeight,
            paddingTop: 0,
            paddingBottom: 0,
            '&:hover .MuiPickersOutlinedInput-notchedOutline': {
              borderColor: primaryMain,
            },
            '&.Mui-focused .MuiPickersOutlinedInput-notchedOutline': {
              borderWidth: 1,
              borderColor: primaryMain,
            },
          },
          notchedOutline: {
            borderColor: mode === 'light' ? alpha('#919EAB', 0.24) : alpha('#919EAB', 0.32),
          },
          input: {
            paddingTop: `${(sizePreset.controlHeight - 24) / 2}px !important`,
            paddingBottom: `${(sizePreset.controlHeight - 24) / 2}px !important`,
          },
          sectionsContainer: {
            paddingTop: `${(sizePreset.controlHeight - 24) / 2}px !important`,
            paddingBottom: `${(sizePreset.controlHeight - 24) / 2}px !important`,
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
      MuiTable: {
        defaultProps: {
          size: isSmallLayout ? 'small' : 'medium',
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            ...(isSmallLayout
              ? {
                  '& .MuiTableCell-root': {
                    paddingTop: 6,
                    paddingBottom: 6,
                  },
                }
              : {}),
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            ...(isSmallLayout
              ? {
                  padding: '6px 12px',
                }
              : {}),
          },
          head: {
            ...(isSmallLayout
              ? {
                  paddingTop: 8,
                  paddingBottom: 8,
                  fontSize: sizePreset.typography.caption,
                }
              : {}),
          },
          body: {
            ...(isSmallLayout
              ? {
                  fontSize: sizePreset.typography.body2,
                }
              : {}),
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
