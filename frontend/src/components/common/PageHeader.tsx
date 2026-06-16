import { ReactNode } from 'react'
import { Box, Stack, Typography } from '@mui/material'

interface PageHeaderProps {
  title: string
  description?: string
  eyebrow?: string
  icon?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
}

export default function PageHeader({ title, description, eyebrow, icon, actions, meta }: PageHeaderProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{
        alignItems: { xs: 'flex-start', md: 'center' },
        justifyContent: 'space-between',
        mb: 2.5,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        {eyebrow && (
          <Typography
            variant="overline"
            sx={{
              display: 'block',
              color: 'primary.main',
              fontWeight: 800,
              letterSpacing: 0.8,
              mb: 0.25,
            }}
          >
            {eyebrow}
          </Typography>
        )}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          {icon && icon}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
            }}
          >
            {title}
          </Typography>
        </Stack>
        {description && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.75, maxWidth: 680 }}>
            {description}
          </Typography>
        )}
        {meta && <Box sx={{ mt: 1.25 }}>{meta}</Box>}
      </Box>

      {actions && (
        <Stack
          direction="row"
          spacing={1}
          sx={{
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'stretch', md: 'flex-end' },
            '& > *': {
              flex: { xs: 1, sm: 'initial' },
            },
          }}
        >
          {actions}
        </Stack>
      )}
    </Stack>
  )
}
