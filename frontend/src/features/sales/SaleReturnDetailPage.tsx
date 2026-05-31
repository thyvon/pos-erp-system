'use client'

import NextLink from 'next/link'
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  Button,
} from '@mui/material'
import { ArrowBack, PointOfSaleOutlined } from '@/components/ui/icons'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { useSaleReturnQuery } from './hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import type { ReactNode } from 'react'
import type { SaleReturnItem } from '@/types/sales'

interface SaleReturnDetailPageProps {
  saleReturnId: string
}

function formatQuantity(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '-'
}

function itemLabel(item: SaleReturnItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function serialLabel(item: SaleReturnItem) {
  return item.serial_ids?.length ? item.serial_ids.join(', ') : '-'
}

function DetailLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 700, overflowWrap: 'anywhere' }}>
        {value || '-'}
      </Typography>
    </Box>
  )
}

export function SaleReturnDetailPage({ saleReturnId }: SaleReturnDetailPageProps) {
  const { t, i18n } = useTranslation(['sales', 'common'])
  const saleReturnQuery = useSaleReturnQuery(saleReturnId)
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()
  const saleReturn = saleReturnQuery.data

  if (saleReturnQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (saleReturnQuery.isError) {
    return <Alert severity="error">{toAppApiError(saleReturnQuery.error).message}</Alert>
  }

  if (!saleReturn) {
    return <Alert severity="warning">{t('returns.detail.notFound')}</Alert>
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Tooltip title={t('common:buttons.back')}>
            <IconButton component={NextLink} href="/sale-returns" size="small" aria-label={t('common:buttons.back')}>
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h4">{saleReturn.return_number}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('returns.detail.subtitle', {
                sale: saleReturn.sale?.sale_number ?? '-',
                date: formatAppDate(saleReturn.return_date, dateFormat, i18n.language),
              })}
            </Typography>
          </Box>
        </Stack>
        {saleReturn.sale?.id && (
          <Button component={NextLink} href={`/sales/${saleReturn.sale.id}`} variant="outlined" startIcon={<PointOfSaleOutlined />}>
            {t('returns.actions.viewSale')}
          </Button>
        )}
      </Stack>

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 }, '&:last-child': { pb: { xs: 2, md: 3 } } }}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                <Chip label={t(`returns.statuses.${saleReturn.status}`, { defaultValue: saleReturn.status })} color="primary" variant="outlined" />
                {saleReturn.refund_method && (
                  <Chip label={t(`returns.refundMethods.${saleReturn.refund_method}`)} variant="outlined" />
                )}
              </Stack>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('fields.createdAt')}: {formatAppDateTime(saleReturn.created_at, dateFormat, i18n.language)}
              </Typography>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
                gap: 2,
                borderTop: 1,
                borderBottom: 1,
                borderColor: 'divider',
                py: 2,
              }}
            >
              <DetailLine label={t('returns.fields.sale')} value={saleReturn.sale?.sale_number} />
              <DetailLine label={t('fields.branch')} value={saleReturn.branch?.name} />
              <DetailLine label={t('fields.warehouse')} value={saleReturn.warehouse?.name} />
              <DetailLine label={t('fields.createdBy')} value={saleReturn.creator?.name} />
              <DetailLine label={t('returns.fields.returnDate')} value={formatAppDate(saleReturn.return_date, dateFormat, i18n.language)} />
              <DetailLine label={t('returns.fields.items')} value={saleReturn.items_count.toLocaleString()} />
              <DetailLine label={t('returns.fields.total')} value={formatMoney(saleReturn.total_amount, currencyFormatter)} />
              <DetailLine label={t('returns.fields.refundMethod')} value={saleReturn.refund_method ? t(`returns.refundMethods.${saleReturn.refund_method}`) : '-'} />
            </Box>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 900, tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 56 }}>#</TableCell>
                    <TableCell sx={{ width: 300 }}>{t('items.product')}</TableCell>
                    <TableCell sx={{ width: 140 }} align="right">{t('items.quantity')}</TableCell>
                    <TableCell sx={{ width: 160 }}>{t('returns.columns.lot')}</TableCell>
                    <TableCell sx={{ width: 220 }}>{t('returns.columns.serials')}</TableCell>
                    <TableCell sx={{ width: 150 }} align="right">{t('items.unitPrice')}</TableCell>
                    <TableCell sx={{ width: 150 }} align="right">{t('items.total')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(saleReturn.items ?? []).map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{itemLabel(item)}</TableCell>
                      <TableCell align="right">{formatQuantity(item.quantity)}</TableCell>
                      <TableCell>{item.lot?.lot_number ?? '-'}</TableCell>
                      <TableCell>{serialLabel(item)}</TableCell>
                      <TableCell align="right">{formatMoney(item.unit_price, currencyFormatter)}</TableCell>
                      <TableCell align="right">{formatMoney(item.total_amount, currencyFormatter)}</TableCell>
                    </TableRow>
                  ))}
                  {(saleReturn.items ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        {t('returns.detail.noItems')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Box>
              <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800 }}>
                {t('fields.notes')}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.75, color: saleReturn.notes ? 'text.primary' : 'text.secondary' }}>
                {saleReturn.notes || t('detail.noNotes')}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
