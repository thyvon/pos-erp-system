'use client'

import { Box, Typography, Button, Stack } from '@mui/material'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'contained' | 'outlined'
  }
}

export default function PageHeader({
  title,
  subtitle,
  action,
}: PageHeaderProps) {
  return (
    <Box
      sx={{
        mb: 4,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 2,
      }}
    >
      <Box>
        <Typography variant="h3" sx={{ mb: 1, fontWeight: 700 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && (
        <Button
          variant={action.variant || 'contained'}
          color="primary"
          onClick={action.onClick}
          sx={{ whiteSpace: 'nowrap', mt: 0.5 }}
        >
          {action.label}
        </Button>
      )}
    </Box>
  )
}