'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  useTheme,
  useMediaQuery,
  Tooltip,
  Collapse,
  alpha,
  Stack,
  IconButton,
} from '@mui/material'
import {
  DashboardOutlined,
  PeopleOutlined,
  LocalShippingOutlined,
  Inventory2Outlined,
  CategoryOutlined,
  WarehouseOutlined,
  AccountBalanceOutlined,
  PaymentsOutlined,
  PeopleAltOutlined,
  SettingsOutlined,
  TuneOutlined,
  PercentOutlined,
  CalculateOutlined,
  HistoryOutlined,
  AccountTreeOutlined,
  ExpandLess,
  ExpandMore,
  ChevronLeft,
  ChevronRight,
} from '@mui/icons-material'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '@/theme'

interface NavItem {
  key: string
  path?: string
  icon: React.ReactNode
  adminOnly?: boolean
  children?: { key: string; path: string }[]
}


interface NavSection {
  key: string
  items: NavItem[]
}

const NAV_CONFIG: NavSection[] = [
  {
    key: 'overview',
    items: [
      { key: 'dashboard', path: '/dashboard', icon: <DashboardOutlined /> },
    ],
  },
  {
    key: 'foundation',
    items: [
      { key: 'branches', path: '/branches', icon: <AccountTreeOutlined /> },
      { key: 'warehouses', path: '/warehouses', icon: <WarehouseOutlined /> },
      { key: 'users', path: '/users', icon: <PeopleAltOutlined />, adminOnly: true },
      { key: 'settings', path: '/settings', icon: <SettingsOutlined /> },
      { key: 'customFields', path: '/custom-fields', icon: <TuneOutlined /> },
    ],
  },
  {
    key: 'contacts',
    items: [
      { key: 'taxRates', path: '/tax-rates', icon: <PercentOutlined /> },
      { key: 'taxGroups', path: '/tax-groups', icon: <CalculateOutlined /> },
      { key: 'customers', path: '/customers', icon: <PeopleOutlined /> },
      { key: 'suppliers', path: '/suppliers', icon: <LocalShippingOutlined /> },
    ],
  },
  {
    key: 'inventory',
    items: [
      { key: 'products', path: '/products', icon: <Inventory2Outlined /> },
      { key: 'categories', path: '/categories', icon: <CategoryOutlined /> },
      {
        key: 'warehouse',
        icon: <WarehouseOutlined />,
        children: [
          { key: 'stockLevels', path: '/inventory/stock' },
          { key: 'transfers', path: '/inventory/transfers' },
          { key: 'adjustments', path: '/inventory/adjustments' },
          { key: 'cycleCounts', path: '/inventory/counts' },
        ],
      },
    ],
  },
  {
    key: 'finance',
    items: [
      {
        key: 'accounting',
        icon: <AccountBalanceOutlined />,
        children: [
          { key: 'journalEntries', path: '/accounting/journals' },
          { key: 'chartOfAccounts', path: '/accounting/coa' },
        ],
      },
      { key: 'expenses', path: '/expenses', icon: <PaymentsOutlined /> },
    ],
  },
  {
    key: 'system',
    items: [
      { key: 'auditLogs', path: '/audit-logs', icon: <HistoryOutlined />, adminOnly: true },
    ],
  },
]

const isRouteActive = (pathname: string, path?: string) => {
  if (!path) return false
  return pathname === path || pathname.startsWith(`${path}/`)
}

export default function AppSidebar() {
  const { t } = useTranslation('navigation')
  const pathname = usePathname()
  const router = useRouter()
  const theme = useTheme()
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'))
  const { sidebarOpen, setSidebarOpen, mobileSidebarOpen, setMobileSidebarOpen } = useUIStore()
  const { isAdmin } = useAuthStore()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const expanded = isDesktop ? sidebarOpen : true
  const drawerWidth = expanded ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH

  const activeParentMenus = useMemo(() => {
    const nextOpenMenus: Record<string, boolean> = {}
    NAV_CONFIG.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children?.some((child) => isRouteActive(pathname, child.path))) {
          nextOpenMenus[item.key] = true
        }
      })
    })
    return nextOpenMenus
  }, [pathname])

  const handleToggleMenu = (key: string) => {
    if (!sidebarOpen) {
      setSidebarOpen(true)
    }
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const navigateTo = (path: string) => {
    router.push(path)
    if (!isDesktop) setMobileSidebarOpen(false)
  }

  const renderNavItem = (item: NavItem & { adminOnly?: boolean }) => {
    if (item.adminOnly && !isAdmin()) return null

    const hasChildren = !!item.children
    const isOpen = activeParentMenus[item.key] || openMenus[item.key]
    const active = isRouteActive(pathname, item.path)
      || item.children?.some((child) => isRouteActive(pathname, child.path))
    const label = t(`items.${item.key}`)

    const content = (
      <ListItem key={item.key} disablePadding sx={{ display: 'block' }}>

        <ListItemButton
          onClick={() => (hasChildren ? handleToggleMenu(item.key) : navigateTo(item.path!))}
          selected={active}
          sx={{
            minHeight: 44,
            px: expanded ? 1.5 : 0,
            py: 1,
            borderRadius: 1,
            mb: 0.5,
            justifyContent: expanded ? 'initial' : 'center',
            color: active ? 'text.primary' : 'text.secondary',
            bgcolor: active ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
            '&:hover': {
              bgcolor: alpha(theme.palette.grey[500], 0.08),
            },
            '&.Mui-selected': {
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              color: 'primary.main',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
              },
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: expanded ? 1.5 : 0,
              justifyContent: 'center',
              color: active ? 'primary.main' : 'inherit',
              '& svg': {
                width: 22,
                height: 22,
              },
            }}
          >
            {item.icon}
          </ListItemIcon>
          {expanded && (
            <>
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: active ? 600 : 500 }}
                  >
                    {label}
                  </Typography>
                }
              />
              {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
            </>
          )}
        </ListItemButton>

        {hasChildren && expanded && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 3 }}>
              {item.children?.map((child) => {
                const childActive = isRouteActive(pathname, child.path)

                return (
                  <ListItemButton
                    key={child.path}
                    onClick={() => navigateTo(child.path)}
                    selected={childActive}
                    sx={{
                      minHeight: 40,
                      borderRadius: 1,
                      mb: 0.5,
                      color: childActive ? 'primary.main' : 'text.secondary',
                      bgcolor: childActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                      '&:hover': {
                        bgcolor: childActive
                          ? alpha(theme.palette.primary.main, 0.12)
                          : alpha(theme.palette.grey[500], 0.08),
                      },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: childActive ? 600 : 500 }}
                        >
                          {t(`items.${child.key}`)}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                )
              })}
            </List>
          </Collapse>
        )}
      </ListItem>
    )

    return expanded ? (
      content
    ) : (
      <Tooltip key={item.key} title={label} placement="right">
        {content}
      </Tooltip>
    )
  }

  return (
    <Drawer
      variant={isDesktop ? 'permanent' : 'temporary'}
      open={isDesktop || mobileSidebarOpen}
      onClose={() => setMobileSidebarOpen(false)}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: isDesktop ? drawerWidth : SIDEBAR_WIDTH,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        '& .MuiDrawer-paper': {
          width: isDesktop ? drawerWidth : SIDEBAR_WIDTH,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflow: 'visible',
          backgroundColor: theme.palette.background.default,
          borderRight: `1px dashed ${theme.palette.divider}`,
          px: 1.5,
        },
      }}
    >
      {isDesktop && (
        <Tooltip title={expanded ? 'Collapse' : 'Expand'} placement="right">
          <IconButton
            onClick={() => setSidebarOpen(!sidebarOpen)}
            size="small"
            sx={{
              position: 'absolute',
              top: 26,
              right: -13,
              zIndex: 2,
              width: 26,
              height: 26,
              color: 'text.secondary',
              bgcolor: 'background.paper',
              border: (theme) => `1px solid ${theme.palette.divider}`,
              boxShadow: (theme) => theme.shadows[2],
              '&:hover': {
                color: 'primary.main',
                bgcolor: 'background.paper',
              },
            }}
            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {expanded ? <ChevronLeft fontSize="small" /> : <ChevronRight fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}

      <Stack
        spacing={3}
        sx={{
          px: expanded ? 1 : 0,
          py: 3,
          display: 'flex',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: 1.5,
            minHeight: 40,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            E
          </Box>
          {expanded && (
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary' }}>
              ERP SYSTEM
            </Typography>
          )}
        </Box>
      </Stack>

      <Box
        sx={{
          flexGrow: 1,
          px: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        }}
      >
        {NAV_CONFIG.map((section) => (
          <Box key={section.key} sx={{ mb: 2 }}>
            {expanded && (
              <Typography
                variant="overline"
                sx={{
                  px: 1.5,
                  mb: 1,
                  display: 'block',
                  color: 'text.disabled',
                  fontWeight: 700,
                  letterSpacing: 0.4,
                }}
              >
                {t(`sections.${section.key}`)}
              </Typography>
            )}
            <List disablePadding>
              {section.items.map((item) => renderNavItem(item))}
            </List>
          </Box>
        ))}
      </Box>

    </Drawer>
  )
}
