'use client'

import { useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import {
  Avatar,
  Box,
  Chip,
  Collapse,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useMediaQuery,
  useTheme,
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
import type { ModuleKey } from '@/core/modules/moduleRegistry'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { buildLayoutSurfaceColors, getLayoutMetrics } from '@/theme'

interface NavChildItem {
  key: string
  path: string
  module?: ModuleKey
  permissions?: string[]
}

interface NavItem {
  key: string
  path?: string
  module?: ModuleKey
  icon: React.ReactNode
  adminOnly?: boolean
  superAdminOnly?: boolean
  permissions?: string[]
  children?: NavChildItem[]
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
      { key: 'pos', path: '/pos', module: 'sales', icon: <PointOfSaleOutlined />, permissions: ['sales.create'] },
      { key: 'sales', path: '/sales', module: 'sales', icon: <ReceiptLongOutlined />, permissions: ['sales.index'] },
      { key: 'quotations', path: '/quotations', module: 'sales', icon: <ReceiptLongOutlined />, permissions: ['sales.index'] },
      { key: 'saleReturns', path: '/sale-returns', module: 'sales', icon: <CompareArrowsOutlined />, permissions: ['sales.return'] },
      { key: 'cashRegisters', path: '/cash-registers', module: 'sales', icon: <AccountBalanceWalletOutlined />, permissions: ['sales.index'] },
    ],
  },
  {
    key: 'purchasing',
    items: [
      { key: 'purchases', path: '/purchases', module: 'purchases', icon: <LocalShippingOutlined />, permissions: ['purchases.index'] },
      { key: 'purchaseReturns', path: '/purchase-returns', module: 'purchases', icon: <CompareArrowsOutlined />, permissions: ['purchases.return'] },
    ],
  },
  {
    key: 'contacts',
    items: [
      { key: 'customers', path: '/customers', module: 'contacts', icon: <PeopleOutlined />, permissions: ['customers.index'] },
      { key: 'suppliers', path: '/suppliers', module: 'contacts', icon: <LocalShippingOutlined />, permissions: ['suppliers.index'] },
      { key: 'customerGroups', path: '/customer-groups', module: 'contacts', icon: <GroupsOutlined />, permissions: ['customer_groups.index'] },
    ],
  },
  {
    key: 'catalog',
    items: [
      { key: 'products', path: '/products', module: 'catalog', icon: <Inventory2Outlined />, permissions: ['products.index'] },
      { key: 'categories', path: '/categories', module: 'catalog', icon: <CategoryOutlined />, permissions: ['categories.index'] },
      { key: 'brands', path: '/brands', module: 'catalog', icon: <LocalOfferOutlined />, permissions: ['brands.index'] },
      { key: 'units', path: '/units', module: 'catalog', icon: <StraightenOutlined />, permissions: ['units.index'] },
      { key: 'variationTemplates', path: '/variation-templates', module: 'catalog', icon: <PaletteOutlined />, permissions: ['variation_templates.index'] },
      { key: 'priceGroups', path: '/price-groups', module: 'catalog', icon: <LocalAtmOutlined />, permissions: ['price_groups.index'] },
      { key: 'taxRates', path: '/tax-rates', module: 'catalog', icon: <PercentOutlined />, permissions: ['tax_rates.index'] },
      { key: 'taxGroups', path: '/tax-groups', module: 'catalog', icon: <CalculateOutlined />, permissions: ['tax_groups.index'] },
    ],
  },
  {
    key: 'inventory',
    items: [
      { key: 'warehouses', path: '/warehouses', module: 'inventory', icon: <WarehouseOutlined />, permissions: ['warehouses.index'] },
      { key: 'rackLocations', path: '/rack-locations', module: 'inventory', icon: <StraightenOutlined />, permissions: ['rack_locations.index'] },
      { key: 'stockLevels', path: '/inventory/stock', module: 'inventory', icon: <TrendingUpOutlined />, permissions: ['inventory.index'] },
      { key: 'stockLots', path: '/inventory/lots', module: 'inventory', icon: <Inventory2Outlined />, permissions: ['inventory.index'] },
      { key: 'stockSerials', path: '/inventory/serials', module: 'inventory', icon: <ReceiptLongOutlined />, permissions: ['inventory.index'] },
      { key: 'transfers', path: '/inventory/transfers', module: 'inventory', icon: <CompareArrowsOutlined />, permissions: ['inventory.index'] },
      { key: 'adjustments', path: '/inventory/adjustments', module: 'inventory', icon: <TuneOutlined />, permissions: ['inventory.index'] },
      { key: 'cycleCounts', path: '/inventory/counts', module: 'inventory', icon: <FactCheckOutlined />, permissions: ['inventory.index'] },
    ],
  },
  {
    key: 'finance',
    items: [
      {
        key: 'accounting',
        module: 'accounting',
        icon: <AccountBalanceOutlined />,
        permissions: ['accounting.index', 'accounting.journals', 'accounting.coa', 'payments.create'],
        children: [
          { key: 'journalEntries', path: '/accounting/journals', module: 'accounting', permissions: ['accounting.index', 'accounting.journals'] },
          { key: 'chartOfAccounts', path: '/accounting/coa', module: 'accounting', permissions: ['accounting.index', 'accounting.coa', 'accounting.journals'] },
          { key: 'paymentAccounts', path: '/accounting/payment-accounts', module: 'accounting', permissions: ['accounting.index', 'payments.create'] },
          { key: 'exchangeRates', path: '/accounting/exchange-rates', module: 'accounting', permissions: ['accounting.index', 'payments.create'] },
          { key: 'fiscalYears', path: '/accounting/fiscal-years', module: 'accounting', permissions: ['accounting.index', 'accounting.journals'] },
        ],
      },
      { key: 'expenses', path: '/expenses', module: 'expenses', icon: <PaymentsOutlined />, permissions: ['expenses.index'] },
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
      { key: 'reports', path: '/reports', module: 'reports', icon: <TrendingUpOutlined />, permissions: ['reports.index'] },
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
  const { user, business, isSuperAdmin, hasModule } = useAuthStore()
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
  const activeModuleCount = user?.enabled_modules?.length ?? 0
  const displayName = user?.full_name || [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'User'
  const roleLabel = isSuperAdmin() ? 'Super Admin' : user?.roles?.[0]?.replace(/_/g, ' ') || 'Team member'

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
      if (item.module && !hasModule(item.module)) return false
      return hasAnyPermission(item.permissions)
    }
  }, [hasAnyPermission, hasModule, isSuperAdmin])

  const visibleSections = useMemo(() => {
    return NAV_CONFIG
      .map((section) => ({
        ...section,
        items: section.items
          .filter((item) => canViewItem(item))
          .map((item) => ({
            ...item,
            children: item.children?.filter((child) => (
              (!child.module || hasModule(child.module)) && hasAnyPermission(child.permissions)
            )),
          }))
          .filter((item) => !item.children || item.children.length > 0),
      }))
      .filter((section) => section.items.length > 0)
  }, [canViewItem, hasAnyPermission, hasModule])

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
            position: 'relative',
            minHeight: navItemHeight,
            px: expanded ? 1.25 : 0,
            py: isDenseLayout ? 0.5 : 0.75,
            borderRadius: `${theme.shape.borderRadius}px`,
            mb: 0.35,
            justifyContent: expanded ? 'initial' : 'center',
            color: active ? sidebarColors.text : sidebarColors.muted,
            bgcolor: active ? alpha(sidebarColors.selected, sidebarColors.isDark ? 0.88 : 0.14) : 'transparent',
            overflow: 'hidden',
            transition: theme.transitions.create(['background-color', 'color', 'box-shadow', 'transform'], {
              duration: theme.transitions.duration.shortest,
            }),
            '&::before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 8,
              bottom: 8,
              width: active ? 3 : 0,
              borderRadius: 999,
              bgcolor: active ? sidebarColors.selected : 'transparent',
              transition: theme.transitions.create('width'),
            },
            '&:hover': {
              bgcolor: active ? alpha(sidebarColors.selected, sidebarColors.isDark ? 0.92 : 0.18) : sidebarColors.hover,
              transform: expanded ? 'translateX(2px)' : 'none',
            },
            '&.Mui-selected': {
              bgcolor: sidebarColors.isDark ? alpha(sidebarColors.selected, 0.9) : alpha(sidebarColors.selected, 0.16),
              color: sidebarColors.isDark ? sidebarColors.selectedText : sidebarColors.selected,
              boxShadow: `0 12px 24px -18px ${alpha(sidebarColors.selected, 0.9)}`,
              '&:hover': {
                bgcolor: sidebarColors.isDark ? sidebarColors.selectedHover : alpha(sidebarColors.selected, 0.22),
              },
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: expanded ? 1.5 : 0,
              justifyContent: 'center',
              color: active ? (sidebarColors.isDark ? sidebarColors.selectedText : sidebarColors.selected) : sidebarColors.icon,
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
                    sx={{ fontWeight: active ? 750 : 600, letterSpacing: active ? 0.1 : 0 }}
                  >
                    {label}
                  </Typography>
                }
              />
              {hasChildren && (
                isOpen
                  ? <ExpandLess sx={{ color: active ? (sidebarColors.isDark ? sidebarColors.selectedText : sidebarColors.selected) : sidebarColors.icon }} />
                  : <ExpandMore sx={{ color: active ? (sidebarColors.isDark ? sidebarColors.selectedText : sidebarColors.selected) : sidebarColors.icon }} />
              )}
            </>
          )}
        </ListItemButton>

        {hasChildren && expanded && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 3, py: 0.25 }}>
              {item.children?.map((child) => {
                const childActive = isRouteActive(pathname, child.path)

                return (
                  <ListItemButton
                    key={child.path}
                    onClick={() => navigateTo(child.path)}
                    selected={childActive}
                    sx={{
                      minHeight: childNavItemHeight,
                      borderRadius: `${theme.shape.borderRadius}px`,
                      mb: 0.25,
                      color: childActive ? (sidebarColors.isDark ? sidebarColors.selectedText : sidebarColors.selected) : sidebarColors.muted,
                      bgcolor: childActive ? alpha(sidebarColors.selected, sidebarColors.isDark ? 0.84 : 0.12) : 'transparent',
                      '&:hover': {
                        bgcolor: childActive
                          ? alpha(sidebarColors.selected, sidebarColors.isDark ? 0.9 : 0.18)
                          : sidebarColors.hover,
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        mr: 1.25,
                        bgcolor: childActive ? sidebarColors.selected : sidebarColors.disabled,
                      }}
                    />
                    <ListItemText
                      primary={
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: childActive ? 700 : 500 }}
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
          background: `linear-gradient(180deg, ${sidebarColors.paper} 0%, ${alpha(sidebarColors.paper, sidebarColors.isDark ? 0.96 : 0.9)} 100%)`,
          borderRight: `1px solid ${sidebarColors.border}`,
          px: isDenseLayout ? 1 : 1.25,
          boxShadow: `12px 0 40px -34px ${alpha(theme.palette.common.black, 0.55)}`,
          backdropFilter: 'saturate(180%) blur(18px)',
        },
      }}
    >
      <Stack
        spacing={isDenseLayout ? 1.5 : 2}
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
              borderRadius: `${theme.shape.borderRadius}px`,
              background: `linear-gradient(135deg, ${sidebarColors.selected} 0%, ${sidebarColors.selectedHover} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: sidebarColors.selectedText,
              fontWeight: 900,
              fontSize: isDenseLayout ? 17 : 20,
              boxShadow: `0 16px 28px -18px ${alpha(sidebarColors.selected, 0.9)}`,
            }}
          >
            E
          </Box>
          {expanded && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: sidebarColors.text, lineHeight: 1.1 }} noWrap>
                ERP System
              </Typography>
              <Typography variant="caption" sx={{ color: sidebarColors.muted, fontWeight: 600 }} noWrap>
                Business workspace
              </Typography>
            </Box>
          )}
        </Box>

        {expanded && (
          <Box
            sx={{
              p: 1.25,
              borderRadius: `${theme.shape.borderRadius}px`,
              border: `1px solid ${sidebarColors.border}`,
              bgcolor: sidebarColors.buttonBg,
            }}
          >
            <Typography variant="caption" sx={{ color: sidebarColors.disabled, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              Workspace
            </Typography>
            <Typography variant="body2" sx={{ color: sidebarColors.text, fontWeight: 800, mt: 0.25 }} noWrap>
              {business?.name ?? 'Default Business'}
            </Typography>
            {activeModuleCount > 0 && (
              <Chip
                size="small"
                label={`${activeModuleCount} modules active`}
                sx={{
                  mt: 1,
                  height: 22,
                  color: sidebarColors.isDark ? sidebarColors.selectedText : sidebarColors.selected,
                  bgcolor: sidebarColors.buttonHover,
                  fontWeight: 700,
                  '& .MuiChip-label': { px: 1 },
                }}
              />
            )}
          </Box>
        )}
      </Stack>

      <Divider sx={{ borderColor: sidebarColors.border, mx: expanded ? 1.25 : 0.75 }} />

      <Box
        sx={{
          flexGrow: 1,
          px: 0,
          pt: 1.5,
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
                  fontWeight: 800,
                  letterSpacing: 0.8,
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

      <Box sx={{ px: expanded ? 0.75 : 0, pb: isDenseLayout ? 1.5 : 2 }}>
        <Divider sx={{ borderColor: sidebarColors.border, mb: 1.25 }} />
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            gap: 1.25,
            p: expanded ? 1 : 0.5,
            borderRadius: `${theme.shape.borderRadius}px`,
            bgcolor: expanded ? sidebarColors.buttonBg : 'transparent',
          }}
        >
          <Avatar
            src={user?.avatar_url ?? undefined}
            sx={{
              width: isDenseLayout ? 30 : 34,
              height: isDenseLayout ? 30 : 34,
              bgcolor: sidebarColors.selected,
              color: sidebarColors.selectedText,
              fontWeight: 800,
              fontSize: 14,
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </Avatar>
          {expanded && (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ color: sidebarColors.text, fontWeight: 800 }} noWrap>
                {displayName}
              </Typography>
              <Typography variant="caption" sx={{ color: sidebarColors.muted, textTransform: 'capitalize' }} noWrap>
                {roleLabel}
              </Typography>
            </Box>
          )}
        </Stack>
      </Box>
    </Drawer>
  )
}
