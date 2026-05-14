'use client'

import { Typography, Box, Button } from '@mui/material'
import { useAuthStore } from '@/stores/authStore'
import { useRouter } from 'next/navigation'

export default function NoBranchAccessPage() {
  const { logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center',
      }}
    >
      <Typography variant="h4" gutterBottom>
        No Branch Access
      </Typography>
      <Typography variant="body1" sx={{ mb: 3 }}>
        You do not have access to any branches. Please contact your administrator.
      </Typography>
      <Button variant="contained" onClick={handleLogout}>
        Logout
      </Button>
    </Box>
  )
}
