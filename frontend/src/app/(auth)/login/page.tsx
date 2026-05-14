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
} from '@mui/icons-material'
import { useLoginMutation } from '@/features/auth/hooks'
import { toAppApiError } from '@/api/errors'

// Validation schema
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
      sx={{
        width: '100%',
        bgcolor: 'background.paper',
        borderRadius: 0,
        p: 0,
        color: 'text.primary',
      }}
    >
      <Stack spacing={4}>
        <Box>
          <Box
            sx={{
              display: { xs: 'flex', md: 'none' },
              alignItems: 'center',
              gap: 1.25,
              mb: 5,
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
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
            <Typography variant="subtitle1">ERP System</Typography>
          </Box>

          <Typography variant="h4" sx={{ mb: 1, fontSize: 24 }}>
            Sign in to your account
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Enter your credentials to continue to the dashboard.
          </Typography>
        </Box>

        {serverError && (
          <Alert
            severity="error"
            onClose={() => setServerError('')}
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
                  fontWeight: 600,
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
              sx={{
                minHeight: 48,
                boxShadow: (theme) => `0 8px 16px 0 ${alpha(theme.palette.primary.main, 0.24)}`,
              }}
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
