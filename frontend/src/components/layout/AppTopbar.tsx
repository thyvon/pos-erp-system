'use client'

import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  useTheme,
  Stack,
  alpha,
  Tooltip,
} from '@mui/material'
import {
  Menu,
  Brightness4,
  Brightness7,
  TuneOutlined,
  ChevronLeft,
  ChevronRight,
} from '@/components/ui/icons'
import { useUIStore } from '@/stores/uiStore'
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH, TOPBAR_HEIGHT } from '@/theme'
import AccountPopover from './AccountPopover'
import NotificationsPopover from './NotificationsPopover'

export default function AppTopbar() {
  const theme = useTheme()
  const {
    sidebarOpen,
    setSidebarOpen,
    topbarTheme,
    toggleMobileSidebar,
    toggleSettings,
    toggleTheme,
  } = useUIStore()

  const drawerWidth = sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH
  const resolvedTopbarTheme = topbarTheme === 'inherit' ? theme.palette.mode : topbarTheme
  const topbarIsDark = resolvedTopbarTheme === 'dark'
  const topbarColors = {
    bg: topbarIsDark
      ? alpha('#111827', 0.94)
      : resolvedTopbarTheme === 'light'
        ? alpha(theme.palette.common.white, 0.92)
        : alpha(theme.palette.background.default, 0.86),
    border: topbarIsDark ? alpha('#ffffff', 0.12) : alpha(theme.palette.grey[500], 0.12),
    icon: topbarIsDark ? alpha('#ffffff', 0.82) : theme.palette.text.primary,
    iconMuted: topbarIsDark ? alpha('#ffffff', 0.72) : theme.palette.text.secondary,
    buttonBg: topbarIsDark ? alpha('#ffffff', 0.08) : alpha(theme.palette.grey[500], 0.08),
    buttonHover: topbarIsDark ? alpha('#ffffff', 0.14) : alpha(theme.palette.primary.main, 0.08),
    floatingBg: topbarIsDark ? '#111827' : theme.palette.background.paper,
    floatingBorder: topbarIsDark ? alpha('#ffffff', 0.16) : theme.palette.divider,
  }

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
        backgroundColor: topbarColors.bg,
        borderBottom: `1px solid ${topbarColors.border}`,
        overflow: 'visible',
      }}
    >
      <Tooltip title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
        <IconButton
          onClick={() => setSidebarOpen(!sidebarOpen)}
          sx={{
            position: 'absolute',
            left: -18,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: theme.zIndex.drawer + 2,
            width: 36,
            height: 36,
            borderRadius: 1,
            color: topbarColors.iconMuted,
            bgcolor: topbarColors.floatingBg,
            border: `1px solid ${topbarColors.floatingBorder}`,
            boxShadow: (theme) => theme.shadows[2],
            display: { xs: 'none', lg: 'inline-flex' },
            '&:hover': {
              color: topbarIsDark ? theme.palette.primary.light : theme.palette.primary.main,
              bgcolor: topbarColors.floatingBg,
            },
          }}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
        </IconButton>
      </Tooltip>

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
            color: topbarColors.icon,
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
          <IconButton
            onClick={toggleTheme}
            sx={{
              width: 40,
              height: 40,
              color: topbarColors.icon,
              bgcolor: topbarColors.buttonBg,
              '&:hover': { bgcolor: topbarColors.buttonHover },
            }}
          >
            {theme.palette.mode === 'light' ? <Brightness4 /> : <Brightness7 />}
          </IconButton>

          <IconButton
            onClick={toggleSettings}
            sx={{
              width: 40,
              height: 40,
              color: topbarColors.icon,
              bgcolor: topbarColors.buttonBg,
              '&:hover': { bgcolor: topbarColors.buttonHover },
            }}
          >
            <TuneOutlined />
          </IconButton>

          <NotificationsPopover
            activeColor={topbarIsDark ? theme.palette.primary.light : theme.palette.primary.main}
            buttonSx={{
              color: topbarColors.icon,
              bgcolor: topbarColors.buttonBg,
              '&:hover': { bgcolor: topbarColors.buttonHover },
            }}
          />

          <AccountPopover />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
