'use client'

import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  useTheme,
  Stack,
  alpha,
} from '@mui/material'
import {
  Menu,
  Brightness4,
  Brightness7,
  TuneOutlined,
} from '@mui/icons-material'
import { useUIStore } from '@/stores/uiStore'
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, TOPBAR_HEIGHT } from '@/theme'
import AccountPopover from './AccountPopover'
import NotificationsPopover from './NotificationsPopover'

export default function AppTopbar() {
  const theme = useTheme()
  const {
    sidebarOpen,
    toggleMobileSidebar,
    toggleSettings,
    toggleTheme,
  } = useUIStore()

  const drawerWidth = sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH

  return (
    <AppBar
      sx={{
        width: { lg: `calc(100% - ${drawerWidth}px)` },
        ml: { lg: `${drawerWidth}px` },
        height: TOPBAR_HEIGHT,
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(['width', 'margin'], {
          duration: theme.transitions.duration.shorter,
        }),
        backdropFilter: 'blur(8px)',
        backgroundColor: alpha(theme.palette.background.default, 0.86),
        borderBottom: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
      }}
    >
      <Toolbar
        sx={{
          minHeight: TOPBAR_HEIGHT,
          px: { lg: 5 },
        }}
      >
        <IconButton
          onClick={toggleMobileSidebar}
          sx={{
            mr: 1,
            color: 'text.primary',
            display: { lg: 'none' },
          }}
        >
          <Menu />
        </IconButton>

        <Box sx={{ flexGrow: 1 }} />

        <Stack
          direction="row"
          spacing={{ xs: 0.5, sm: 1.5 }}
          sx={{ alignItems: 'center' }}
        >
          <IconButton onClick={toggleTheme} sx={{ width: 40, height: 40 }}>
            {theme.palette.mode === 'light' ? <Brightness4 /> : <Brightness7 />}
          </IconButton>

          <IconButton onClick={toggleSettings} sx={{ width: 40, height: 40 }}>
            <TuneOutlined />
          </IconButton>

          <NotificationsPopover />

          <AccountPopover />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
