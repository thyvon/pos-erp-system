'use client'

import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Stack,
  InputBase,
  Tooltip,
  Container,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  AccountCircle,
  KeyboardArrowDown,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth'
import { styled, alpha } from '@mui/material/styles'
import { navConfig, NavSection } from './config-nav-dashboard'
import { dashboardLayoutVars } from './dashboard/css-vars'
import { LayoutSettings } from '@/components/settings/LayoutSettings'
import { SettingsButton } from '@/components/settings/SettingsButton'
import { useSettingsStore } from '@/stores/settings'

const getDrawerWidth = (layoutType: string, navWidth: string) => {
  if (layoutType === 'mini') return 88
  if (navWidth === 'compact') return 200
  return 300
}

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: '8px',
  backgroundColor: alpha(theme.palette.grey[500], 0.08),
  '&:hover': {
    backgroundColor: alpha(theme.palette.grey[500], 0.12),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}))

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.text.secondary,
}))

const StyledInputBase = styled(InputBase)((({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '20ch',
    },
    fontSize: '0.875rem',
  },
})))

interface MainLayoutProps {
  children: React.ReactNode
}


export default function MainLayout({ children }: MainLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { layoutType, navWidth, toggleCustomizer } = useSettingsStore()
  const drawerWidth = getDrawerWidth(layoutType, navWidth)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleLogout = () => {
    logout()
    handleMenuClose()
    router.push('/login')
  }

  const handleMenuClick = (path: string) => {
    router.push(path)
    if (isMobile) {
      setMobileOpen(false)
    }
  }

  const renderNavSection = (section: NavSection) => (
    <Box key={section.title} sx={{ mb: 2 }}>
      {section.title && layoutType !== 'mini' && (
        <Typography
          variant="overline"
          sx={{ px: 2.5, mb: 1, display: 'block', color: 'text.disabled', fontWeight: 700 }}
        >
          {section.title}
        </Typography>
      )}
      {section.items.map((item) => {
        const active = pathname === item.path
        return (
          <ListItem key={item.title} disablePadding sx={{ px: layoutType === 'mini' ? 0.5 : 1, mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleMenuClick(item.path)}
              sx={{
                borderRadius: '8px',
                color: active ? 'primary.main' : 'text.secondary',
                backgroundColor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                fontWeight: active ? 600 : 500,
                minHeight: layoutType === 'mini' ? 56 : 44,
                justifyContent: layoutType === 'mini' ? 'center' : 'flex-start',
                px: layoutType === 'mini' ? 1 : 2,
                '&:hover': {
                  backgroundColor: active
                    ? alpha(theme.palette.primary.main, 0.12)
                    : alpha(theme.palette.grey[500], 0.08),
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: layoutType === 'mini' ? 'auto' : 36,
                  color: active ? 'primary.main' : 'inherit',
                  mr: layoutType === 'mini' ? 0 : 0,
                }}
              >
                {item.icon}
              </ListItemIcon>
              {layoutType !== 'mini' && (
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    sx: { fontSize: '0.875rem', fontWeight: 'inherit' },
                  }}
                />
              )}
            </ListItemButton>
          </ListItem>
        )
      })}
    </Box>
  )

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo Section */}
      <Box sx={{ px: layoutType === 'mini' ? 1.5 : 2.5, py: 3, display: 'inline-flex', justifyContent: layoutType === 'mini' ? 'center' : 'flex-start' }}>
        <Box
          sx={{
            width: layoutType === 'mini' ? 32 : 40,
            height: layoutType === 'mini' ? 32 : 40,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00AB55 0%, #007B55 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 800,
            fontSize: layoutType === 'mini' ? '1rem' : '1.2rem',
            boxShadow: '0 8px 16px 0 rgba(0, 171, 85, 0.24)',
          }}
        >
          E
        </Box>
        {layoutType !== 'mini' && (
          <Box sx={{ ml: 1.5 }}>
            <Typography variant="subtitle1" sx={{ color: 'text.primary', lineHeight: 1.2 }}>
              ERP System
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Enterprise
            </Typography>
          </Box>
        )}
      </Box>

      {/* User Profile - Hidden in mini layout */}
      {layoutType !== 'mini' && (
        <Box
          sx={{
            mx: 2.5,
            mb: 3,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            borderRadius: '12px',
            backgroundColor: 'rgba(145, 158, 171, 0.12)',
          }}
        >
          <Avatar
            sx={{ width: 40, height: 40, border: '2px solid #fff' }}
          >
            {user?.name?.charAt(0) || 'U'}
          </Avatar>
          <Box sx={{ ml: 1.5, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap sx={{ color: 'text.primary' }}>
              {user?.name || 'User'}
            </Typography>
            <Typography variant="body2" noWrap sx={{ color: 'text.secondary' }}>
              {user?.role || 'Admin'}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ flexGrow: 1, py: 1 }}>
        {navConfig.map((section) => renderNavSection(section))}
      </Box>

      {/* Help Section - Hidden in mini layout */}
      {layoutType !== 'mini' && (
        <Box sx={{ p: 2.5, pb: 5 }}>
          <Box
            sx={{
              p: 2.5,
              borderRadius: '12px',
              backgroundColor: 'rgba(145, 158, 171, 0.12)',
              textAlign: 'center',
            }}
          >
            <Box
              component="img"
              src="https://minimals.cc/assets/illustrations/illustration_docs.svg"
              sx={{ width: 100, mb: 2, mx: 'auto' }}
            />
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Need help?
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              Please check our docs
            </Typography>
            <Typography
              variant="button"
              sx={{
                color: 'primary.main',
                fontWeight: 700,
                cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              Documentation
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: {
            md: `calc(100% - ${drawerWidth}px)`
          },
          ml: {
            md: `${drawerWidth}px`
          },
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(6px)',
          backgroundColor: theme.palette.mode === 'dark'
            ? 'rgba(18, 18, 18, 0.8)'
            : 'rgba(249, 250, 251, 0.8)',
          boxShadow: 'none',
          borderBottom: `dashed 1px ${theme.palette.divider}`,
          color: theme.palette.text.primary,
        }}
      >
        <Container maxWidth="xl">
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', height: 72, px: 0 }}>
            <Stack direction="row" alignItems="center">
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
              <Search>
                <SearchIconWrapper>
                  <SearchIcon />
                </SearchIconWrapper>
                <StyledInputBase
                  placeholder="Search..."
                  inputProps={{ 'aria-label': 'search' }}
                />
              </Search>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Tooltip title="Language">
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <LanguageIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Notifications">
                <IconButton size="small" sx={{ color: 'text.secondary' }}>
                  <NotificationsIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Box
                onClick={handleMenuOpen}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  ml: 1,
                  px: 1,
                  py: 0.5,
                  borderRadius: '8px',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: 'primary.main',
                    fontSize: '1rem',
                    fontWeight: 700,
                  }}
                >
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
                <KeyboardArrowDown sx={{ ml: 0.5, fontSize: 20, color: 'text.secondary' }} />
              </Box>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 200,
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" noWrap>
            {user?.name}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {user?.email}
          </Typography>
        </Box>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <MenuItem onClick={() => router.push('/dashboard')} sx={{ m: 1, borderRadius: '8px' }}>
          <DashboardIcon sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
          Home
        </MenuItem>
        <MenuItem onClick={() => router.push('/profile')} sx={{ m: 1, borderRadius: '8px' }}>
          <AccountCircle sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
          Profile
        </MenuItem>
        <MenuItem onClick={() => router.push('/settings')} sx={{ m: 1, borderRadius: '8px' }}>
          <SettingsIcon sx={{ mr: 1.5, fontSize: 20, color: 'text.secondary' }} />
          Settings
        </MenuItem>
        <Divider sx={{ borderStyle: 'dashed' }} />
        <MenuItem onClick={handleLogout} sx={{ m: 1, borderRadius: '8px', color: 'error.main' }}>
          <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
          Logout
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
          display: { md: 'block' }
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: {
            md: `calc(100% - ${drawerWidth}px)`
          },
        }}
      >
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            pt: dashboardLayoutVars(theme)['--layout-dashboard-content-pt'],
            pb: dashboardLayoutVars(theme)['--layout-dashboard-content-pb'],
            px: dashboardLayoutVars(theme)['--layout-dashboard-content-px'],
            mt: '72px',
          }}
        >
          {children}
        </Box>

        <Box
          component="footer"
          sx={{
            py: 3,
            px: 2,
            borderTop: 'dashed 1px #DFE3E8',
            textAlign: 'center',
            backgroundColor: 'background.default',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © 2026 ERP System. All rights reserved.
          </Typography>
        </Box>
      </Box>

      <SettingsButton onClick={() => setSettingsOpen(true)} />
      <LayoutSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Box>
  )
}
