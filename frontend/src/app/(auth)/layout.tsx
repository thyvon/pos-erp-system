'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
      sx={{
        minHeight: '100vh',
        display: 'flex',
        width: '100%',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: { md: '48%', lg: '56%' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          bgcolor: (theme) =>
            theme.palette.mode === 'light'
              ? '#F4F6F8'
              : '#111820',
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          px: { md: 5, lg: 8 },
          py: { md: 4, lg: 6 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
            }}
          >
            E
          </Box>
          <Box>
            <Typography variant="subtitle1">ERP System</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Operations workspace
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ maxWidth: 520 }}>
          <Typography
            variant="h3"
            sx={{
              mb: 2,
              fontSize: { md: 30, lg: 36 },
              lineHeight: 1.2,
              color: 'text.primary',
            }}
          >
            Hi, welcome back
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 440 }}>
            Sign in to manage sales, stock movement, accounting, and branch operations from one workspace.
          </Typography>

          <Box
            sx={{
              mt: 6,
              width: '100%',
              maxWidth: 460,
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              bgcolor: 'background.paper',
              boxShadow: (theme) =>
                theme.palette.mode === 'light'
                  ? `0 24px 48px -24px ${alpha(theme.palette.grey[500], 0.32)}`
                  : `0 24px 48px -24px ${alpha(theme.palette.common.black, 0.56)}`,
              overflow: 'hidden',
            }}
          >
            <Stack direction="row" sx={{ p: 2, alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2">Today overview</Typography>
              <Chip size="small" label="Live" color="success" variant="outlined" />
            </Stack>
            <Divider />
            <Stack spacing={0} divider={<Divider flexItem />}>
              {[
                { icon: <PointOfSaleOutlined />, label: 'Sales queue', value: 'Ready' },
                { icon: <Inventory2Outlined />, label: 'Inventory sync', value: 'Active' },
                { icon: <AccountBalanceWalletOutlined />, label: 'Cash register', value: 'Open' },
              ].map((item) => (
                <Stack
                  key={item.label}
                  direction="row"
                  sx={{ p: 2, alignItems: 'center', gap: 1.5 }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: 1,
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Workspace status
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 700 }}>
                    {item.value}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Box>

        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          Secure access for authorized staff only
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: { xs: '100%', md: '52%', lg: '44%' },
          bgcolor: 'background.paper',
          px: { xs: 2.5, sm: 4, md: 6 },
          py: { xs: 4, md: 6 },
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          {children}
        </Box>
      </Box>
    </Box>
  )
}
