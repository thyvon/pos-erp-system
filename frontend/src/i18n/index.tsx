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
import enCustomers from './en/customers'
import enCustomerGroups from './en/customerGroups'
import enSuppliers from './en/suppliers'
import enCategories from './en/categories'
import enBrands from './en/brands'
import enBranches from './en/branches'
import enWarehouses from './en/warehouses'
import enUsers from './en/users'
import enSettings from './en/settings'
import enCustomFields from './en/customFields'
import enTaxRates from './en/taxRates'
import enTaxGroups from './en/taxGroups'

import kmCommon from './km/common'
import kmAuth from './km/auth'
import kmNavigation from './km/navigation'
import kmDashboard from './km/dashboard'
import kmProducts from './km/products'
import kmSales from './km/sales'
import kmInventory from './km/inventory'
import kmCustomers from './km/customers'
import kmCustomerGroups from './km/customerGroups'
import kmSuppliers from './km/suppliers'
import kmCategories from './km/categories'
import kmBrands from './km/brands'
import kmBranches from './km/branches'
import kmWarehouses from './km/warehouses'
import kmUsers from './km/users'
import kmSettings from './km/settings'
import kmCustomFields from './km/customFields'
import kmTaxRates from './km/taxRates'
import kmTaxGroups from './km/taxGroups'

const resources = {
  en: {
    common: enCommon,
    auth: enAuth,
    navigation: enNavigation,
    dashboard: enDashboard,
    products: enProducts,
    sales: enSales,
    inventory: enInventory,
    customers: enCustomers,
    customerGroups: enCustomerGroups,
    suppliers: enSuppliers,
    categories: enCategories,
    brands: enBrands,
    branches: enBranches,
    warehouses: enWarehouses,
    users: enUsers,
    settings: enSettings,
    customFields: enCustomFields,
    taxRates: enTaxRates,
    taxGroups: enTaxGroups,
  },
  km: {
    common: kmCommon,
    auth: kmAuth,
    navigation: kmNavigation,
    dashboard: kmDashboard,
    products: kmProducts,
    sales: kmSales,
    inventory: kmInventory,
    customers: kmCustomers,
    customerGroups: kmCustomerGroups,
    suppliers: kmSuppliers,
    categories: kmCategories,
    brands: kmBrands,
    branches: kmBranches,
    warehouses: kmWarehouses,
    users: kmUsers,
    settings: kmSettings,
    customFields: kmCustomFields,
    taxRates: kmTaxRates,
    taxGroups: kmTaxGroups,
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
