'use client'

import {
  AppBar,
  Toolbar,
  IconButton,
  Box,
  useTheme,
  Stack,
  Tooltip,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import {
  Menu,
  Brightness4,
  Brightness7,
  TuneOutlined,
  ChevronLeft,
  ChevronRight,
} from '@/components/ui/icons'
import { useUIStore } from '@/stores/uiStore'
import { buildLayoutSurfaceColors, getLayoutMetrics } from '@/theme'
import AccountPopover from './AccountPopover'
import NotificationsPopover from './NotificationsPopover'

export default function AppTopbar() {
  const theme = useTheme()
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const setSidebarOpen = useUIStore((state) => state.setSidebarOpen)
  const topbarTheme = useUIStore((state) => state.topbarTheme)
  const toggleMobileSidebar = useUIStore((state) => state.toggleMobileSidebar)
  const toggleSettings = useUIStore((state) => state.toggleSettings)
  const toggleTheme = useUIStore((state) => state.toggleTheme)
  const layoutSize = useUIStore((state) => state.layoutSize)

  const layoutMetrics = getLayoutMetrics(layoutSize)
  const drawerWidth = sidebarOpen ? layoutMetrics.sidebarWidth : layoutMetrics.sidebarCollapsedWidth
  const topbarColors = buildLayoutSurfaceColors(theme, topbarTheme)

  return (
    <AppBar
      sx={{
        width: { lg: `calc(100% - ${drawerWidth}px)` },
        ml: { lg: `${drawerWidth}px` },
        height: layoutMetrics.topbarHeight,
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(['width', 'margin'], {
          duration: theme.transitions.duration.shorter,
        }),
        backgroundColor: alpha(topbarColors.bg, topbarColors.isDark ? 0.84 : 0.8),
        backgroundImage: 'none',
        borderBottom: `1px solid ${alpha(theme.palette.grey[500], topbarColors.isDark ? 0.2 : 0.12)}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: `0 8px 24px -20px ${alpha(theme.palette.common.black, 0.32)}`,
        overflow: 'visible',
      }}
    >
      <Tooltip title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
        <IconButton
          onClick={() => setSidebarOpen(!sidebarOpen)}
          sx={{
            position: 'absolute',
            left: 'calc(var(--app-small-control-height) / -2)',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: theme.zIndex.drawer + 2,
            width: 'var(--app-small-control-height)',
            height: 'var(--app-small-control-height)',
            borderRadius: `${theme.shape.borderRadius}px`,
            color: topbarColors.icon,
            bgcolor: alpha(topbarColors.floatingBg, topbarColors.isDark ? 0.88 : 0.82),
            border: `1px solid ${alpha(theme.palette.grey[500], topbarColors.isDark ? 0.24 : 0.16)}`,
            boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.12)}`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            display: { xs: 'none', lg: 'inline-flex' },
            '&:hover': {
              color: topbarColors.icon,
              bgcolor: alpha(topbarColors.floatingBg, topbarColors.isDark ? 0.94 : 0.9),
            },
          }}
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
        </IconButton>
      </Tooltip>

      <Toolbar
        sx={{
          minHeight: layoutMetrics.topbarHeight,
          px: { xs: 1.5, sm: 2, lg: 3 },
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
              width: 'var(--app-control-height)',
              height: 'var(--app-control-height)',
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
              width: 'var(--app-control-height)',
              height: 'var(--app-control-height)',
              color: topbarColors.icon,
              bgcolor: topbarColors.buttonBg,
              '&:hover': { bgcolor: topbarColors.buttonHover },
            }}
          >
            <TuneOutlined />
          </IconButton>

          <NotificationsPopover
            activeColor={topbarColors.icon}
            buttonSx={{
              color: topbarColors.icon,
              bgcolor: topbarColors.buttonBg,
              '&:hover': { bgcolor: topbarColors.buttonHover },
            }}
          />

          <AccountPopover
            buttonSx={{
              bgcolor: topbarColors.buttonBg,
              '&:hover': { bgcolor: topbarColors.buttonHover },
            }}
            avatarBorderColor={topbarColors.floatingBg}
          />
        </Stack>
      </Toolbar>
    </AppBar>
  )
}
