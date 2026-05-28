'use client'

import { Box, useTheme } from '@mui/material'
import { useUIStore } from '@/stores/uiStore'
import AppSidebar from '@/components/layout/AppSidebar'
import AppTopbar from '@/components/layout/AppTopbar'
import Breadcrumbs from '@/components/layout/Breadcrumbs'
import LayoutSettings from '@/components/layout/LayoutSettings'
import { AuthGate } from '@/components/auth/AuthGate'
import { getLayoutMetrics } from '@/theme'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { contentStretch, layoutSize, surfaceStyle } = useUIStore()
  const theme = useTheme()
  const layoutMetrics = getLayoutMetrics(layoutSize)
  const isGlassSurface = surfaceStyle === 'glass'

  return (
    <AuthGate>
      <Box
        sx={{
          display: 'flex',
          minHeight: '100vh',
          bgcolor: isGlassSurface ? 'transparent' : 'background.default',
        }}
      >
        <AppSidebar />

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.shorter,
            }),
          }}
        >
          <AppTopbar />
          <LayoutSettings />

          <Box
            sx={{
              flexGrow: 1,
              width: '100%',
              maxWidth: contentStretch ? 'none' : layoutMetrics.contentMaxWidth,
              mx: 'auto',
              px: { xs: 2, sm: 3, lg: 3 },
              py: { xs: 2, sm: 3 },
              mt: `${layoutMetrics.topbarHeight}px`,
              minHeight: `calc(100vh - ${layoutMetrics.topbarHeight}px)`,
            }}
          >
            <Breadcrumbs />
            {children}
          </Box>
        </Box>
      </Box>
    </AuthGate>
  )
}
