import React from 'react'
import {
  Dashboard as DashboardIcon,
  ShoppingCart as SalesIcon,
  Inventory as InventoryIcon,
  People as CustomersIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  AccountCircle as ProfileIcon,
  Help as HelpIcon,
} from '@mui/icons-material'

export interface NavItem {
  title: string
  path: string
  icon: React.ReactElement
  children?: NavItem[]
  roles?: string[]
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

export const navConfig: NavSection[] = [
  {
    items: [
      {
        title: 'Dashboard',
        path: '/dashboard',
        icon: <DashboardIcon />,
      },
      {
        title: 'Sales',
        path: '/sales',
        icon: <SalesIcon />,
      },
      {
        title: 'Inventory',
        path: '/inventory',
        icon: <InventoryIcon />,
      },
      {
        title: 'Customers',
        path: '/customers',
        icon: <CustomersIcon />,
      },
      {
        title: 'Reports',
        path: '/reports',
        icon: <ReportsIcon />,
      },
    ],
  },
  {
    title: 'Management',
    items: [
      {
        title: 'Settings',
        path: '/settings',
        icon: <SettingsIcon />,
      },
      {
        title: 'Profile',
        path: '/profile',
        icon: <ProfileIcon />,
      },
      {
        title: 'Help Center',
        path: '/help',
        icon: <HelpIcon />,
      },
    ],
  },
]
