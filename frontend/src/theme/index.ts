import { createTheme } from '@mui/material/styles'

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

// Minimals.cc inspired theme
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      lighter: '#C8FACD',
      light: '#5BE584',
      main: '#00AB55',
      dark: '#007B55',
      darker: '#005249',
      contrastText: '#fff',
    } as any,
    secondary: {
      lighter: '#D6E4FF',
      light: '#84A9FF',
      main: '#3366FF',
      dark: '#1939B7',
      darker: '#091A7A',
      contrastText: '#fff',
    } as any,
    error: {
      lighter: '#FFE7D9',
      light: '#FFA48D',
      main: '#FF4842',
      dark: '#B72136',
      darker: '#7A0C2E',
      contrastText: '#fff',
    } as any,
    warning: {
      lighter: '#FFF7CD',
      light: '#FFD666',
      main: '#FFC107',
      dark: '#B78103',
      darker: '#7A4F01',
      contrastText: '#000',
    } as any,
    info: {
      lighter: '#D0F2FF',
      light: '#74CAFF',
      main: '#1890FF',
      dark: '#0C53B7',
      darker: '#04297A',
      contrastText: '#fff',
    } as any,
    success: {
      lighter: '#E9FCD4',
      light: '#AAF27F',
      main: '#54D62C',
      dark: '#229A16',
      darker: '#08660D',
      contrastText: '#fff',
    } as any,
    grey: {
      0: '#FFFFFF',
      100: '#F9FAFB',
      200: '#F4F6F8',
      300: '#DFE3E8',
      400: '#C4CDD5',
      500: '#919EAB',
      600: '#637381',
      700: '#454F5B',
      800: '#212B36',
      900: '#161C24',
    },
    background: {
      default: '#F9FAFB',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212B36',
      secondary: '#637381',
      disabled: '#919EAB',
    },
    divider: '#DFE3E8',
    action: {
      active: '#637381',
      hover: 'rgba(145, 158, 171, 0.08)',
      selected: 'rgba(145, 158, 171, 0.16)',
      disabled: '#919EAB',
      disabledBackground: 'rgba(145, 158, 171, 0.24)',
    },
  },
  shape: {
    borderRadius: 8,
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
    fontFamily: '"Inter", "Kantumruy Pro", "Helvetica", "Arial", sans-serif',
    khmer: {
      fontFamily: '"Kantumruy Pro", "Inter", sans-serif',
    },
    h1: { fontSize: '2.5rem', fontWeight: 800, lineHeight: 1.2 },
    h2: { fontSize: '2rem', fontWeight: 800, lineHeight: 1.3 },
    h3: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.5 },
    h4: { fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.5 },
    h5: { fontSize: '1.125rem', fontWeight: 700, lineHeight: 1.5 },
    h6: { fontSize: '1rem', fontWeight: 700, lineHeight: 1.5 },
    body1: { fontSize: '1rem', lineHeight: 1.5 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    subtitle1: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
    subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.5 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F9FAFB',
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
          borderRadius: '8px',
          padding: '6px 16px',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: '#007B55',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          boxShadow: '0 0 2px 0 rgba(145, 158, 171, 0.2), 0 12px 24px -4px rgba(145, 158, 171, 0.12)',
          padding: '24px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          backdropFilter: 'blur(6px)',
          backgroundColor: 'rgba(249, 250, 251, 0.8)',
          color: '#212B36',
          borderBottom: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'dashed 1px #DFE3E8',
          backgroundColor: '#F9FAFB',
        },
      },
    },
  },
} as any)

export default theme
