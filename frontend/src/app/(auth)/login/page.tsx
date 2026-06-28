'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material'
import {
  LockOutlined,
  Mail,
  Visibility,
  VisibilityOff,
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
  const { t } = useTranslation('auth')

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
    } catch (err) {
      const error = toAppApiError(err)
      setServerError(error.status === 422 ? t('login.error.invalidCredentials') : error.message)
    }
  }

  return (
    <Stack spacing={4}>
      <Stack spacing={1}>
        <Typography variant="h4" sx={{ fontWeight: 950 }}>
          {t('login.title')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('login.subtitle')}
        </Typography>
      </Stack>

      {serverError && (
        <Alert
          severity="error"
          onClose={() => setServerError('')}
          sx={(theme) => ({
            borderRadius: `${theme.shape.borderRadius}px`,
            bgcolor: alpha(theme.palette.error.main, theme.palette.mode === 'dark' ? 0.16 : 0.08),
          })}
        >
          {serverError}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2.5}>
          <TextField
            fullWidth
            label={t('login.email')}
            placeholder={t('login.emailPlaceholder')}
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
            label={t('login.password')}
            placeholder={t('login.passwordPlaceholder')}
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
                      aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
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

          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
            <FormControlLabel
              control={<Checkbox size="small" />}
              label={t('login.rememberMe')}
              sx={{
                m: 0,
                '& .MuiFormControlLabel-label': {
                  fontSize: '0.875rem',
                  color: 'text.secondary',
                },
              }}
            />
            <MuiLink
              component={Link}
              href="/forgot-password"
              underline="none"
              sx={{
                color: 'text.primary',
                fontWeight: 700,
                fontSize: '0.875rem',
                whiteSpace: 'nowrap',
                '&:hover': { color: 'primary.main' },
              }}
            >
              {t('login.forgotPassword')}
            </MuiLink>
          </Stack>

          <Button
            type="submit"
            fullWidth
            size="large"
            variant="contained"
            disabled={isSubmitting || loginMutation.isPending}
            sx={(theme) => ({
              mt: 0.5,
              height: 48,
              fontWeight: 900,
              borderRadius: `${theme.shape.borderRadius}px`,
              boxShadow: `0 16px 32px -18px ${alpha(theme.palette.primary.main, 0.95)}`,
              '&:hover': {
                boxShadow: `0 20px 38px -20px ${alpha(theme.palette.primary.main, 1)}`,
              },
            })}
          >
            {isSubmitting || loginMutation.isPending ? (
              <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                <span>{t('login.signingIn')}</span>
              </Stack>
            ) : (
              t('login.signIn')
            )}
          </Button>
        </Stack>
      </Box>
    </Stack>
  )
}
