'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Box, alpha } from '@mui/material'
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'text.primary',
        px: { xs: 2, sm: 3, md: 5, lg: 7 },
        py: { xs: 3, md: 5, lg: 7 },
        background: `radial-gradient(circle at top left, ${alpha(theme.palette.primary.main, 0.14)}, transparent 34%), radial-gradient(circle at bottom right, ${alpha(theme.palette.primary.light, 0.16)}, transparent 30%)`,
      })}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: { xs: 460, md: 1040, lg: 1180, xl: 1280 },
        }}
      >
        {children}
      </Box>
    </Box>
  )
}
