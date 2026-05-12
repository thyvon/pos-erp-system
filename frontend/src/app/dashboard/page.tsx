import { Container, Grid, Box } from '@mui/material'
import {
  ShoppingCart as SalesIcon,
  Inventory as InventoryIcon,
  People as CustomersIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material'
import MainLayout from '@/layouts/MainLayout'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'

export default function Dashboard() {
  return (
    <MainLayout>
      <Container maxWidth="lg">
        <PageHeader
          title="Dashboard"
          subtitle="Welcome back! Here's an overview of your business performance."
        />

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Sales Today"
              value="$12,345"
              icon={<SalesIcon />}
              color="primary"
              trend={{
                label: 'vs yesterday',
                percentage: 12,
                isPositive: true,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Orders"
              value="156"
              icon={<TrendingIcon />}
              color="success"
              trend={{
                label: 'this month',
                percentage: 8,
                isPositive: true,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Inventory Items"
              value="2,847"
              icon={<InventoryIcon />}
              color="warning"
              trend={{
                label: 'low stock',
                percentage: 3,
                isPositive: false,
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Customers"
              value="89"
              icon={<CustomersIcon />}
              color="info"
              trend={{
                label: 'new this month',
                percentage: 5,
                isPositive: true,
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </MainLayout>
  )
}