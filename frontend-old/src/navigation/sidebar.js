const canAccessNavItem = (item, auth) => {
  if (auth.isSuperAdmin) {
    return true
  }

  const passesPermission = !item.permission || auth.can(item.permission)
  const passesAnyPermission = !item.permissionAny || auth.canAny(item.permissionAny)

  return passesPermission && passesAnyPermission
}

const filterSidebarItems = (items, auth) =>
  items
    .map((item) => {
      const filteredChildren = item.children?.length ? filterSidebarItems(item.children, auth) : []

      return {
        ...item,
        children: filteredChildren,
      }
    })
    .filter((item) => {
      const hasVisibleChildren = item.children?.length > 0

      if (hasVisibleChildren) {
        return true
      }

      return canAccessNavItem(item, auth)
    })

export const collectActiveSidebarParents = (items, isItemActive, activeKeys = {}) => {
  items.forEach((item) => {
    if (!item.children?.length) {
      return
    }

    const hasActiveChild = item.children.some((child) => isItemActive(child))

    if (hasActiveChild && item.key) {
      activeKeys[item.key] = true
    }

    collectActiveSidebarParents(item.children, isItemActive, activeKeys)
  })

  return activeKeys
}

export const createSidebarGroups = ({ t, auth, isSuperAdmin }) => {
  const statuses = {
    live: t('status.live'),
    planned: t('status.planned'),
    ready: t('status.ready'),
  }

  const readyClass = 'erp-badge-info'
  const plannedClass = 'erp-badge-neutral'
  const liveClass = 'erp-badge-success'

  const groups = [
    {
      label: t('layout.groups.overview'),
      items: [
        {
          key: 'dashboard',
          label: t('layout.nav.dashboard.label'),
          description: t('layout.nav.dashboard.description'),
          short: 'DB',
          to: '/dashboard',
          status: statuses.live,
          statusClass: liveClass,
          icon: 'fa-solid fa-gauge-high',
        },
      ],
    },
  ]

  if (isSuperAdmin) {
    groups.push({
      label: t('layout.groups.platform'),
      items: [
        {
          key: 'businesses',
          label: t('layout.nav.businesses.label'),
          description: t('layout.nav.businesses.description'),
          short: 'BS',
          to: '/admin/businesses',
          permission: 'businesses.index',
          status: statuses.ready,
          statusClass: readyClass,
          icon: 'fa-solid fa-briefcase',
        },
      ],
    })
  } else {
    groups.push({
      label: t('layout.groups.userManagement'),
      items: [
        {
          key: 'user-management',
          label: t('layout.groups.userManagement'),
          description: t('layout.groups.userManagement'),
          short: 'UM',
          status: statuses.ready,
          statusClass: readyClass,
          icon: 'fa-solid fa-users-gear',
          children: [
            {
              key: 'users',
              label: t('layout.nav.users.label'),
              description: t('layout.nav.users.description'),
              short: 'US',
              to: '/users',
              permission: 'users.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-users',
            },
            {
              key: 'roles',
              label: t('layout.nav.roles.label'),
              description: t('layout.nav.roles.description'),
              short: 'RL',
              to: '/roles',
              permission: 'roles.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-user-shield',
            },
          ],
        },
      ],
    })

    groups.push({
      label: t('layout.groups.foundation'),
      items: [
        {
          key: 'foundation',
          label: t('layout.groups.foundation'),
          description: t('layout.groups.foundation'),
          short: 'FD',
          status: statuses.ready,
          statusClass: readyClass,
          icon: 'fa-solid fa-building',
          children: [
            {
              key: 'branches',
              label: t('layout.nav.branches.label'),
              description: t('layout.nav.branches.description'),
              short: 'BR',
              to: '/branches',
              permission: 'branches.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-code-branch',
            },
            {
              key: 'warehouses',
              label: t('layout.nav.warehouses.label'),
              description: t('layout.nav.warehouses.description'),
              short: 'WH',
              to: '/warehouses',
              permission: 'warehouses.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-warehouse',
            },
            {
              key: 'settings',
              label: t('layout.nav.settings.label'),
              description: t('layout.nav.settings.description'),
              short: 'ST',
              to: '/settings',
              permissionAny: ['settings.index', 'businesses.index'],
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-gear',
            },
            {
              key: 'tax-rates',
              label: t('layout.nav.taxRates.label'),
              description: t('layout.nav.taxRates.description'),
              short: 'TX',
              to: '/tax-rates',
              permission: 'tax_rates.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-percent',
            },
            {
              key: 'tax-groups',
              label: t('layout.nav.taxGroups.label'),
              description: t('layout.nav.taxGroups.description'),
              short: 'TG',
              to: '/tax-groups',
              permission: 'tax_groups.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-layer-group',
            },
            {
              key: 'custom-fields',
              label: t('layout.nav.customFields.label'),
              description: t('layout.nav.customFields.description'),
              short: 'CF',
              to: '/custom-fields',
              permission: 'custom_fields.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-sliders',
            },
          ],
        },
      ],
    })

    groups.push({
      label: t('layout.nav.contacts.label'),
      items: [
        {
          key: 'contacts',
          label: t('layout.nav.contacts.label'),
          description: t('layout.nav.contacts.description'),
          short: 'CT',
          status: statuses.ready,
          statusClass: readyClass,
          icon: 'fa-solid fa-address-card',
          children: [
            {
              key: 'customer-groups',
              label: t('layout.nav.customerGroups.label'),
              description: t('layout.nav.customerGroups.description'),
              short: 'CG',
              to: '/customer-groups',
              permission: 'customer_groups.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-user-tag',
            },
            {
              key: 'customers',
              label: t('layout.nav.customers.label'),
              description: t('layout.nav.customers.description'),
              short: 'CU',
              to: '/customers',
              permission: 'customers.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-address-book',
            },
            {
              key: 'suppliers',
              label: t('layout.nav.suppliers.label'),
              description: t('layout.nav.suppliers.description'),
              short: 'SP',
              to: '/suppliers',
              permission: 'suppliers.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-truck-field',
            },
          ],
        },
      ],
    })

    groups.push({
      label: t('layout.groups.catalog'),
      items: [
        {
          key: 'catalog',
          label: t('layout.nav.catalog.label'),
          description: t('layout.nav.catalog.description'),
          short: 'CA',
          status: statuses.ready,
          statusClass: readyClass,
          icon: 'fa-solid fa-boxes-stacked',
          children: [
            {
              key: 'products',
              label: t('layout.nav.products.label'),
              description: t('layout.nav.products.description'),
              short: 'PR',
              to: '/catalog/products',
              permission: 'products.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-box-open',
            },
            {
              key: 'categories',
              label: t('layout.nav.categories.label'),
              description: t('layout.nav.categories.description'),
              short: 'CT',
              to: '/catalog/categories',
              permission: 'categories.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-sitemap',
            },
            {
              key: 'brands',
              label: t('layout.nav.brands.label'),
              description: t('layout.nav.brands.description'),
              short: 'BR',
              to: '/catalog/brands',
              permission: 'brands.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-award',
            },
            {
              key: 'units',
              label: t('layout.nav.units.label'),
              description: t('layout.nav.units.description'),
              short: 'UN',
              to: '/catalog/units',
              permission: 'units.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-ruler-combined',
            },
            {
              key: 'variation-templates',
              label: t('layout.nav.variationTemplates.label'),
              description: t('layout.nav.variationTemplates.description'),
              short: 'VT',
              to: '/catalog/variation-templates',
              permission: 'variation_templates.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-swatchbook',
            },
            {
              key: 'rack-locations',
              label: t('layout.nav.rackLocations.label'),
              description: t('layout.nav.rackLocations.description'),
              short: 'RL',
              to: '/catalog/rack-locations',
              permission: 'rack_locations.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-warehouse',
            },
            {
              key: 'price-groups',
              label: t('layout.nav.priceGroups.label'),
              description: t('layout.nav.priceGroups.description'),
              short: 'PG',
              to: '/catalog/price-groups',
              permission: 'price_groups.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-tags',
            },
          ],
        },
      ],
    })
  }

  if (auth.isSuperAdmin || auth.can('inventory.index')) {
    groups.push({
      label: t('layout.groups.inventory'),
      items: [
        {
          key: 'inventory',
          label: t('layout.nav.inventory.label'),
          description: t('layout.nav.inventory.description'),
          short: 'IV',
          status: statuses.ready,
          statusClass: readyClass,
          icon: 'fa-solid fa-layer-group',
          children: [
            {
              key: 'inventory-adjustments',
              label: t('layout.nav.inventoryAdjustments.label'),
              description: t('layout.nav.inventoryAdjustments.description'),
              short: 'AD',
              to: '/inventory/adjustments',
              permission: 'inventory.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-sliders',
            },
            {
              key: 'inventory-transfers',
              label: t('layout.nav.inventoryTransfers.label'),
              description: t('layout.nav.inventoryTransfers.description'),
              short: 'TR',
              to: '/inventory/transfers',
              permission: 'inventory.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-right-left',
            },
            {
              key: 'inventory-counts',
              label: t('layout.nav.inventoryCounts.label'),
              description: t('layout.nav.inventoryCounts.description'),
              short: 'CT',
              to: '/inventory/counts',
              permission: 'inventory.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-clipboard-check',
            },
            {
              key: 'inventory-lots',
              label: t('layout.nav.inventoryLots.label'),
              description: t('layout.nav.inventoryLots.description'),
              short: 'LT',
              to: '/inventory/lots',
              permission: 'inventory.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-boxes-stacked',
            },
            {
              key: 'inventory-serials',
              label: t('layout.nav.inventorySerials.label'),
              description: t('layout.nav.inventorySerials.description'),
              short: 'SR',
              to: '/inventory/serials',
              permission: 'inventory.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-barcode',
            },
          ],
        },
      ],
    })
  }

  if (auth.isSuperAdmin || auth.canAny(['accounting.index', 'accounting.journals', 'accounting.coa'])) {
    groups.push({
      label: t('layout.groups.accounting'),
      items: [
        {
          key: 'accounting',
          label: t('layout.nav.accounting.label'),
          description: t('layout.nav.accounting.description'),
          short: 'AC',
          status: statuses.ready,
          statusClass: readyClass,
          icon: 'fa-solid fa-book-open-reader',
          children: [
            {
              key: 'accounting-journals',
              label: t('layout.nav.journals.label'),
              description: t('layout.nav.journals.description'),
              short: 'JR',
              to: '/accounting/journals',
              permissionAny: ['accounting.index', 'accounting.journals'],
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-book',
            },
            {
              key: 'accounting-chart-of-accounts',
              label: t('layout.nav.chartOfAccounts.label'),
              description: t('layout.nav.chartOfAccounts.description'),
              short: 'CO',
              to: '/accounting/chart-of-accounts',
              permissionAny: ['accounting.index', 'accounting.coa'],
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-list-tree',
            },
            {
              key: 'accounting-payment-accounts',
              label: t('layout.nav.paymentAccounts.label'),
              description: t('layout.nav.paymentAccounts.description'),
              short: 'PA',
              to: '/accounting/payment-accounts',
              permission: 'accounting.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-wallet',
            },
            {
              key: 'accounting-fiscal-years',
              label: t('layout.nav.fiscalYears.label'),
              description: t('layout.nav.fiscalYears.description'),
              short: 'FY',
              to: '/accounting/fiscal-years',
              permission: 'accounting.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-calendar-days',
            },
          ],
        },
      ],
    })
  }

  if (auth.isSuperAdmin || auth.canAny(['sales.index', 'sales.create', 'sales.return'])) {
    groups.push({
      label: t('layout.nav.sales.label'),
      items: [
        {
          key: 'sales',
          label: t('layout.nav.sales.label'),
          description: t('layout.nav.sales.description'),
          short: 'SL',
          status: statuses.ready,
          statusClass: readyClass,
          icon: 'fa-solid fa-cash-register',
          children: [
            {
              key: 'sales-pos',
              label: t('layout.nav.pos.label'),
              description: t('layout.nav.pos.description'),
              short: 'PS',
              to: '/sales/pos',
              permission: 'sales.create',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-table-cells-large',
            },
            {
              key: 'sales-documents',
              label: t('layout.nav.salesDocuments.label'),
              description: t('layout.nav.salesDocuments.description'),
              short: 'SD',
              to: '/sales',
              permission: 'sales.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-file-invoice-dollar',
            },
            {
              key: 'sales-quotations',
              label: t('layout.nav.quotations.label'),
              description: t('layout.nav.quotations.description'),
              short: 'QT',
              to: '/sales/quotations',
              permission: 'sales.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-file-signature',
            },
            {
              key: 'sales-registers',
              label: t('layout.nav.cashRegisters.label'),
              description: t('layout.nav.cashRegisters.description'),
              short: 'CR',
              to: '/sales/registers',
              permission: 'sales.index',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-cash-register',
            },
            {
              key: 'sales-returns',
              label: t('layout.nav.saleReturns.label'),
              description: t('layout.nav.saleReturns.description'),
              short: 'RT',
              to: '/sales/returns',
              permission: 'sales.return',
              status: statuses.ready,
              statusClass: readyClass,
              icon: 'fa-solid fa-rotate-left',
            },
          ],
        },
      ],
    })
  }

  return groups
    .map((group) => ({
      ...group,
      items: filterSidebarItems(group.items, auth),
    }))
    .filter((group) => group.items.length > 0)
}
