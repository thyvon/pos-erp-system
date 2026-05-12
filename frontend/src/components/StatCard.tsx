'use client'

import { Card, CardContent, Typography, Box, useTheme } from '@mui/material'

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'error' | 'info'
  trend?: {
    label: string
    percentage: number
    isPositive: boolean
  }
}

export default function StatCard({
  title,
  value,
  icon,
  color = 'primary',
  trend,
}: StatCardProps) {
  const theme = useTheme()

  const colorMap = {
    primary: theme.palette.primary,
    success: theme.palette.success,
    warning: theme.palette.warning,
    error: theme.palette.error,
    info: theme.palette.info,
  }

  const selectedColor = colorMap[color]

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ color: 'text.secondary', mb: 1 }}
            >
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700 }}>
              {value}
            </Typography>
          </Box>
          {icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: '8px',
                backgroundColor: `${selectedColor.lighter}20`,
                color: selectedColor.main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>

        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="caption"
              sx={{
                fontWeight: 600,
                color: trend.isPositive
                  ? theme.palette.success.main
                  : theme.palette.error.main,
              }}
            >
              {trend.isPositive ? '+' : '-'}
              {trend.percentage}%
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {trend.label}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}