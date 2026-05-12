import { createTheme, Theme } from '@mui/material/styles'
import { useSettingsStore } from '@/stores/settings'

declare module '@mui/material/styles' {
  interface PaletteColor {
    lighter?: string
    darker?: string
  }

  interface SimplePaletteColorOptions {
    lighter?: string
    darker?: string
  }
}

const colorPresets = {
  default: {
    primary: {
      lighter: '#C8FACD',
      light: '#5BE584',
      main: '#00AB55',
      dark: '#007B55',
      darker: '#005249',
      contrastText: '#fff',
    },
    secondary: {
      lighter: '#D6E4FF',
      light: '#84A9FF',
      main: '#3366FF',
      dark: '#1939B7',
      darker: '#091A7A',
      contrastText: '#fff',
    },
  },
  blue: {
    primary: {
      lighter: '#D1E9FF',
      light: '#76B0FF',
      main: '#1890FF',
      dark: '#0C53B7',
      darker: '#04297A',
      contrastText: '#fff',
    },
    secondary: {
      lighter: '#E6D7FF',
      light: '#B598FF',
      main: '#722ED1',
      dark: '#531DAB',
      darker: '#391085',
      contrastText: '#fff',
    },
  },
  purple: {
    primary: {
      lighter: '#E6D7FF',
      light: '#B598FF',
      main: '#722ED1',
      dark: '#531DAB',
      darker: '#391085',
      contrastText: '#fff',
    },
    secondary: {
      lighter: '#FFE7D9',
      light: '#FFA48D',
      main: '#FF4842',
      dark: '#B72136',
      darker: '#7A0C2E',
      contrastText: '#fff',
    },
  },
  red: {
    primary: {
      lighter: '#FFE7D9',
      light: '#FFA48D',
      main: '#FF4842',
      dark: '#B72136',
      darker: '#7A0C2E',
      contrastText: '#fff',
    },
    secondary: {
      lighter: '#FFF7CD',
      light: '#FFD666',
      main: '#FFC107',
      dark: '#B78103',
      darker: '#7A4F01',
      contrastText: '#000',
    },
  },
  green: {
    primary: {
      lighter: '#E9FCD4',
      light: '#AAF27F',
      main: '#54D62C',
      dark: '#229A16',
      darker: '#08660D',
      contrastText: '#fff',
    },
    secondary: {
      lighter: '#C8FACD',
      light: '#5BE584',
      main: '#00AB55',
      dark: '#007B55',
      darker: '#005249',
      contrastText: '#fff',
    },
  },
}

export function createDynamicTheme(settings: {
  themeMode: string
  colorPreset: string
  fontFamily: string
  fontSize: number
  borderRadius: number
}): Theme {
  const colors = colorPresets[settings.colorPreset as keyof typeof colorPresets] || colorPresets.default
  const isDark = settings.themeMode === 'dark' || (settings.themeMode === 'system' && false) // Simplified system detection

  return createTheme({
    palette: {
      mode: isDark ? 'dark' : 'light',
      ...colors,
      error: {
        lighter: '#FFE7D9',
        light: '#FFA48D',
        main: '#FF4842',
        dark: '#B72136',
        darker: '#7A0C2E',
        contrastText: '#fff',
      },
      warning: {
        lighter: '#FFF7CD',
        light: '#FFD666',
        main: '#FFC107',
        dark: '#B78103',
        darker: '#7A4F01',
        contrastText: '#000',
      },
      info: {
        lighter: '#D0F2FF',
        light: '#74CAFF',
        main: '#1890FF',
        dark: '#0C53B7',
        darker: '#04297A',
        contrastText: '#fff',
      },
      success: {
        lighter: '#E9FCD4',
        light: '#AAF27F',
        main: '#54D62C',
        dark: '#229A16',
        darker: '#08660D',
        contrastText: '#fff',
      },
      grey: {
        0: isDark ? '#0C0C0C' : '#FFFFFF',
        100: isDark ? '#1A1A1A' : '#F9FAFB',
        200: isDark ? '#212121' : '#F4F6F8',
        300: isDark ? '#424242' : '#DFE3E8',
        400: isDark ? '#616161' : '#C4CDD5',
        500: isDark ? '#757575' : '#919EAB',
        600: isDark ? '#9E9E9E' : '#637381',
        700: isDark ? '#BDBDBD' : '#454F5B',
        800: isDark ? '#E0E0E0' : '#212B36',
        900: isDark ? '#EEEEEE' : '#161C24',
      },
      background: {
        default: isDark ? '#121212' : '#F9FAFB',
        paper: isDark ? '#1E1E1E' : '#FFFFFF',
      },
      text: {
        primary: isDark ? '#FFFFFF' : '#212B36',
        secondary: isDark ? '#B0B0B0' : '#637381',
        disabled: isDark ? '#666666' : '#919EAB',
      },
      divider: isDark ? '#333333' : '#DFE3E8',
      action: {
        active: isDark ? '#B0B0B0' : '#637381',
        hover: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(145, 158, 171, 0.08)',
        selected: isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(145, 158, 171, 0.16)',
        disabled: isDark ? '#666666' : '#919EAB',
        disabledBackground: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(145, 158, 171, 0.24)',
      },
    },
    shape: {
      borderRadius: settings.borderRadius,
    },
    shadows: [
      'none',
      '0px 2px 4px 0px rgba(145, 158, 171, 0.2)',
      '0px 4px 8px 0px rgba(145, 158, 171, 0.2)',
      '0px 8px 16px 0px rgba(145, 158, 171, 0.2)',
      '0px 12px 24px -4px rgba(145, 158, 171, 0.2)',
      '0px 16px 32px -4px rgba(145, 158, 171, 0.2)',
      ...Array(19).fill('none'),
    ] as any,
    typography: {
      fontFamily: settings.fontFamily,
      fontSize: settings.fontSize,
      h1: { fontSize: `${settings.fontSize * 2.5 / 14}rem`, fontWeight: 800, lineHeight: 1.2 },
      h2: { fontSize: `${settings.fontSize * 2 / 14}rem`, fontWeight: 800, lineHeight: 1.3 },
      h3: { fontSize: `${settings.fontSize * 1.5 / 14}rem`, fontWeight: 700, lineHeight: 1.5 },
      h4: { fontSize: `${settings.fontSize * 1.25 / 14}rem`, fontWeight: 700, lineHeight: 1.5 },
      h5: { fontSize: `${settings.fontSize * 1.125 / 14}rem`, fontWeight: 700, lineHeight: 1.5 },
      h6: { fontSize: `${settings.fontSize / 14}rem`, fontWeight: 700, lineHeight: 1.5 },
      body1: { fontSize: `${settings.fontSize / 14}rem`, lineHeight: 1.5 },
      body2: { fontSize: `${settings.fontSize * 0.875 / 14}rem`, lineHeight: 1.5 },
      subtitle1: { fontSize: `${settings.fontSize / 14}rem`, fontWeight: 600, lineHeight: 1.5 },
      subtitle2: { fontSize: `${settings.fontSize * 0.875 / 14}rem`, fontWeight: 600, lineHeight: 1.5 },
      caption: { fontSize: `${settings.fontSize * 0.75 / 14}rem`, lineHeight: 1.5 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? '#121212' : '#F9FAFB',
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
            borderRadius: `${settings.borderRadius}px`,
            padding: '6px 16px',
          },
          containedPrimary: {
            '&:hover': {
              backgroundColor: colors.primary.dark,
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: `${settings.borderRadius * 2}px`,
            boxShadow: isDark
              ? '0 0 2px 0 rgba(255, 255, 255, 0.1), 0 12px 24px -4px rgba(0, 0, 0, 0.4)'
              : '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
            padding: '24px',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            backdropFilter: 'blur(6px)',
            backgroundColor: isDark ? 'rgba(18, 18, 18, 0.8)' : 'rgba(249, 250, 251, 0.8)',
            color: isDark ? '#FFFFFF' : '#212B36',
            borderBottom: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRight: isDark ? 'dashed 1px #333333' : 'dashed 1px #DFE3E8',
            backgroundColor: isDark ? '#1E1E1E' : '#F9FAFB',
          },
        },
      },
    },
  } as any)
}
