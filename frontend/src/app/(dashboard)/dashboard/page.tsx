'use client'

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  alpha,
  useTheme,
} from '@mui/material'
import {
  Inventory2Outlined,
  PointOfSaleOutlined,
  ReceiptLongOutlined,
  TrendingUpOutlined,
} from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'

const stats = [
  {
    title: 'Sales Today',
    value: '$12,345',
    caption: '+8.2% from yesterday',
    icon: <PointOfSaleOutlined />,
    color: 'success',
  },
  {
    title: 'Open Orders',
    value: '123',
    caption: '18 awaiting payment',
    icon: <ReceiptLongOutlined />,
    color: 'info',
  },
  {
    title: 'Low Stock',
    value: '14',
    caption: 'Needs replenishment',
    icon: <Inventory2Outlined />,
    color: 'warning',
  },
] as const

export default function DashboardPage() {
  const theme = useTheme()

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Dashboard"
        description="Monitor daily operations across sales, inventory, and finance."
        actions={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined">Export</Button>
            <Button variant="contained">New sale</Button>
          </Stack>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(3, minmax(0, 1fr))',
          },
          gap: 3,
        }}
      >
        {stats.map((item) => (
          <Card key={item.title}>
            <CardContent>
              <Stack direction="row" sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="h3" sx={{ mb: 0.5 }}>
                    {item.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {item.caption}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: `${theme.shape.borderRadius}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: `${item.color}.main`,
                    bgcolor: alpha(theme.palette[item.color].main, 0.12),
                  }}
                >
                  {item.icon}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3,
        }}
      >
        <Card>
          <CardContent>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box>
                <Typography variant="subtitle1">Sales performance</Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Weekly movement summary
                </Typography>
              </Box>
              <Chip size="small" label="This week" />
            </Stack>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              {['Retail sales', 'Wholesale orders', 'Returns'].map((label, index) => (
                <Stack key={label} direction="row" sx={{ alignItems: 'center', gap: 2 }}>
                  <TrendingUpOutlined color={index === 2 ? 'warning' : 'success'} />
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {label}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Updated from current branch activity
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    {index === 2 ? '4' : `$${[8420, 3925][index]?.toLocaleString()}`}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              Quick actions
            </Typography>
            <Stack spacing={1}>
              {['Create sale', 'Receive stock', 'Record expense', 'Stock count'].map((action) => (
                <Button key={action} variant="outlined" fullWidth sx={{ justifyContent: 'flex-start' }}>
                  {action}
                </Button>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  )
}
