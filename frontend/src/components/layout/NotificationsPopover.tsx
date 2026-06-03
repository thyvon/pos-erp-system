'use client'

import { useState } from 'react'
import {
  Box,
  List,
  Badge,
  Button,
  Divider,
  Tooltip,
  Typography,
  IconButton,
  Popover,
  ListItemButton,
  ListItemText,
  alpha,
  type SxProps,
  type Theme,
} from '@mui/material'
import { Notifications, DoneAll } from '@/components/ui/icons'

interface NotificationsPopoverProps {
  buttonSx?: SxProps<Theme>
  activeColor?: string
}

export default function NotificationsPopover({ buttonSx, activeColor }: NotificationsPopoverProps) {
  const [open, setOpen] = useState<HTMLElement | null>(null)

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setOpen(event.currentTarget)
  }

  const handleClose = () => {
    setOpen(null)
  }

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={[
          {
            width: 'var(--app-control-height)',
            height: 'var(--app-control-height)',
            color: open ? activeColor ?? 'primary.main' : undefined,
          },
          ...(Array.isArray(buttonSx) ? buttonSx : buttonSx ? [buttonSx] : []),
        ]}
      >
        <Badge badgeContent={2} color="error">
          <Notifications />
        </Badge>
      </IconButton>

      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              ml: 0.75,
              width: { xs: 'calc(100vw - 32px)', sm: 360 },
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.9),
              border: (theme) => `solid 1px ${theme.palette.divider}`,
            },
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', py: 2, px: 2.5 }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1">Notifications</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              You have 2 unread messages
            </Typography>
          </Box>

          <Tooltip title=" Mark all as read">
            <IconButton color="primary">
              <DoneAll />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <List disablePadding>
          <ListItemButton sx={{ py: 1.5, px: 2.5, mt: '1px' }}>
            <ListItemText
              primary="New order placed #12345"
              secondary={
                <Typography
                  variant="caption"
                  sx={{ mt: 0.5, display: 'flex', alignItems: 'center', color: 'text.disabled' }}
                >
                  2 hours ago
                </Typography>
              }
            />
          </ListItemButton>

          <ListItemButton sx={{ py: 1.5, px: 2.5, mt: '1px' }}>
            <ListItemText
              primary="Stock level low for Product A"
              secondary={
                <Typography
                  variant="caption"
                  sx={{ mt: 0.5, display: 'flex', alignItems: 'center', color: 'text.disabled' }}
                >
                  5 hours ago
                </Typography>
              }
            />
          </ListItemButton>
        </List>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <Box sx={{ p: 1 }}>
          <Button fullWidth disableRipple>
            View All
          </Button>
        </Box>
      </Popover>
    </>
  )
}
