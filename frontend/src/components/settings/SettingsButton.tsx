'use client'

import {
  Fab,
  Tooltip,
  Box,
  Badge,
} from '@mui/material'
import {
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { useSettingsStore } from '@/stores/settings'

interface SettingsButtonProps {
  onClick: () => void
}

export function SettingsButton({ onClick }: SettingsButtonProps) {
  const { showCustomizer } = useSettingsStore()

  return (
    <Tooltip title="Layout Settings" placement="left">
      <Fab
        color="primary"
        size="medium"
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: (theme) => theme.zIndex.fab,
          boxShadow: '0 8px 16px 0 rgba(0, 171, 85, 0.24)',
        }}
      >
        <Badge
          color="error"
          variant="dot"
          invisible={!showCustomizer}
        >
          <SettingsIcon />
        </Badge>
      </Fab>
    </Tooltip>
  )
}
