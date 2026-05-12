'use client'

import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import { ReactNode, useEffect, useState } from 'react'
import { createDynamicTheme } from '@/theme/dynamic-theme'
import { useSettingsStore } from '@/stores/settings'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { themeMode, colorPreset, fontFamily, fontSize, borderRadius } = useSettingsStore()
  const [theme, setTheme] = useState(createDynamicTheme({
    themeMode,
    colorPreset,
    fontFamily,
    fontSize,
    borderRadius,
  }))

  useEffect(() => {
    const newTheme = createDynamicTheme({
      themeMode,
      colorPreset,
      fontFamily,
      fontSize,
      borderRadius,
    })
    setTheme(newTheme)
  }, [themeMode, colorPreset, fontFamily, fontSize, borderRadius])

  return <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
}
