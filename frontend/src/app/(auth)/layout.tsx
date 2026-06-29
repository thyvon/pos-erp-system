'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  Box,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material'
import { SettingsOutlined } from '@/components/ui/icons'
import LayoutSettings from '@/components/layout/LayoutSettings'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'

const ILLUSTRATION_URL =
  'https://pub-c5e31b5cdafb419fb247a8ac2e78df7a.r2.dev/public/assets/illustrations/illustration-dashboard.webp'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const router = useRouter()
  const { t } = useTranslation('auth')
  const toggleSettings = useUIStore((state) => state.toggleSettings)

  useEffect(() => {
    if (hasHydrated && isLoggedIn) {
      router.push('/dashboard')
    }
  }, [hasHydrated, isLoggedIn, router])

  return (
    <Box
      sx={(theme) => ({
        minHeight: '100dvh',
        width: '100%',
        color: 'text.primary',
        bgcolor: theme.palette.mode === 'dark' ? '#0B0F19' : '#F5F7FA',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: '3fr 7fr' },
      })}
    >
      {/* Left: Illustration */}
      <Box
        sx={{
          display: { xs: 'none', lg: 'flex' },
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100dvh',
          p: 4,
          gap: 4,
        }}
      >
        <Typography variant="h3" sx={{ fontWeight: 800, textAlign: 'center' }}>
          {t('layout.welcomeBack')}
        </Typography>
        <Box
          component="img"
          src={ILLUSTRATION_URL}
          alt=""
          sx={(theme) => ({
            maxWidth: '100%',
            height: 'auto',
            display: 'block',
            filter: (t) => `drop-shadow(0 8px 24px ${alpha(t.palette.primary.main, 0.15)})`,
          })}
        />
      </Box>

      {/* Right: Login card */}
      <Box
        sx={(theme) => ({
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          px: { xs: 2, sm: 4 },
          py: { xs: 2, sm: 3 },

        })}
      >
        <Paper
          elevation={0}
          sx={(theme) => ({
            width: '100%',
            maxWidth: 440,
            p: { xs: 3, sm: 5 },
            bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.72 : 0.82),
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            boxShadow: (t) =>
              `0 0 0 1px ${alpha(t.palette.primary.main, 0.04)}, 0 0 60px 20px ${alpha(t.palette.primary.main, 0.15)}`,
          })}
        >
          <Stack spacing={4}>
            {/* Form */}
            {children}
          </Stack>
        </Paper>

        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}
        >
          {t('login.copyright')}
        </Typography>
      </Box>

      <LayoutSettings />

      {/* Top-left logo */}
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          position: 'fixed',
          top: 16,
          left: 24,
          zIndex: 1500,
          alignItems: 'center',
          minWidth: 0,
        }}
      >
        <Box
          sx={(theme) => ({
            width: 34,
            height: 34,
            borderRadius: `${theme.shape.borderRadius}px`,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            fontSize: 16,
            fontWeight: 900,
            boxShadow: `0 16px 32px -18px ${alpha(theme.palette.primary.main, 0.9)}`,
          })}
        >
          E
        </Box>
        <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
            ERP System
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Business platform
          </Typography>
        </Box>
      </Stack>

      <Tooltip title="Layout settings">
        <IconButton
          onClick={toggleSettings}
          sx={(theme) => ({
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: 1500,
            bgcolor: alpha(theme.palette.background.paper, 0.7),
            backdropFilter: 'blur(8px)',
            border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.9) },
          })}
        >
          <SettingsOutlined />
        </IconButton>
      </Tooltip>
    </Box>
  )
}
