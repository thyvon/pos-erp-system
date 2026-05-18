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
  GroupsOutlined,
  HistoryOutlined,
  AccountTreeOutlined,
  LocalOfferOutlined,
  LocalAtmOutlined,
  PaletteOutlined,
  StraightenOutlined,
  ExpandLess,
  ExpandMore,
} from '@/components/ui/icons'
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
      { key: 'customerGroups', path: '/customer-groups', icon: <GroupsOutlined /> },
      { key: 'customers', path: '/customers', icon: <PeopleOutlined /> },
      { key: 'suppliers', path: '/suppliers', icon: <LocalShippingOutlined /> },
    ],
  },
  {
    key: 'inventory',
    items: [
      { key: 'categories', path: '/categories', icon: <CategoryOutlined /> },
      { key: 'brands', path: '/brands', icon: <LocalOfferOutlined /> },
      { key: 'units', path: '/units', icon: <StraightenOutlined /> },
      { key: 'variationTemplates', path: '/variation-templates', icon: <PaletteOutlined /> },
      { key: 'rackLocations', path: '/rack-locations', icon: <WarehouseOutlined /> },
      { key: 'priceGroups', path: '/price-groups', icon: <LocalAtmOutlined /> },
      { key: 'products', path: '/products', icon: <Inventory2Outlined /> },
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
  const { sidebarOpen, setSidebarOpen, mobileSidebarOpen, setMobileSidebarOpen, sidebarTheme } = useUIStore()
  const { isAdmin } = useAuthStore()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const expanded = isDesktop ? sidebarOpen : true
  const drawerWidth = expanded ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED_WIDTH
  const resolvedSidebarTheme = sidebarTheme === 'inherit' ? theme.palette.mode : sidebarTheme
  const sidebarIsDark = resolvedSidebarTheme === 'dark'
  const sidebarColors = {
    bg: sidebarIsDark ? '#111827' : theme.palette.background.default,
    paper: sidebarIsDark ? '#111827' : theme.palette.background.default,
    border: sidebarIsDark ? alpha('#ffffff', 0.14) : theme.palette.divider,
    text: sidebarIsDark ? '#f9fafb' : theme.palette.text.primary,
    muted: sidebarIsDark ? alpha('#ffffff', 0.72) : theme.palette.text.secondary,
    disabled: sidebarIsDark ? alpha('#ffffff', 0.42) : theme.palette.text.disabled,
    hover: sidebarIsDark ? alpha('#ffffff', 0.08) : alpha(theme.palette.grey[500], 0.08),
    selected: sidebarIsDark ? alpha(theme.palette.primary.light, 0.18) : alpha(theme.palette.primary.main, 0.08),
    selectedHover: sidebarIsDark ? alpha(theme.palette.primary.light, 0.24) : alpha(theme.palette.primary.main, 0.12),
    selectedText: sidebarIsDark ? theme.palette.primary.light : theme.palette.primary.main,
  }

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
            color: active ? sidebarColors.text : sidebarColors.muted,
            bgcolor: active ? sidebarColors.selected : 'transparent',
            '&:hover': {
              bgcolor: sidebarColors.hover,
            },
            '&.Mui-selected': {
              bgcolor: sidebarColors.selected,
              color: sidebarColors.selectedText,
              '&:hover': {
                bgcolor: sidebarColors.selectedHover,
              },
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: expanded ? 1.5 : 0,
              justifyContent: 'center',
              color: active ? sidebarColors.selectedText : 'inherit',
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
                      color: childActive ? sidebarColors.selectedText : sidebarColors.muted,
                      bgcolor: childActive ? sidebarColors.selected : 'transparent',
                      '&:hover': {
                        bgcolor: childActive
                          ? sidebarColors.selectedHover
                          : sidebarColors.hover,
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
        overflow: 'visible',
        position: 'relative',
        '& .MuiDrawer-paper': {
          width: isDesktop ? drawerWidth : SIDEBAR_WIDTH,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflow: 'visible',
          backgroundColor: sidebarColors.paper,
          borderRight: `1px dashed ${sidebarColors.border}`,
          px: 1.5,
        },
      }}
    >
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
            <Typography variant="h6" sx={{ fontWeight: 800, color: sidebarColors.text }}>
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
                  color: sidebarColors.disabled,
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
