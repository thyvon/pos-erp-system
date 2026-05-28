'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material'
import { NavigateNext } from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import { useProductQuery } from '@/features/products/hooks'
import { useStockCountQuery, useStockTransferQuery } from '@/features/inventory/hooks'
import { useQuotationQuery, useSaleQuery, useSaleReturnQuery } from '@/features/sales/hooks'

const BREADCRUMB_KEY_MAP: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/sales': 'sales',
  '/quotations': 'quotations',
  '/sale-returns': 'saleReturns',
  '/cash-registers': 'cashRegisters',
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
  '/inventory/lots': 'stockLots',
  '/inventory/serials': 'stockSerials',
  '/inventory/transfers': 'transfers',
  '/inventory/adjustments': 'adjustments',
  '/inventory/counts': 'cycleCounts',
  '/accounting': 'accounting',
  '/accounting/journals': 'journalEntries',
  '/accounting/coa': 'chartOfAccounts',
  '/accounting/payment-accounts': 'paymentAccounts',
  '/accounting/exchange-rates': 'exchangeRates',
  '/accounting/fiscal-years': 'fiscalYears',
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

  if (pathnames[0] === 'accounting' && pathnames[1] === 'journals') {
    if (pathnames[2] === 'create' && index === 2) {
      return 'journalCreate'
    }
  }

  if (pathnames[0] === 'sales') {
    if (pathnames[1] === 'create' && index === 1) {
      return 'saleCreate'
    }

    if (pathnames[2] === 'edit' && index === 2) {
      return 'saleEdit'
    }
  }

  if (pathnames[0] === 'quotations') {
    if (pathnames[1] === 'create' && index === 1) {
      return 'quotationCreate'
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
  const isSaleRouteWithId = pathnames[0] === 'sales' && !!pathnames[1] && pathnames[1] !== 'create'
  const saleId = isSaleRouteWithId ? pathnames[1] : null
  const saleQuery = useSaleQuery(saleId)
  const isSaleReturnRouteWithId = pathnames[0] === 'sale-returns' && !!pathnames[1]
  const saleReturnId = isSaleReturnRouteWithId ? pathnames[1] : null
  const saleReturnQuery = useSaleReturnQuery(saleReturnId)
  const isQuotationRouteWithId = pathnames[0] === 'quotations' && !!pathnames[1] && pathnames[1] !== 'create'
  const quotationId = isQuotationRouteWithId ? pathnames[1] : null
  const quotationQuery = useQuotationQuery(quotationId)

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
            : isSaleRouteWithId && index === 1
            ? (saleQuery.data?.sale_number ?? t('breadcrumbs.saleDetail'))
            : isSaleReturnRouteWithId && index === 1
            ? (saleReturnQuery.data?.return_number ?? t('breadcrumbs.saleReturnDetail'))
            : isQuotationRouteWithId && index === 1
            ? (quotationQuery.data?.sale_number ?? t('breadcrumbs.quotationDetail'))
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
            || (isCountRouteWithId && index === 2)
            || (isSaleRouteWithId && index === 1)
            || (isSaleReturnRouteWithId && index === 1)
            || (isQuotationRouteWithId && index === 1) ? (
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
