'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
  alpha,
} from '@mui/material'
import {
  AccountBalanceWalletOutlined,
  Inventory2Outlined,
  PointOfSaleOutlined,
} from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, hasHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (hasHydrated && isLoggedIn) {
      router.push('/dashboard')
    }
  }, [hasHydrated, isLoggedIn, router])

  return (
    <Box
      sx={(theme) => ({
        minHeight: '100vh',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.08fr) minmax(420px, 0.92fr)' },
        color: 'text.primary',
        background: `radial-gradient(circle at top left, ${alpha(theme.palette.primary.main, 0.16)}, transparent 34%), radial-gradient(circle at bottom right, ${alpha(theme.palette.primary.light, 0.16)}, transparent 30%)`,
      })}
    >
      <Box
        sx={(theme) => ({
          display: { xs: 'none', lg: 'flex' },
          minHeight: '100vh',
          p: { lg: 6, xl: 8 },
          position: 'relative',
          overflow: 'hidden',
          color: 'primary.contrastText',
          background: `linear-gradient(145deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 54%, ${theme.palette.primary.light} 142%)`,
          flexDirection: 'column',
          justifyContent: 'space-between',
          '&::before': {
            content: '""',
            position: 'absolute',
            width: 520,
            height: 520,
            right: -220,
            top: -180,
            borderRadius: '50%',
            background: alpha('#FFFFFF', 0.15),
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            width: 360,
            height: 360,
            left: -170,
            bottom: -150,
            borderRadius: '50%',
            border: `1px solid ${alpha('#FFFFFF', 0.24)}`,
          },
        })}
      >
        <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={(theme) => ({
                width: 48,
                height: 48,
                borderRadius: theme.shape.borderRadius,
                bgcolor: alpha('#FFFFFF', 0.18),
                border: `1px solid ${alpha('#FFFFFF', 0.28)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 22,
                boxShadow: `0 16px 30px -18px ${alpha('#000000', 0.65)}`,
              })}
            >
              E
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                ERP System
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.78 }}>
                Business operating platform
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ pt: { lg: 8, xl: 10 }, maxWidth: 620 }}>
            <Chip
              label="Secure workspace"
              size="small"
              sx={{
                mb: 2.5,
                color: 'inherit',
                bgcolor: alpha('#FFFFFF', 0.16),
                border: `1px solid ${alpha('#FFFFFF', 0.24)}`,
                fontWeight: 800,
              }}
            />
            <Typography
              variant="h2"
              sx={{
                fontWeight: 950,
                lineHeight: 1.05,
                letterSpacing: '-0.05em',
                fontSize: { lg: 46, xl: 58 },
              }}
            >
              Run sales, inventory, purchases, and reports from one place.
            </Typography>
            <Typography variant="body1" sx={{ mt: 2.5, maxWidth: 520, opacity: 0.84 }}>
              A modern ERP experience designed for growing businesses, teams, and multi-branch operations.
            </Typography>
          </Box>
        </Stack>

        <Paper
          elevation={0}
          sx={(theme) => ({
            position: 'relative',
            zIndex: 1,
            width: '100%',
            maxWidth: 560,
            overflow: 'hidden',
            borderRadius: theme.shape.borderRadius,
            bgcolor: alpha('#FFFFFF', 0.14),
            border: `1px solid ${alpha('#FFFFFF', 0.2)}`,
            color: 'inherit',
            backdropFilter: 'blur(14px)',
          })}
        >
          <Stack direction="row" sx={{ p: 2.25, alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              Workspace overview
            </Typography>
            <Chip size="small" label="Ready" sx={{ color: 'inherit', bgcolor: alpha('#FFFFFF', 0.16), fontWeight: 800 }} />
          </Stack>
          <Divider sx={{ borderColor: alpha('#FFFFFF', 0.16) }} />
          <Stack spacing={0} divider={<Divider flexItem sx={{ borderColor: alpha('#FFFFFF', 0.14) }} />}>
            {[
              { icon: <PointOfSaleOutlined />, label: 'Sales queue', value: 'Ready' },
              { icon: <Inventory2Outlined />, label: 'Inventory sync', value: 'Active' },
              { icon: <AccountBalanceWalletOutlined />, label: 'Cash register', value: 'Open' },
            ].map((item) => (
              <Stack key={item.label} direction="row" sx={{ p: 2.25, alignItems: 'center', gap: 1.75 }}>
                <Box
                  sx={(theme) => ({
                    width: 40,
                    height: 40,
                    borderRadius: theme.shape.borderRadius,
                    bgcolor: alpha('#FFFFFF', 0.16),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  })}
                >
                  {item.icon}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 800 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.72 }}>
                    Workspace status
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 900 }}>
                  {item.value}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Paper>

        <Typography variant="caption" sx={{ position: 'relative', zIndex: 1, opacity: 0.72 }}>
          Secure access for authorized staff only
        </Typography>
      </Box>

      <Box
        sx={(theme) => ({
          minHeight: { xs: '100vh', lg: 'auto' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 2.5, sm: 4, md: 6, xl: 8 },
          py: { xs: 4, md: 6, xl: 8 },
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.72 : 0.44),
        })}
      >
        <Box sx={{ width: '100%', maxWidth: { xs: 460, sm: 500, xl: 540 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
