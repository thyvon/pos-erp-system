import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { useUIStore } from '@/stores/uiStore'
import { useEffect } from 'react'

// Import translations
import enCommon from './en/common'
import enAuth from './en/auth'
import enNavigation from './en/navigation'
import enDashboard from './en/dashboard'
import enProducts from './en/products'
import enSales from './en/sales'
import enInventory from './en/inventory'
import enAccounting from './en/accounting'
import enCustomers from './en/customers'
import enCustomerGroups from './en/customerGroups'
import enSuppliers from './en/suppliers'
import enCategories from './en/categories'
import enBrands from './en/brands'
import enUnits from './en/units'
import enVariationTemplates from './en/variationTemplates'
import enRackLocations from './en/rackLocations'
import enWarehouseProductSettings from './en/warehouseProductSettings'
import enPriceGroups from './en/priceGroups'
import enBranches from './en/branches'
import enWarehouses from './en/warehouses'
import enUsers from './en/users'
import enRoles from './en/roles'
import enBusinesses from './en/businesses'
import enSettings from './en/settings'
import enCustomFields from './en/customFields'
import enTaxRates from './en/taxRates'
import enTaxGroups from './en/taxGroups'
import enPurchases from './en/purchases'
import enExpenses from './en/expenses'
import enReports from './en/reports'

import kmCommon from './km/common'
import kmAuth from './km/auth'
import kmNavigation from './km/navigation'
import kmDashboard from './km/dashboard'
import kmProducts from './km/products'
import kmSales from './km/sales'
import kmInventory from './km/inventory'
import kmAccounting from './km/accounting'
import kmCustomers from './km/customers'
import kmCustomerGroups from './km/customerGroups'
import kmSuppliers from './km/suppliers'
import kmCategories from './km/categories'
import kmBrands from './km/brands'
import kmUnits from './km/units'
import kmVariationTemplates from './km/variationTemplates'
import kmRackLocations from './km/rackLocations'
import kmWarehouseProductSettings from './km/warehouseProductSettings'
import kmPriceGroups from './km/priceGroups'
import kmBranches from './km/branches'
import kmWarehouses from './km/warehouses'
import kmUsers from './km/users'
import kmRoles from './km/roles'
import kmBusinesses from './km/businesses'
import kmSettings from './km/settings'
import kmCustomFields from './km/customFields'
import kmTaxRates from './km/taxRates'
import kmTaxGroups from './km/taxGroups'
import kmPurchases from './km/purchases'
import kmExpenses from './km/expenses'
import kmReports from './km/reports'

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    navigation: enNavigation,
    dashboard: enDashboard,
    products: enProducts,
    sales: enSales,
    inventory: enInventory,
    accounting: enAccounting,
    customers: enCustomers,
    customerGroups: enCustomerGroups,
    suppliers: enSuppliers,
    categories: enCategories,
    brands: enBrands,
    units: enUnits,
    variationTemplates: enVariationTemplates,
    rackLocations: enRackLocations,
    warehouseProductSettings: enWarehouseProductSettings,
    priceGroups: enPriceGroups,
    branches: enBranches,
    warehouses: enWarehouses,
    users: enUsers,
    roles: enRoles,
    businesses: enBusinesses,
    settings: enSettings,
    customFields: enCustomFields,
    taxRates: enTaxRates,
    taxGroups: enTaxGroups,
    purchases: enPurchases,
    expenses: enExpenses,
    reports: enReports,
  },
  km: {
    common: kmCommon,
    auth: kmAuth,
    navigation: kmNavigation,
    dashboard: kmDashboard,
    products: kmProducts,
    sales: kmSales,
    inventory: kmInventory,
    accounting: kmAccounting,
    customers: kmCustomers,
    customerGroups: kmCustomerGroups,
    suppliers: kmSuppliers,
    categories: kmCategories,
    brands: kmBrands,
    units: kmUnits,
    variationTemplates: kmVariationTemplates,
    rackLocations: kmRackLocations,
    warehouseProductSettings: kmWarehouseProductSettings,
    priceGroups: kmPriceGroups,
    branches: kmBranches,
    warehouses: kmWarehouses,
    users: kmUsers,
    roles: kmRoles,
    businesses: kmBusinesses,
    settings: kmSettings,
    customFields: kmCustomFields,
    taxRates: kmTaxRates,
    taxGroups: kmTaxGroups,
    purchases: kmPurchases,
    expenses: kmExpenses,
    reports: kmReports,
  },
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    const { language } = useUIStore.getState()
    i18n.changeLanguage(language)

    const unsubscribeUI = useUIStore.subscribe((state) => {
      i18n.changeLanguage(state.language)
    })

    return () => {
      unsubscribeUI()
    }
  }, [])

  return <>{children}</>
}

export default i18n
