'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography, Box } from '@mui/material'
import { NavigateNext } from '@mui/icons-material'
import { useTranslation } from 'react-i18next'

const BREADCRUMB_KEY_MAP: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/sales': 'sales',
  '/purchases': 'purchases',
  '/customers': 'customers',
  '/suppliers': 'suppliers',
  '/products': 'products',
  '/categories': 'categories',
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
  '/audit-logs': 'auditLogs',
}

export default function Breadcrumbs() {
  const { t } = useTranslation('navigation')
  const pathname = usePathname()
  const pathnames = pathname.split('/').filter((x) => x)

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
          const labelKey = BREADCRUMB_KEY_MAP[to]
          const label = labelKey
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
