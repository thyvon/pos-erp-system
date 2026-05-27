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
export type LayoutSize = 'compact' | 'small' | 'normal' | 'large'
export type BorderRadiusLevel = number

export const BORDER_RADIUS_MIN = 0
export const BORDER_RADIUS_MAX = 20
export const BORDER_RADIUS_STEP = 1
export const DEFAULT_BORDER_RADIUS_LEVEL = 8

export interface LayoutMetrics {
  sidebarWidth: number
  sidebarCollapsedWidth: number
  topbarHeight: number
  contentMaxWidth: number
}

export const ENGLISH_FONT_OPTIONS: Array<{ value: FontPreset; label: string; family: string }> = [
  { value: 'publicSans', label: 'Public Sans', family: 'Public Sans' },
  { value: 'inter', label: 'Inter', family: 'Inter' },
  { value: 'dmSans', label: 'DM Sans', family: 'DM Sans' },
  { value: 'nunitoSans', label: 'Nunito Sans', family: 'Nunito Sans' },
]

export const LAYOUT_SIZE_OPTIONS: Array<{ value: LayoutSize; labelKey: string }> = [
  { value: 'compact', labelKey: 'layoutSettings.compact' },
  { value: 'small', labelKey: 'layoutSettings.small' },
  { value: 'normal', labelKey: 'layoutSettings.normal' },
  { value: 'large', labelKey: 'layoutSettings.large' },
]

const LAYOUT_METRICS_PRESETS: Record<LayoutSize, LayoutMetrics> = {
  compact: {
    sidebarWidth: 252,
    sidebarCollapsedWidth: 72,
    topbarHeight: 56,
    contentMaxWidth: 1320,
  },
  small: {
    sidebarWidth: 268,
    sidebarCollapsedWidth: 80,
    topbarHeight: 60,
    contentMaxWidth: 1380,
  },
  normal: {
    sidebarWidth: SIDEBAR_WIDTH,
    sidebarCollapsedWidth: SIDEBAR_COLLAPSED_WIDTH,
    topbarHeight: TOPBAR_HEIGHT,
    contentMaxWidth: CONTENT_MAX_WIDTH,
  },
  large: {
    sidebarWidth: 300,
    sidebarCollapsedWidth: 96,
    topbarHeight: 72,
    contentMaxWidth: 1560,
  },
}

export function getLayoutMetrics(layoutSize: LayoutSize = 'normal'): LayoutMetrics {
  return LAYOUT_METRICS_PRESETS[layoutSize] ?? LAYOUT_METRICS_PRESETS.normal
}

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
  compact: {
    spacing: 6,
    controlHeight: 42,
    smallControlHeight: 30,
    largeControlHeight: 48,
    typography: {
      h1: '2rem',
      h2: '1.625rem',
      h3: '1.25rem',
      h4: '1.0625rem',
      h5: '0.9375rem',
      h6: '0.875rem',
      subtitle1: '0.875rem',
      subtitle2: '0.75rem',
      body1: '0.875rem',
      body2: '0.75rem',
      caption: '0.6875rem',
      overline: '0.6875rem',
    },
  },
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

export function normalizeBorderRadiusLevel(level: unknown): BorderRadiusLevel {
  if (level === 'low') return 4
  if (level === 'medium') return DEFAULT_BORDER_RADIUS_LEVEL
  if (level === 'high') return 12

  const numericLevel = typeof level === 'number' ? level : DEFAULT_BORDER_RADIUS_LEVEL
  return Math.min(BORDER_RADIUS_MAX, Math.max(BORDER_RADIUS_MIN, numericLevel))
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
  layoutSize: LayoutSize = 'normal',
  borderRadiusLevel: BorderRadiusLevel = DEFAULT_BORDER_RADIUS_LEVEL
): Theme {
  const palette = buildPalette(mode, colorPreset)
  const primaryMain =
    palette.primary && 'main' in palette.primary ? palette.primary.main : '#00A76F'
  const fontFamily = resolveFontFamily(fontPreset)
  const sizePreset = LAYOUT_SIZE_PRESETS[layoutSize] ?? LAYOUT_SIZE_PRESETS.normal
  const controlRadius = normalizeBorderRadiusLevel(borderRadiusLevel)
  const iconButtonRadius = controlRadius
  const isDenseLayout = layoutSize === 'compact' || layoutSize === 'small'
  const isCompactLayout = layoutSize === 'compact'
  const inputLabelOffset = Math.max((sizePreset.controlHeight - 22) / 2, 7)
  const smallInputLabelOffset = Math.max((sizePreset.smallControlHeight - 20) / 2, 5)

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
    shape: { borderRadius: controlRadius },
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
            borderRadius: controlRadius,
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
            borderRadius: controlRadius,
            backgroundColor: mode === 'light' ? '#F9FAFB' : alpha('#FFFFFF', 0.04),
            height: sizePreset.controlHeight,
            minHeight: sizePreset.controlHeight,
            alignItems: 'center',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: primaryMain,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 1,
              borderColor: primaryMain,
            },
            '&.MuiInputBase-multiline': {
              height: 'auto',
              alignItems: 'flex-start',
              paddingTop: 12,
              paddingBottom: 12,
            },
          },
          notchedOutline: {
            borderColor: mode === 'light' ? alpha('#919EAB', 0.24) : alpha('#919EAB', 0.32),
          },
          input: {
            boxSizing: 'border-box',
            height: sizePreset.controlHeight,
            lineHeight: `${sizePreset.controlHeight}px`,
            paddingTop: 0,
            paddingBottom: 0,
            '&::placeholder': {
              lineHeight: `${sizePreset.controlHeight}px`,
            },
            '&.MuiInputBase-inputMultiline': {
              height: 'auto',
              lineHeight: 1.5,
              paddingTop: 0,
              paddingBottom: 0,
              '&::placeholder': {
                lineHeight: 1.5,
              },
            },
          },
          sizeSmall: {
            height: sizePreset.smallControlHeight,
            minHeight: sizePreset.smallControlHeight,
            '& .MuiOutlinedInput-input': {
              height: sizePreset.smallControlHeight,
              lineHeight: `${sizePreset.smallControlHeight}px`,
              paddingTop: 0,
              paddingBottom: 0,
              '&::placeholder': {
                lineHeight: `${sizePreset.smallControlHeight}px`,
              },
            },
            '&.MuiInputBase-multiline': {
              height: 'auto',
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          outlined: {
            transform: `translate(14px, ${inputLabelOffset}px) scale(1)`,
            '&.MuiInputLabel-sizeSmall': {
              transform: `translate(14px, ${smallInputLabelOffset}px) scale(1)`,
            },
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)',
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            boxSizing: 'border-box',
            height: sizePreset.controlHeight,
            minHeight: 'auto',
            display: 'flex',
            alignItems: 'center',
            paddingTop: 0,
            paddingBottom: 0,
            lineHeight: 1.5,
            '&.MuiInputBase-inputSizeSmall': {
              height: sizePreset.smallControlHeight,
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
              boxSizing: 'border-box',
              height: sizePreset.controlHeight,
              lineHeight: `${sizePreset.controlHeight}px`,
              paddingTop: '0 !important',
              paddingBottom: '0 !important',
              '&::placeholder': {
                lineHeight: `${sizePreset.controlHeight}px`,
              },
            },
            '&.MuiInputBase-sizeSmall .MuiAutocomplete-input': {
              height: sizePreset.smallControlHeight,
              lineHeight: `${sizePreset.smallControlHeight}px`,
              '&::placeholder': {
                lineHeight: `${sizePreset.smallControlHeight}px`,
              },
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
            borderRadius: controlRadius,
            backgroundColor: mode === 'light' ? '#F9FAFB' : alpha('#FFFFFF', 0.04),
            alignItems: 'center',
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
            height: sizePreset.controlHeight,
            lineHeight: `${sizePreset.controlHeight}px`,
            paddingTop: '0 !important',
            paddingBottom: '0 !important',
          },
          sectionsContainer: {
            alignItems: 'center',
            height: sizePreset.controlHeight,
            minHeight: sizePreset.controlHeight,
            paddingTop: '0 !important',
            paddingBottom: '0 !important',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            position: 'relative',
            boxShadow: `0 0 2px 0 ${alpha('#919EAB', 0.2)}, 0 12px 24px -4px ${alpha('#919EAB', 0.12)}`,
            borderRadius: controlRadius,
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
          size: isDenseLayout ? 'small' : 'medium',
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '.MuiTableBody-root &:nth-of-type(odd)': {
              backgroundColor:
                palette.mode === 'light'
                  ? alpha(primaryMain, 0.03)
                  : alpha('#ffffff', 0.03),
            },
            '.MuiTableBody-root &:nth-of-type(odd):hover': {
              backgroundColor:
                palette.mode === 'light'
                  ? alpha(primaryMain, 0.06)
                  : alpha('#ffffff', 0.06),
            },
            ...(isDenseLayout
              ? {
                  '& .MuiTableCell-root': {
                    paddingTop: isCompactLayout ? 4 : 6,
                    paddingBottom: isCompactLayout ? 4 : 6,
                  },
                }
              : {}),
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            ...(isDenseLayout
              ? {
                  padding: isCompactLayout ? '4px 10px' : '6px 12px',
                }
              : {}),
          },
          head: {
            ...(isDenseLayout
              ? {
                  paddingTop: isCompactLayout ? 6 : 8,
                  paddingBottom: isCompactLayout ? 6 : 8,
                  fontSize: sizePreset.typography.caption,
                }
              : {}),
          },
          body: {
            ...(isDenseLayout
              ? {
                  fontSize: sizePreset.typography.body2,
                }
              : {}),
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          outlined: ({ ownerState, theme }) => {
            const color = ownerState.color ?? 'default'

            if (color === 'default') {
              return {
                borderColor: 'transparent',
                backgroundColor: theme.palette.mode === 'light'
                  ? alpha(theme.palette.grey[500], 0.16)
                  : alpha(theme.palette.grey[500], 0.28),
                color: theme.palette.text.primary,
              }
            }

            const paletteColor = theme.palette[color]

            return {
              borderColor: 'transparent',
              backgroundColor: alpha(paletteColor.main, theme.palette.mode === 'light' ? 0.18 : 0.28),
              color: theme.palette.mode === 'light' ? paletteColor.dark : paletteColor.light,
            }
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: iconButtonRadius,
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderRadius: controlRadius,
            minHeight: sizePreset.smallControlHeight,
            textTransform: 'none',
            fontWeight: 700,
          },
        },
      },
      MuiToggleButtonGroup: {
        styleOverrides: {
          grouped: {
            borderRadius: controlRadius,
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            borderRadius: controlRadius,
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
            borderRadius: controlRadius,
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
