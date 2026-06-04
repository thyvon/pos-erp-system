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
  const {
    sidebarOpen,
    setSidebarOpen,
    topbarTheme,
    toggleMobileSidebar,
    toggleSettings,
    toggleTheme,
    layoutSize,
  } = useUIStore()

  const layoutMetrics = getLayoutMetrics(layoutSize)
  const isDenseLayout = layoutSize === 'compact' || layoutSize === 'small'
  const actionButtonSize = isDenseLayout ? 36 : 40
  const collapseButtonSize = isDenseLayout ? 32 : 36
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
        background: topbarColors.bg,
        borderBottom: `1px solid ${topbarColors.border}`,
        overflow: 'visible',
      }}
    >
      <Tooltip title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
        <IconButton
          onClick={() => setSidebarOpen(!sidebarOpen)}
          sx={{
            position: 'absolute',
            left: -(collapseButtonSize / 2),
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: theme.zIndex.drawer + 2,
            width: collapseButtonSize,
            height: collapseButtonSize,
            borderRadius: 1,
            color: topbarColors.icon,
            bgcolor: topbarColors.floatingBg,
            border: `1px solid ${topbarColors.floatingBorder}`,
            boxShadow: (theme) => theme.shadows[2],
            display: { xs: 'none', lg: 'inline-flex' },
            '&:hover': {
              color: topbarColors.icon,
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
              width: actionButtonSize,
              height: actionButtonSize,
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
              width: actionButtonSize,
              height: actionButtonSize,
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
