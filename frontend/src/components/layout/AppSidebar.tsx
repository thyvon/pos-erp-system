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
  Stack,
} from '@mui/material'
import {
  DashboardOutlined,
  BusinessOutlined,
  PeopleOutlined,
  LocalShippingOutlined,
  Inventory2Outlined,
  CategoryOutlined,
  WarehouseOutlined,
  AccountBalanceOutlined,
  AccountBalanceWalletOutlined,
  PaymentsOutlined,
  PeopleAltOutlined,
  LockOutlined,
  SettingsOutlined,
  TuneOutlined,
  PercentOutlined,
  PointOfSaleOutlined,
  ReceiptLongOutlined,
  CalculateOutlined,
  CompareArrowsOutlined,
  GroupsOutlined,
  HistoryOutlined,
  AccountTreeOutlined,
  LocalOfferOutlined,
  LocalAtmOutlined,
  PaletteOutlined,
  StraightenOutlined,
  FactCheckOutlined,
  TrendingUpOutlined,
  ExpandLess,
  ExpandMore,
} from '@/components/ui/icons'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { buildLayoutSurfaceColors, getLayoutMetrics } from '@/theme'

interface NavItem {
  key: string
  path?: string
  icon: React.ReactNode
  adminOnly?: boolean
  superAdminOnly?: boolean
  permissions?: string[]
  children?: { key: string; path: string; permissions?: string[] }[]
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
    key: 'sales',
    items: [
      { key: 'pos', path: '/pos', icon: <PointOfSaleOutlined />, permissions: ['sales.create'] },
      { key: 'sales', path: '/sales', icon: <ReceiptLongOutlined />, permissions: ['sales.index'] },
      { key: 'quotations', path: '/quotations', icon: <ReceiptLongOutlined />, permissions: ['sales.index'] },
      { key: 'saleReturns', path: '/sale-returns', icon: <CompareArrowsOutlined />, permissions: ['sales.return'] },
      { key: 'cashRegisters', path: '/cash-registers', icon: <AccountBalanceWalletOutlined />, permissions: ['sales.index'] },
    ],
  },
  {
    key: 'purchasing',
    items: [
      { key: 'purchases', path: '/purchases', icon: <LocalShippingOutlined />, permissions: ['purchases.index'] },
      { key: 'purchaseReturns', path: '/purchase-returns', icon: <CompareArrowsOutlined />, permissions: ['purchases.return'] },
    ],
  },
  {
    key: 'contacts',
    items: [
      { key: 'customers', path: '/customers', icon: <PeopleOutlined />, permissions: ['customers.index'] },
      { key: 'suppliers', path: '/suppliers', icon: <LocalShippingOutlined />, permissions: ['suppliers.index'] },
      { key: 'customerGroups', path: '/customer-groups', icon: <GroupsOutlined />, permissions: ['customer_groups.index'] },
    ],
  },
  {
    key: 'catalog',
    items: [
      { key: 'products', path: '/products', icon: <Inventory2Outlined />, permissions: ['products.index'] },
      { key: 'categories', path: '/categories', icon: <CategoryOutlined />, permissions: ['categories.index'] },
      { key: 'brands', path: '/brands', icon: <LocalOfferOutlined />, permissions: ['brands.index'] },
      { key: 'units', path: '/units', icon: <StraightenOutlined />, permissions: ['units.index'] },
      { key: 'variationTemplates', path: '/variation-templates', icon: <PaletteOutlined />, permissions: ['variation_templates.index'] },
      { key: 'priceGroups', path: '/price-groups', icon: <LocalAtmOutlined />, permissions: ['price_groups.index'] },
      { key: 'taxRates', path: '/tax-rates', icon: <PercentOutlined />, permissions: ['tax_rates.index'] },
      { key: 'taxGroups', path: '/tax-groups', icon: <CalculateOutlined />, permissions: ['tax_groups.index'] },
    ],
  },
  {
    key: 'inventory',
    items: [
      { key: 'warehouses', path: '/warehouses', icon: <WarehouseOutlined />, permissions: ['warehouses.index'] },
      { key: 'rackLocations', path: '/rack-locations', icon: <StraightenOutlined />, permissions: ['rack_locations.index'] },
      { key: 'stockLevels', path: '/inventory/stock', icon: <TrendingUpOutlined />, permissions: ['inventory.index'] },
      { key: 'stockLots', path: '/inventory/lots', icon: <Inventory2Outlined />, permissions: ['inventory.index'] },
      { key: 'stockSerials', path: '/inventory/serials', icon: <ReceiptLongOutlined />, permissions: ['inventory.index'] },
      { key: 'transfers', path: '/inventory/transfers', icon: <CompareArrowsOutlined />, permissions: ['inventory.index'] },
      { key: 'adjustments', path: '/inventory/adjustments', icon: <TuneOutlined />, permissions: ['inventory.index'] },
      { key: 'cycleCounts', path: '/inventory/counts', icon: <FactCheckOutlined />, permissions: ['inventory.index'] },
    ],
  },
  {
    key: 'finance',
    items: [
      {
        key: 'accounting',
        icon: <AccountBalanceOutlined />,
        permissions: ['accounting.index', 'accounting.journals', 'accounting.coa', 'payments.create'],
        children: [
          { key: 'journalEntries', path: '/accounting/journals', permissions: ['accounting.index', 'accounting.journals'] },
          { key: 'chartOfAccounts', path: '/accounting/coa', permissions: ['accounting.index', 'accounting.coa', 'accounting.journals'] },
          { key: 'paymentAccounts', path: '/accounting/payment-accounts', permissions: ['accounting.index', 'payments.create'] },
          { key: 'exchangeRates', path: '/accounting/exchange-rates', permissions: ['accounting.index', 'payments.create'] },
          { key: 'fiscalYears', path: '/accounting/fiscal-years', permissions: ['accounting.index', 'accounting.journals'] },
        ],
      },
      { key: 'expenses', path: '/expenses', icon: <PaymentsOutlined />, permissions: ['expenses.index'] },
    ],
  },
  {
    key: 'foundation',
    items: [
      { key: 'branches', path: '/branches', icon: <AccountTreeOutlined />, permissions: ['branches.index'] },
      { key: 'businesses', path: '/businesses', icon: <BusinessOutlined />, superAdminOnly: true, permissions: ['businesses.index'] },
      { key: 'users', path: '/users', icon: <PeopleAltOutlined />, permissions: ['users.index'] },
      { key: 'roles', path: '/roles', icon: <LockOutlined />, permissions: ['roles.index'] },
      { key: 'customFields', path: '/custom-fields', icon: <TuneOutlined />, permissions: ['custom_fields.index'] },
      { key: 'settings', path: '/settings', icon: <SettingsOutlined />, permissions: ['settings.index'] },
    ],
  },
  {
    key: 'system',
    items: [
      { key: 'auditLogs', path: '/audit-logs', icon: <HistoryOutlined />, permissions: ['audit_logs.index'] },
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
  const { sidebarOpen, setSidebarOpen, mobileSidebarOpen, setMobileSidebarOpen, sidebarTheme, layoutSize } = useUIStore()
  const { user, isSuperAdmin } = useAuthStore()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({})
  const expanded = isDesktop ? sidebarOpen : true
  const layoutMetrics = getLayoutMetrics(layoutSize)
  const isCompactLayout = layoutSize === 'compact'
  const isDenseLayout = layoutSize === 'compact' || layoutSize === 'small'
  const navItemHeight = isCompactLayout ? 34 : isDenseLayout ? 38 : 42
  const childNavItemHeight = isCompactLayout ? 32 : isDenseLayout ? 36 : 40
  const logoSize = isCompactLayout ? 32 : isDenseLayout ? 36 : 40
  const drawerWidth = expanded ? layoutMetrics.sidebarWidth : layoutMetrics.sidebarCollapsedWidth
  const sidebarColors = buildLayoutSurfaceColors(theme, sidebarTheme)

  const hasAnyPermission = useMemo(() => {
    const permissions = new Set(user?.permissions ?? [])
    const superAdmin = isSuperAdmin()

    return (requiredPermissions?: string[]) => {
      if (superAdmin) return true
      if (!requiredPermissions || requiredPermissions.length === 0) return true

      return requiredPermissions.some((permission) => permissions.has(permission))
    }
  }, [isSuperAdmin, user?.permissions])

  const canViewItem = useMemo(() => {
    const superAdmin = isSuperAdmin()

    return (item: NavItem) => {
      if (item.superAdminOnly && !superAdmin) return false
      return hasAnyPermission(item.permissions)
    }
  }, [hasAnyPermission, isSuperAdmin])

  const visibleSections = useMemo(() => {
    return NAV_CONFIG
      .map((section) => ({
        ...section,
        items: section.items
          .filter((item) => canViewItem(item))
          .map((item) => ({
            ...item,
            children: item.children?.filter((child) => hasAnyPermission(child.permissions)),
          }))
          .filter((item) => !item.children || item.children.length > 0),
      }))
      .filter((section) => section.items.length > 0)
  }, [canViewItem, hasAnyPermission])

  const activeParentMenus = useMemo(() => {
    const nextOpenMenus: Record<string, boolean> = {}
    visibleSections.forEach((section) => {
      section.items.forEach((item) => {
        if (item.children?.some((child) => isRouteActive(pathname, child.path))) {
          nextOpenMenus[item.key] = true
        }
      })
    })
    return nextOpenMenus
  }, [pathname, visibleSections])

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

  const renderNavItem = (item: NavItem) => {
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
            minHeight: navItemHeight,
            px: expanded ? 1.25 : 0,
            py: isDenseLayout ? 0.5 : 0.75,
            borderRadius: 1,
            mb: 0.25,
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
              color: active ? sidebarColors.selectedText : sidebarColors.icon,
              '& svg': {
                width: isDenseLayout ? 20 : 22,
                height: isDenseLayout ? 20 : 22,
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
              {hasChildren && (
                isOpen
                  ? <ExpandLess sx={{ color: active ? sidebarColors.selectedText : sidebarColors.icon }} />
                  : <ExpandMore sx={{ color: active ? sidebarColors.selectedText : sidebarColors.icon }} />
              )}
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
                      minHeight: childNavItemHeight,
                      borderRadius: 1,
                      mb: 0.25,
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
        width: isDesktop ? drawerWidth : layoutMetrics.sidebarWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        overflow: 'visible',
        position: 'relative',
        '& .MuiDrawer-paper': {
          width: isDesktop ? drawerWidth : layoutMetrics.sidebarWidth,
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflow: 'visible',
          background: sidebarColors.paper,
          borderRight: `1px dashed ${sidebarColors.border}`,
          px: isDenseLayout ? 1 : 1.25,
        },
      }}
    >
      <Stack
        spacing={isDenseLayout ? 2 : 2.5}
        sx={{
          px: expanded ? 0.75 : 0,
          py: isDenseLayout ? 2 : 2.5,
          display: 'flex',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: 1.5,
            minHeight: logoSize,
          }}
        >
          <Box
            sx={{
              width: logoSize,
              height: logoSize,
              borderRadius: 1,
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: isDenseLayout ? 17 : 20,
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
        {visibleSections.map((section) => (
          <Box key={section.key} sx={{ mb: isDenseLayout ? 1.25 : 1.75 }}>
            {expanded && (
              <Typography
                variant="overline"
                sx={{
                  px: 1.25,
                  mb: 0.75,
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
