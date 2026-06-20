'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Chip,
  Divider,
  Stack,
  Typography,
  alpha,
} from '@mui/material'
import {
  AccountBalanceWalletOutlined,
  Inventory2Outlined,
  PointOfSaleOutlined,
  TrendingUpOutlined,
} from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'

function AuthBrand() {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', minWidth: 0 }}>
      <Box
        sx={(theme) => ({
          width: 40,
          height: 40,
          borderRadius: `${theme.shape.borderRadius}px`,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          fontSize: 20,
          fontWeight: 900,
          boxShadow: `0 16px 32px -18px ${alpha(theme.palette.primary.main, 0.9)}`,
        })}
      >
        E
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
          ERP System
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Business platform
        </Typography>
      </Box>
    </Stack>
  )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const router = useRouter()
  const { t } = useTranslation('auth')

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
        bgcolor: theme.palette.mode === 'dark' ? '#0B0F19' : '#FFFFFF',
        backgroundImage: theme.palette.mode === 'dark'
          ? `radial-gradient(circle at 16% 16%, ${alpha(theme.palette.primary.main, 0.14)}, transparent 30%)`
          : `radial-gradient(circle at 14% 12%, ${alpha(theme.palette.primary.light, 0.12)}, transparent 28%)`,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(480px, 0.9fr) minmax(0, 1.1fr)' },
      })}
    >
      <Box
        sx={{
          minHeight: '100dvh',
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr) auto',
          px: { xs: 2.5, sm: 4, md: 6, xl: 8 },
          py: { xs: 2.5, sm: 3.5, md: 4 },
        }}
      >
        <AuthBrand />

        <Box sx={{ display: 'grid', placeItems: 'center', py: { xs: 5, md: 7 } }}>
          <Box sx={{ width: '100%', maxWidth: 420 }}>
            {children}
          </Box>
        </Box>

        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {t('login.copyright')}
        </Typography>
      </Box>

      <Box
        sx={(theme) => ({
          display: { xs: 'none', lg: 'grid' },
          minHeight: '100dvh',
          alignItems: 'stretch',
          p: { lg: 6, xl: 8 },
          bgcolor: alpha(theme.palette.grey[500], theme.palette.mode === 'dark' ? 0.1 : 0.06),
          backgroundImage: theme.palette.mode === 'dark'
            ? [
              `radial-gradient(circle at 78% 20%, ${alpha(theme.palette.primary.main, 0.22)}, transparent 36%)`,
              `radial-gradient(circle at 18% 86%, ${alpha(theme.palette.info.main, 0.14)}, transparent 30%)`,
            ].join(', ')
            : [
              `radial-gradient(circle at 78% 18%, ${alpha(theme.palette.info.light, 0.22)}, transparent 34%)`,
              `radial-gradient(circle at 18% 86%, ${alpha(theme.palette.primary.light, 0.2)}, transparent 32%)`,
            ].join(', '),
          borderLeft: `1px solid ${alpha(theme.palette.grey[500], theme.palette.mode === 'dark' ? 0.16 : 0.12)}`,
        })}
      >
        <Box
          sx={(theme) => ({
            width: '100%',
            height: '100%',
            minHeight: 620,
            position: 'relative',
            overflow: 'hidden',
            display: 'grid',
            alignItems: 'center',
            '&::before': {
              content: '""',
              position: 'absolute',
              width: 520,
              height: 520,
              borderRadius: '50%',
              right: -180,
              top: -160,
              background: alpha(theme.palette.primary.main, 0.14),
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              width: 420,
              height: 420,
              borderRadius: '50%',
              left: -190,
              bottom: -150,
              background: alpha(theme.palette.info.main, 0.1),
            },
          })}
        >
          <Stack
            spacing={6}
            sx={{
              position: 'relative',
              zIndex: 1,
              width: '100%',
              maxWidth: 760,
              ml: { lg: 0, xl: 4 },
            }}
          >
            <Stack spacing={1.25}>
              <Chip
                size="small"
                label={t('layout.secureWorkspace')}
                sx={{
                  alignSelf: 'flex-start',
                  fontWeight: 800,
                  bgcolor: 'primary.lighter',
                  color: 'primary.dark',
                }}
              />
              <Typography
                variant="h3"
                sx={{
                  maxWidth: 620,
                  fontWeight: 950,
                  lineHeight: 1.08,
                }}
              >
                {t('layout.heroTitle')}
              </Typography>
              <Typography variant="body2" sx={{ maxWidth: 560, color: 'text.secondary' }}>
                {t('layout.heroSubtitle')}
              </Typography>
            </Stack>

            <Box
              sx={(theme) => ({
                overflow: 'hidden',
                borderTop: `1px solid ${alpha(theme.palette.grey[500], theme.palette.mode === 'dark' ? 0.18 : 0.14)}`,
                borderBottom: `1px solid ${alpha(theme.palette.grey[500], theme.palette.mode === 'dark' ? 0.18 : 0.14)}`,
              })}
            >
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', p: 2.25 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                    {t('layout.workspaceOverview')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('layout.liveOperations')}
                  </Typography>
                </Box>
                <TrendingUpOutlined color="primary" />
              </Stack>

              <Divider />

              <Stack spacing={0} divider={<Divider flexItem />}>
                {[
                  { icon: <PointOfSaleOutlined />, label: t('layout.salesReady'), value: '24' },
                  { icon: <Inventory2Outlined />, label: t('layout.inventorySynced'), value: '98%' },
                  { icon: <AccountBalanceWalletOutlined />, label: t('layout.cashControl'), value: '$12.4k' },
                ].map((item) => (
                  <Stack key={item.label} direction="row" sx={{ alignItems: 'center', gap: 1.75, p: 2.25 }}>
                    <Box
                      sx={(theme) => ({
                        width: 42,
                        height: 42,
                        borderRadius: `${theme.shape.borderRadius}px`,
                        display: 'grid',
                        placeItems: 'center',
                        color: 'primary.main',
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      })}
                    >
                      {item.icon}
                    </Box>
                    <Box sx={{ flex: '1 1 auto' }}>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {item.label}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('layout.currentStatus')}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                      {item.value}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  )
}
