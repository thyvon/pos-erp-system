import { ReactNode } from 'react'
import { Box, Button, Paper, Stack, Typography, alpha } from '@mui/material'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  action?: ReactNode
  secondaryAction?: ReactNode
  compact?: boolean
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <Paper
      elevation={0}
      sx={(theme) => ({
        width: '100%',
        px: { xs: 2, sm: compact ? 3 : 5 },
        py: { xs: compact ? 3 : 4, sm: compact ? 4 : 7 },
        borderRadius: 3,
        textAlign: 'center',
        border: `1px dashed ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.24 : 0.34)}`,
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'light' ? 0.72 : 0.58),
        backgroundImage: `radial-gradient(circle at top, ${alpha(theme.palette.primary.main, 0.08)}, transparent 34%)`,
        backdropFilter: 'saturate(180%) blur(12px)',
      })}
    >
      <Stack spacing={2} sx={{ alignItems: 'center', maxWidth: 520, mx: 'auto' }}>
        {icon && (
          <Box
            sx={(theme) => ({
              width: compact ? 48 : 64,
              height: compact ? 48 : 64,
              borderRadius: 2.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
              boxShadow: `0 18px 40px -26px ${alpha(theme.palette.primary.main, 0.7)}`,
              '& svg': {
                width: compact ? 26 : 34,
                height: compact ? 26 : 34,
              },
            })}
          >
            {icon}
          </Box>
        )}

        <Box>
          <Typography variant={compact ? 'h6' : 'h5'} sx={{ fontWeight: 900, letterSpacing: '-0.02em' }}>
            {title}
          </Typography>
          {description && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.75 }}>
              {description}
            </Typography>
          )}
        </Box>

        {(action || actionLabel || secondaryAction) && (
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ pt: 0.5 }}>
            {action ?? (
              actionLabel && (
                <Button variant="contained" onClick={onAction} sx={{ fontWeight: 800 }}>
                  {actionLabel}
                </Button>
              )
            )}
            {secondaryAction}
          </Stack>
        )}
      </Stack>
    </Paper>
  )
}
