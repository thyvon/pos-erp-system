import { createTheme, Theme, alpha } from '@mui/material/styles'
import type { Shadows } from '@mui/material/styles'
import type {} from '@mui/x-date-pickers/themeAugmentation'
import {
  buildPalette,
  getThemeColorPreset,
  THEME_COLOR_PRESETS,
  type LayoutSurfaceTheme,
  type NavigationColorPreset,
  type ThemeColorPreset,
} from './palette'

export { THEME_COLOR_PRESETS }
export type { LayoutSurfaceTheme, ThemeColorPreset }

export const SIDEBAR_WIDTH = 264
export const SIDEBAR_COLLAPSED_WIDTH = 76
export const TOPBAR_HEIGHT = 56
export const CONTENT_MAX_WIDTH = 1360

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

const NAVIGATION_COLOR_PRESET_VALUES = ['default', 'cyan', 'purple', 'blue', 'orange', 'red'] as const satisfies readonly NavigationColorPreset[]

function isNavigationColorPreset(value: ThemeColorPreset): value is NavigationColorPreset {
  return NAVIGATION_COLOR_PRESET_VALUES.includes(value as NavigationColorPreset)
}

const NAVIGATION_COLOR_PRESETS = THEME_COLOR_PRESETS.filter((preset) =>
  isNavigationColorPreset(preset.value)
).map((preset) => ({
  value: preset.value as NavigationColorPreset,
  labelKey: preset.labelKey,
  main: preset.main,
  light: preset.light,
  dark: preset.dark,
}))

export const LAYOUT_SURFACE_THEME_OPTIONS: Array<{
  value: LayoutSurfaceTheme
  labelKey: string
  main: string
  light: string
  dark: string
}> = [
  { value: 'inherit', labelKey: 'layoutSettings.inherit', main: '#64748B', light: '#E2E8F0', dark: '#0F172A' },
  { value: 'light', labelKey: 'layoutSettings.light', main: '#F8FAFC', light: '#FFFFFF', dark: '#CBD5E1' },
  { value: 'dark', labelKey: 'layoutSettings.dark', main: '#111827', light: '#374151', dark: '#030712' },
  ...NAVIGATION_COLOR_PRESETS,
]

const LAYOUT_METRICS_PRESETS: Record<LayoutSize, LayoutMetrics> = {
  compact: {
    sidebarWidth: 236,
    sidebarCollapsedWidth: 68,
    topbarHeight: 52,
    contentMaxWidth: 1240,
  },
  small: {
    sidebarWidth: 248,
    sidebarCollapsedWidth: 72,
    topbarHeight: 54,
    contentMaxWidth: 1320,
  },
  normal: {
    sidebarWidth: SIDEBAR_WIDTH,
    sidebarCollapsedWidth: SIDEBAR_COLLAPSED_WIDTH,
    topbarHeight: TOPBAR_HEIGHT,
    contentMaxWidth: CONTENT_MAX_WIDTH,
  },
  large: {
    sidebarWidth: 284,
    sidebarCollapsedWidth: 84,
    topbarHeight: 62,
    contentMaxWidth: 1480,
  },
}

export function getLayoutMetrics(layoutSize: LayoutSize = 'normal'): LayoutMetrics {
  return LAYOUT_METRICS_PRESETS[layoutSize] ?? LAYOUT_METRICS_PRESETS.normal
}

export function isLayoutSurfaceTheme(value: unknown): value is LayoutSurfaceTheme {
  return typeof value === 'string' && LAYOUT_SURFACE_THEME_OPTIONS.some((option) => option.value === value)
}

export function buildLayoutSurfaceColors(theme: Theme, surfaceTheme: LayoutSurfaceTheme) {
  const resolvedTheme = surfaceTheme === 'inherit' ? theme.palette.mode : surfaceTheme
  const lightShellText = '#1C252E'
  const lightShellMuted = '#637381'
  const lightShellDisabled = '#919EAB'
  const lightShellPaper = '#FFFFFF'

  if (resolvedTheme === 'light') {
    return {
      isDark: false,
      bg: alpha(lightShellPaper, 0.96),
      paper: alpha(lightShellPaper, 0.96),
      border: alpha(theme.palette.primary.main, 0.18),
      text: lightShellText,
      muted: lightShellMuted,
      disabled: lightShellDisabled,
      icon: alpha(theme.palette.primary.main, 0.88),
      hover: alpha(theme.palette.primary.main, 0.08),
      buttonBg: alpha(theme.palette.primary.main, 0.08),
      buttonHover: alpha(theme.palette.primary.main, 0.14),
      floatingBg: lightShellPaper,
      floatingBorder: alpha(theme.palette.primary.main, 0.22),
      selected: theme.palette.primary.main,
      selectedHover: theme.palette.primary.dark,
      selectedText: theme.palette.primary.contrastText,
    }
  }

  if (resolvedTheme === 'dark') {
    return {
      isDark: true,
      bg: alpha('#111827', 0.94),
      paper: alpha('#111827', 0.94),
      border: alpha(theme.palette.primary.light, 0.22),
      text: '#f9fafb',
      muted: alpha('#ffffff', 0.72),
      disabled: alpha('#ffffff', 0.42),
      icon: alpha(theme.palette.primary.light, 0.84),
      hover: alpha(theme.palette.primary.light, 0.1),
      buttonBg: alpha(theme.palette.primary.light, 0.12),
      buttonHover: alpha(theme.palette.primary.light, 0.2),
      floatingBg: '#111827',
      floatingBorder: alpha(theme.palette.primary.light, 0.22),
      selected: theme.palette.primary.main,
      selectedHover: theme.palette.primary.dark,
      selectedText: theme.palette.primary.contrastText,
    }
  }

  const preset = getThemeColorPreset(resolvedTheme)

  return {
    isDark: true,
    bg: preset.dark,
    paper: preset.dark,
    border: alpha(theme.palette.primary.light, 0.28),
    text: '#ffffff',
    muted: alpha('#ffffff', 0.74),
    disabled: alpha('#ffffff', 0.46),
    icon: alpha(theme.palette.primary.light, 0.92),
    hover: alpha(theme.palette.primary.light, 0.12),
    buttonBg: alpha(theme.palette.primary.light, 0.16),
    buttonHover: alpha(theme.palette.primary.light, 0.26),
    floatingBg: preset.dark,
    floatingBorder: alpha(theme.palette.primary.light, 0.32),
    selected: theme.palette.primary.main,
    selectedHover: theme.palette.primary.dark,
    selectedText: theme.palette.primary.contrastText,
  }
}

export function buildAppBackground(theme: Theme) {
  return theme.palette.background.default
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
    controlHeight: 36,
    smallControlHeight: 30,
    largeControlHeight: 42,
    typography: {
      h1: '1.75rem',
      h2: '1.5rem',
      h3: '1.1875rem',
      h4: '1rem',
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
    controlHeight: 40,
    smallControlHeight: 32,
    largeControlHeight: 46,
    typography: {
      h1: '2rem',
      h2: '1.625rem',
      h3: '1.25rem',
      h4: '1.0625rem',
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
    controlHeight: 44,
    smallControlHeight: 34,
    largeControlHeight: 50,
    typography: {
      h1: '2.25rem',
      h2: '1.875rem',
      h3: '1.375rem',
      h4: '1.1875rem',
      h5: '1.0625rem',
      h6: '1rem',
      subtitle1: '0.9375rem',
      subtitle2: '0.875rem',
      body1: '0.9375rem',
      body2: '0.875rem',
      caption: '0.75rem',
      overline: '0.75rem',
    },
  },
  large: {
    spacing: 9,
    controlHeight: 50,
    smallControlHeight: 38,
    largeControlHeight: 56,
    typography: {
      h1: '2.5rem',
      h2: '2rem',
      h3: '1.5rem',
      h4: '1.25rem',
      h5: '1.125rem',
      h6: '1.0625rem',
      subtitle1: '1rem',
      subtitle2: '0.9375rem',
      body1: '1rem',
      body2: '0.9375rem',
      caption: '0.75rem',
      overline: '0.75rem',
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
  const solidInputBg = mode === 'light' ? '#F9FAFB' : alpha('#FFFFFF', 0.04)
  const inputBackground = solidInputBg

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
        styleOverrides: (theme) => ({
          '*': {
            boxSizing: 'border-box',
          },
          html: {
            width: '100%',
            height: '100%',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: `${alpha(theme.palette.grey[500], 0.32)} transparent`,
          },
          '*::-webkit-scrollbar': {
            width: 6,
            height: 6,
          },
          '*::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '*::-webkit-scrollbar-thumb': {
            background: alpha(theme.palette.grey[500], 0.32),
            borderRadius: 3,
          },
          '*::-webkit-scrollbar-thumb:hover': {
            background: alpha(theme.palette.grey[500], 0.5),
          },
          body: {
            width: '100%',
            height: '100%',
            backgroundColor: palette.background?.default,
            color: palette.text?.primary,
            fontFamily,
            '--app-control-height': `${sizePreset.controlHeight}px`,
            '--app-small-control-height': `${sizePreset.smallControlHeight}px`,
            '--app-large-control-height': `${sizePreset.largeControlHeight}px`,
          },
          'button, input, textarea, select': {
            fontFamily: 'inherit',
          },
          '#root, #__next': {
            width: '100%',
            height: '100%',
          },
        }),
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            fontSize: sizePreset.typography.body2,
            borderRadius: controlRadius,
            minHeight: sizePreset.controlHeight,
            padding: '5px 14px',
            lineHeight: 1.4,
          },
          sizeSmall: {
            minHeight: sizePreset.smallControlHeight,
            padding: '3px 10px',
          },
          sizeLarge: {
            minHeight: sizePreset.largeControlHeight,
            padding: '6px 16px',
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiFormControl: {
        defaultProps: {
          variant: 'outlined',
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: controlRadius,
            backgroundColor: inputBackground,
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
            backgroundColor: inputBackground,
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
        variants: [
          {
            props: { variant: 'outlined' },
            style: {
              borderColor: 'rgba(145, 158, 171, 0.5)',
              boxShadow: 'none',
            },
          },
        ],
      },
      MuiCardContent: {
        styleOverrides: {
          root: {
            padding: isCompactLayout ? 16 : isDenseLayout ? 18 : 20,
            '&:last-child': {
              paddingBottom: isCompactLayout ? 16 : isDenseLayout ? 18 : 20,
            },
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
            '&:not(.MuiTableCell-alignCenter):not(.MuiTableCell-alignRight)': {
              textAlign: 'left',
            },
            ...(isDenseLayout
              ? {
                  padding: isCompactLayout ? '4px 10px' : '6px 12px',
                }
              : {}),
          },
          head: {
            '&:not(.MuiTableCell-alignCenter):not(.MuiTableCell-alignRight)': {
              textAlign: 'left',
            },
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
          root: {
            fontWeight: 600,
          },
          sizeSmall: {
            height: isCompactLayout ? 22 : 24,
            fontSize: sizePreset.typography.caption,
          },
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
            width: sizePreset.controlHeight,
            height: sizePreset.controlHeight,
            padding: 6,
          },
          sizeSmall: {
            width: sizePreset.smallControlHeight,
            height: sizePreset.smallControlHeight,
            padding: 4,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            minHeight: isDenseLayout ? 34 : 38,
            fontSize: sizePreset.typography.body2,
            gap: 8,
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            fontSize: sizePreset.typography.body2,
          },
          secondary: {
            fontSize: sizePreset.typography.caption,
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            minHeight: `${getLayoutMetrics(layoutSize).topbarHeight}px !important`,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: controlRadius,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            padding: isDenseLayout ? '16px 20px 8px' : '18px 22px 10px',
            fontSize: sizePreset.typography.h6,
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: isDenseLayout ? '10px 20px' : '12px 22px',
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: isDenseLayout ? '12px 20px 16px' : '14px 22px 18px',
          },
        },
      },
      MuiSwitch: {
        defaultProps: {
          size: isDenseLayout ? 'small' : 'medium',
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
          paper: ({ theme }) => ({
            borderRadius: controlRadius,
            border: `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
            backgroundColor: alpha(theme.palette.background.paper, 0.9),
            backgroundImage: 'none',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: `0 0 2px 0 ${alpha(theme.palette.grey[500], 0.24)}, -20px 20px 40px -4px ${alpha(theme.palette.grey[500], 0.24)}`,
          }),
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
