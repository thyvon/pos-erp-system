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
} from '@mui/icons-material'

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
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h4">Dashboard</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            Monitor daily operations across sales, inventory, and finance.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined">Export</Button>
          <Button variant="contained">New sale</Button>
        </Stack>
      </Stack>

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
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
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
                    borderRadius: 1.5,
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
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
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
          <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
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
