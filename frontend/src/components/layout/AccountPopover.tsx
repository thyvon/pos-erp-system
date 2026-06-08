'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Divider,
  Typography,
  MenuList,
  MenuItem,
  Avatar,
  IconButton,
  Popover,
  alpha,
  type SxProps,
  type Theme,
} from '@mui/material'
import { useAuthStore } from '@/stores/authStore'
import { useLogoutMutation } from '@/features/auth/hooks'

interface AccountPopoverProps {
  avatarBorderColor?: string
  buttonSx?: SxProps<Theme>
}

export default function AccountPopover({ avatarBorderColor, buttonSx }: AccountPopoverProps) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const logoutMutation = useLogoutMutation()
  const [open, setOpen] = useState<HTMLElement | null>(null)

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setOpen(event.currentTarget)
  }

  const handleClose = () => {
    setOpen(null)
  }

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSettled: () => router.push('/login'),
    })
  }

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={[
          {
            p: 0,
            ...(open && {
              '&:before': {
                zIndex: 1,
                content: "''",
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                position: 'absolute',
                bgcolor: (theme) => alpha(theme.palette.grey[900], 0.08),
              },
            }),
          },
          ...(Array.isArray(buttonSx) ? buttonSx : buttonSx ? [buttonSx] : []),
        ]}
      >
        <Avatar
          src={user?.avatar_url || ''}
          alt={user ? `${user.first_name} ${user.last_name}` : 'User'}
          sx={{
            width: 36,
            height: 36,
            border: (theme) => `solid 2px ${avatarBorderColor ?? theme.palette.background.default}`,
          }}
        />
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
              p: 0,
              mt: 1.5,
              ml: 0.75,
              width: 220,
              overflow: 'inherit',
              backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.9),
              border: (theme) => `solid 1px ${theme.palette.divider}`,
              '& .MuiMenuItem-root': {
                typography: 'body2',
                borderRadius: (theme) => theme.shape.borderRadius,
              },
            },
          },
        }}
      >
        <Box sx={{ my: 1.5, px: 2.5 }}>
          <Typography variant="subtitle2" noWrap>
            {user ? `${user.first_name} ${user.last_name}` : 'User'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {user?.roles?.[0] || 'Member'}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuList sx={{ p: 1 }}>
          <MenuItem onClick={handleClose}>Profile</MenuItem>
          <MenuItem onClick={handleClose}>Settings</MenuItem>
        </MenuList>

        <Divider sx={{ borderStyle: 'dashed' }} />

        <MenuList sx={{ p: 1 }}>
          <MenuItem
            onClick={handleLogout}
            sx={{ color: 'error.main', fontWeight: 700 }}
          >
            Logout
          </MenuItem>
        </MenuList>
      </Popover>
    </>
  )
}
