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
      router.replace('/dashboard')
      router.refresh()
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
        borderRadius: `${Number(theme.shape.borderRadius) * 1.5}px`,
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.96 : 0.86),
        border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'light' ? 0.72 : 0.24)}`,
        boxShadow: `0 24px 80px -56px ${alpha(theme.palette.common.black, theme.palette.mode === 'light' ? 0.45 : 0.9)}`,
        color: 'text.primary',
        backdropFilter: 'saturate(180%) blur(18px)',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, transparent 42%)`,
        },
      })}
    >
      <Stack
        spacing={3}
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          p: { xs: 3, sm: 4 },
        }}
      >
        <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}>
          <Box
            sx={(theme) => ({
              width: 44,
              height: 44,
              borderRadius: `${Number(theme.shape.borderRadius) * 1.25}px`,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 900,
              boxShadow: `0 18px 32px -18px ${alpha(theme.palette.primary.main, 0.95)}`,
            })}
          >
            E
          </Box>

          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, letterSpacing: '-0.03em' }}>
              Sign in
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
              ERP System
            </Typography>
          </Box>
        </Stack>

        {serverError && (
          <Alert
            severity="error"
            onClose={() => setServerError('')}
            sx={(theme) => ({ borderRadius: `${theme.shape.borderRadius}px` })}
          >
            {serverError}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2.25}>
            <TextField
              fullWidth
              label="Email"
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
              placeholder="Enter password"
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
                        onClick={() => setShowPassword((value) => !value)}
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

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
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
            </Box>

            <Button
              type="submit"
              fullWidth
              size="large"
              variant="contained"
              disabled={isSubmitting || loginMutation.isPending}
              sx={(theme) => ({
                mt: 0.5,
                py: 1.25,
                fontWeight: 800,
                boxShadow: `0 16px 32px -18px ${alpha(theme.palette.primary.main, 0.95)}`,
                '&:hover': {
                  boxShadow: `0 20px 38px -20px ${alpha(theme.palette.primary.main, 1)}`,
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
      </Stack>
    </Paper>
  )
}
