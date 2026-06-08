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
        borderRadius: theme.shape.borderRadius,
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
          background: `radial-gradient(circle at top right, ${alpha(theme.palette.primary.main, 0.14)}, transparent 34%)`,
        },
      })}
    >
      <Stack
        spacing={4}
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          p: { xs: 3, sm: 4.5, xl: 5.5 },
        }}
      >
        <Box>
          <Box
            sx={{
              display: { xs: 'flex', lg: 'none' },
              alignItems: 'center',
              gap: 1.25,
              mb: 4,
            }}
          >
            <Box
              sx={(theme) => ({
                width: 38,
                height: 38,
                borderRadius: theme.shape.borderRadius,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                boxShadow: `0 12px 24px -14px ${alpha(theme.palette.primary.main, 0.9)}`,
              })}
            >
              E
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                ERP System
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Business operating platform
              </Typography>
            </Box>
          </Box>

          <Typography variant="h4" sx={{ mb: 1, fontWeight: 900, letterSpacing: '-0.03em' }}>
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
            sx={(theme) => ({ borderRadius: theme.shape.borderRadius })}
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
    </Paper>
  )
}
