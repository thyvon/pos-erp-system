'use client'

import type { ElementType, ReactNode } from 'react'
import { alpha } from '@mui/material/styles'
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'

type SummaryCardColor = 'primary' | 'success' | 'warning' | 'error' | 'info'

interface SummaryCardProps {
  label: string
  value: ReactNode
  icon: ElementType
  color?: SummaryCardColor
}

export function SummaryCard({ label, value, icon: Icon, color = 'primary' }: SummaryCardProps) {
  return (
    <Card
      sx={(theme) => ({
        height: '100%',
        border: `1px solid ${alpha(theme.palette[color].main, 0.16)}`,
        background: `linear-gradient(135deg, ${alpha(theme.palette[color].main, 0.1)} 0%, ${alpha(
          theme.palette.background.paper,
          0.96,
        )} 46%, ${theme.palette.background.paper} 100%)`,
        boxShadow: `0 14px 36px ${alpha(theme.palette[color].main, 0.1)}`,
      })}
    >
      <CardContent sx={{ p: 2.25, '&:last-child': { pb: 2.25 } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 600, lineHeight: 1.35, wordBreak: 'break-word' }}
            >
              {label}
            </Typography>
            <Typography
              variant="h5"
              sx={{
                mt: 1,
                fontWeight: 800,
                lineHeight: 1.1,
                overflowWrap: 'anywhere',
              }}
            >
              {value}
            </Typography>
          </Box>
          <Box
            sx={(theme) => ({
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              borderRadius: 2,
              flexShrink: 0,
              color: theme.palette[color].main,
              bgcolor: alpha(theme.palette[color].main, 0.12),
              boxShadow: `inset 0 0 0 1px ${alpha(theme.palette[color].main, 0.14)}`,
            })}
          >
            <Icon fontSize="medium" />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
