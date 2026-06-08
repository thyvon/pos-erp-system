'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Alert,
  InputAdornment,
  IconButton,
  Stack,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Divider,
  alpha,
  Link as MuiLink,
  Chip,
} from '@mui/material'
import Link from 'next/link'
import {
  Visibility,
  VisibilityOff,
  Mail,
  LockOutlined,
} from '@/components/ui/icons'
import { useLoginMutation } from '@/features/auth/hooks'
import { toAppApiError } from '@/api/errors'

const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z
    .string({ error: 'Password is required' })
    .min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState('')
  const loginMutation = useLoginMutation()
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setServerError('')

    try {
      await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      })
      router.push('/dashboard')
    } catch (err) {
      const error = toAppApiError(err)
      setServerError(error.status === 422 ? 'Please check your email and password.' : error.message)
    }
  }

  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        position: 'relative',
        width: '100%',
        overflow: 'hidden',
        borderRadius: { xs: 3, md: 4 },
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.92 : 0.82),
        border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.12 : 0.24)}`,
        boxShadow: `0 24px 80px -48px ${alpha(theme.palette.primary.main, 0.72)}`,
        color: 'text.primary',
        backdropFilter: 'saturate(180%) blur(18px)',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(circle at top right, ${alpha(theme.palette.primary.main, 0.16)}, transparent 36%), radial-gradient(circle at bottom left, ${alpha(theme.palette.primary.light, 0.16)}, transparent 34%)`,
        },
      })}
    >
      <Box sx={{ position: 'relative', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '0.9fr 1.1fr' } }}>
        <Box
          sx={(theme) => ({
            display: { xs: 'none', md: 'flex' },
            minHeight: 560,
            p: 4,
            color: 'primary.contrastText',
            background: `linear-gradient(145deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 56%, ${theme.palette.primary.light} 140%)`,
            position: 'relative',
            overflow: 'hidden',
            flexDirection: 'column',
            justifyContent: 'space-between',
            '&::before': {
              content: '""',
              position: 'absolute',
              width: 360,
              height: 360,
              right: -160,
              top: -140,
              borderRadius: '50%',
              background: alpha('#FFFFFF', 0.16),
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              width: 260,
              height: 260,
              left: -120,
              bottom: -110,
              borderRadius: '50%',
              border: `1px solid ${alpha('#FFFFFF', 0.22)}`,
            },
          })}
        >
          <Stack spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
            <Stack direction="row" sx={{ alignItems: 'center', gap: 1.5 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: alpha('#FFFFFF', 0.18),
                  border: `1px solid ${alpha('#FFFFFF', 0.28)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: 20,
                  boxShadow: `0 16px 30px -18px ${alpha('#000000', 0.65)}`,
                }}
              >
                E
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                  ERP System
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.78 }}>
                  Business operating platform
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ pt: 6 }}>
              <Chip
                label="Secure workspace"
                size="small"
                sx={{
                  mb: 2,
                  color: 'inherit',
                  bgcolor: alpha('#FFFFFF', 0.16),
                  border: `1px solid ${alpha('#FFFFFF', 0.24)}`,
                  fontWeight: 700,
                }}
              />
              <Typography variant="h3" sx={{ fontWeight: 900, lineHeight: 1.08, maxWidth: 360 }}>
                Run sales, inventory, purchases, and reports from one place.
              </Typography>
              <Typography variant="body2" sx={{ mt: 2, maxWidth: 360, opacity: 0.82 }}>
                A modern ERP experience designed for growing businesses, teams, and multi-branch operations.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1.25} sx={{ position: 'relative', zIndex: 1 }}>
            {['POS', 'Inventory', 'Reports'].map((item) => (
              <Box
                key={item}
                sx={{
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 999,
                  bgcolor: alpha('#FFFFFF', 0.14),
                  border: `1px solid ${alpha('#FFFFFF', 0.2)}`,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {item}
              </Box>
            ))}
          </Stack>
        </Box>

        <Box sx={{ p: { xs: 3, sm: 4.5, md: 5 }, display: 'flex', alignItems: 'center' }}>
          <Stack spacing={4} sx={{ width: '100%', maxWidth: 440, mx: 'auto' }}>
            <Box>
              <Box
                sx={{
                  display: { xs: 'flex', md: 'none' },
                  alignItems: 'center',
                  gap: 1.25,
                  mb: 4,
                }}
              >
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 1.5,
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    boxShadow: (theme) => `0 12px 24px -14px ${alpha(theme.palette.primary.main, 0.9)}`,
                  }}
                >
                  E
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                    ERP System
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Business operating platform
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h4" sx={{ mb: 1, fontWeight: 900, fontSize: { xs: 24, sm: 28 } }}>
                Welcome back
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                Sign in securely to continue managing your business workspace.
              </Typography>
            </Box>

            {serverError && (
              <Alert
                severity="error"
                onClose={() => setServerError('')}
                sx={{ borderRadius: 2 }}
              >
                {serverError}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  label="Email address"
                  placeholder="name@company.com"
                  type="email"
                  {...register('email')}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail sx={{ color: 'text.disabled', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    },
                    htmlInput: {
                      autoComplete: 'email',
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  placeholder="Enter your password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined sx={{ color: 'text.disabled', fontSize: 20 }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                    htmlInput: {
                      autoComplete: 'current-password',
                    },
                  }}
                />

                <Stack
                  direction="row"
                  sx={{
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <FormControlLabel
                    control={<Checkbox size="small" />}
                    label="Remember me"
                    slotProps={{
                      typography: {
                        variant: 'body2',
                        color: 'text.secondary',
                      },
                    }}
                    sx={{ m: 0 }}
                  />
                  <MuiLink
                    component={Link}
                    href="/forgot-password"
                    underline="none"
                    sx={{
                      color: 'primary.main',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                    }}
                  >
                    Forgot password?
                  </MuiLink>
                </Stack>

                <Button
                  type="submit"
                  fullWidth
                  size="large"
                  variant="contained"
                  disabled={isSubmitting || loginMutation.isPending}
                  sx={(theme) => ({
                    minHeight: 50,
                    fontWeight: 800,
                    boxShadow: `0 14px 28px -16px ${alpha(theme.palette.primary.main, 0.9)}`,
                    '&:hover': {
                      boxShadow: `0 18px 34px -18px ${alpha(theme.palette.primary.main, 1)}`,
                    },
                  })}
                >
                  {isSubmitting || loginMutation.isPending ? (
                    <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} color="inherit" />
                      <span>Signing in...</span>
                    </Stack>
                  ) : (
                    'Sign in'
                  )}
                </Button>
              </Stack>
            </Box>

            <Divider />

            <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              Access is managed by your system administrator.
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Paper>
  )
}
