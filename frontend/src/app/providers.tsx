'use client'

import { useEffect, useMemo } from 'react'
import { ThemeProvider, CssBaseline, GlobalStyles, alpha } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { SnackbarProvider } from 'notistack'
import { createAppTheme } from '@/theme'
import { useUIStore } from '@/stores/uiStore'
import i18n, { I18nProvider } from '@/i18n'
import { createQueryClient } from '@/api/queryClient'

export function Providers({ children }: { children: React.ReactNode }) {
  const themeMode = useUIStore((s) => s.themeMode)
  const fontPreset = useUIStore((s) => s.fontPreset)
  const colorPreset = useUIStore((s) => s.colorPreset)
  const layoutSize = useUIStore((s) => s.layoutSize)
  const borderRadiusLevel = useUIStore((s) => s.borderRadiusLevel)
  const surfaceStyle = useUIStore((s) => s.surfaceStyle)
  const language = useUIStore((s) => s.language)
  const theme = useMemo(
    () => createAppTheme(themeMode, fontPreset, colorPreset, layoutSize, borderRadiusLevel, surfaceStyle),
    [borderRadiusLevel, colorPreset, fontPreset, layoutSize, surfaceStyle, themeMode]
  )
  const queryClient = useMemo(() => createQueryClient(), [])

  useEffect(() => {
    document.documentElement.lang = language
    if (i18n.language !== language) {
      void i18n.changeLanguage(language)
    }
  }, [language])

  return (
    <I18nProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <GlobalStyles
            styles={{
              '.notistack-MuiContent-success': {
                backgroundColor: `${theme.palette.primary.main} !important`,
                color: `${theme.palette.primary.contrastText} !important`,
              },
              '.notistack-MuiContent-error': {
                backgroundColor: `${theme.palette.error.main} !important`,
                color: `${theme.palette.error.contrastText} !important`,
              },
              '.notistack-MuiContent-warning': {
                backgroundColor: `${theme.palette.warning.main} !important`,
                color: `${theme.palette.warning.contrastText} !important`,
              },
              '.notistack-MuiContent-info': {
                backgroundColor: `${theme.palette.info.main} !important`,
                color: `${theme.palette.info.contrastText} !important`,
              },
              '.notistack-MuiContent-default': {
                backgroundColor: `${
                  theme.palette.mode === 'light'
                    ? theme.palette.grey[900]
                    : alpha(theme.palette.grey[500], 0.24)
                } !important`,
                color: `${theme.palette.common.white} !important`,
              },
            }}
          />
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              {children}
            </LocalizationProvider>
          </SnackbarProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </I18nProvider>
  )
}
