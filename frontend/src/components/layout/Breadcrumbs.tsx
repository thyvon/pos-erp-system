'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material'
import { NavigateNext } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'
import { useProductQuery } from '@/features/products/hooks'
import { useStockCountQuery, useStockTransferQuery } from '@/features/inventory/hooks'

const BREADCRUMB_KEY_MAP: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/sales': 'sales',
  '/purchases': 'purchases',
  '/customers': 'customers',
  '/suppliers': 'suppliers',
  '/products': 'products',
  '/products/create': 'productCreate',
  '/categories': 'categories',
  '/units': 'units',
  '/variation-templates': 'variationTemplates',
  '/rack-locations': 'rackLocations',
  '/price-groups': 'priceGroups',
  '/inventory': 'inventory',
  '/inventory/stock': 'stockLevels',
  '/inventory/transfers': 'transfers',
  '/inventory/adjustments': 'adjustments',
  '/inventory/counts': 'cycleCounts',
  '/accounting': 'accounting',
  '/accounting/journals': 'journalEntries',
  '/accounting/coa': 'chartOfAccounts',
  '/expenses': 'expenses',
  '/reports': 'reports',
  '/users': 'users',
  '/branches': 'branches',
  '/warehouses': 'warehouses',
  '/settings': 'settings',
  '/custom-fields': 'customFields',
  '/tax-rates': 'taxRates',
  '/tax-groups': 'taxGroups',
  '/customer-groups': 'customerGroups',
  '/audit-logs': 'auditLogs',
}

function breadcrumbLabelKey(to: string, pathnames: string[], index: number) {
  if (pathnames[0] === 'products' && pathnames[2] === 'edit' && index === 2) {
    return 'productEdit'
  }

  if (pathnames[0] === 'inventory' && pathnames[1] === 'transfers') {
    if (pathnames[2] === 'create' && index === 2) {
      return 'transferCreate'
    }

    if (pathnames[3] === 'edit' && index === 3) {
      return 'transferEdit'
    }
  }

  if (pathnames[0] === 'inventory' && pathnames[1] === 'counts') {
    if (pathnames[2] === 'create' && index === 2) {
      return 'countCreate'
    }
  }

  return BREADCRUMB_KEY_MAP[to]
}

export default function Breadcrumbs() {
  const { t } = useTranslation('navigation')
  const pathname = usePathname()
  const pathnames = pathname.split('/').filter((x) => x)
  const isProductRouteWithId = pathnames[0] === 'products' && !!pathnames[1] && pathnames[1] !== 'create'
  const productId = isProductRouteWithId ? pathnames[1] : null
  const isTransferRouteWithId = pathnames[0] === 'inventory'
    && pathnames[1] === 'transfers'
    && !!pathnames[2]
    && pathnames[2] !== 'create'
  const transferId = isTransferRouteWithId ? pathnames[2] : null
  const isCountRouteWithId = pathnames[0] === 'inventory'
    && pathnames[1] === 'counts'
    && !!pathnames[2]
    && pathnames[2] !== 'create'
  const countId = isCountRouteWithId ? pathnames[2] : null
  const productQuery = useProductQuery(productId)
  const transferQuery = useStockTransferQuery(transferId)
  const countQuery = useStockCountQuery(countId)

  return (
    <Box sx={{ mb: 3 }}>
      <MuiBreadcrumbs
        separator={<NavigateNext fontSize="small" sx={{ color: 'text.disabled' }} />}
        aria-label="breadcrumb"
      >
        <Link
          component={NextLink}
          underline="hover"
          color="text.secondary"
          href="/dashboard"
          sx={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}
        >
          ERP
        </Link>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1
          const to = `/${pathnames.slice(0, index + 1).join('/')}`
          const labelKey = breadcrumbLabelKey(to, pathnames, index)
          const label = isProductRouteWithId && index === 1
            ? (productQuery.data?.name ?? t('breadcrumbs.productEdit'))
            : isTransferRouteWithId && index === 2
            ? (transferQuery.data?.reference_no ?? t('breadcrumbs.transferDetail'))
            : isCountRouteWithId && index === 2
            ? (countQuery.data?.reference_no ?? t('breadcrumbs.countDetail'))
            : labelKey
            ? t(`breadcrumbs.${labelKey}`)
            : value.charAt(0).toUpperCase() + value.slice(1)

          return last ? (
            <Typography
              key={to}
              variant="body2"
              sx={{ color: 'text.primary', fontWeight: 600 }}
            >
              {label}
            </Typography>
          ) : (isProductRouteWithId && index === 1)
            || (isTransferRouteWithId && index === 2)
            || (isCountRouteWithId && index === 2) ? (
            <Typography
              key={to}
              variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 500 }}
            >
              {label}
            </Typography>
          ) : (
            <Link
              key={to}
              component={NextLink}
              underline="hover"
              color="text.secondary"
              href={to}
              sx={{ fontWeight: 500 }}
            >
              {label}
            </Link>
          )
        })}
      </MuiBreadcrumbs>
    </Box>
  )
}
