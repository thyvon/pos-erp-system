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
  Typography,
} from '@mui/material'
import { ArrowBack } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { usePurchaseReturnQuery } from './hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { formatAppDate } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import type { ReactNode } from 'react'
import type { PurchaseReturnItem } from '@/types/purchase'

interface PurchaseReturnDetailPageProps {
  purchaseReturnId: string
}

function formatQuantity(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '-'
}

function itemLabel(item: PurchaseReturnItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function serialLabel(item: PurchaseReturnItem) {
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

export function PurchaseReturnDetailPage({ purchaseReturnId }: PurchaseReturnDetailPageProps) {
  const { t, i18n } = useTranslation(['purchases', 'common'])
  const purchaseReturnQuery = usePurchaseReturnQuery(purchaseReturnId)
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()
  const purchaseReturn = purchaseReturnQuery.data

  if (purchaseReturnQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (purchaseReturnQuery.isError) {
    return <Alert severity="error">{toAppApiError(purchaseReturnQuery.error).message}</Alert>
  }

  if (!purchaseReturn) {
    return <Alert severity="warning">{t('common:notFound')}</Alert>
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <NextLink href="/purchase-returns" passHref legacyBehavior>
          <IconButton component="a" size="small">
            <ArrowBack />
          </IconButton>
        </NextLink>
        <PageHeader
          title={purchaseReturn.return_number}
          meta={
            <Chip
              size="small"
              label={t('returns.status.completed')}
              color={purchaseReturn.status === 'completed' ? 'success' : 'default'}
              variant="outlined"
            />
          }
        />
      </Stack>

      <Card>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
            <DetailLine label={t('returns.fields.returnDate')} value={purchaseReturn.return_date ? formatAppDate(purchaseReturn.return_date, dateFormat, i18n.language) : '-'} />
            <DetailLine label={t('returns.fields.poNumber')} value={purchaseReturn.purchase?.purchase_number ?? '-'} />
            <DetailLine label={t('returns.fields.total')} value={formatMoney(purchaseReturn.total_amount, currencyFormatter)} />
            <DetailLine label={t('columns.branch')} value={purchaseReturn.branch?.name ?? '-'} />
            <DetailLine label={t('columns.warehouse')} value={purchaseReturn.warehouse?.name ?? '-'} />
            <DetailLine label={t('returns.fields.createdBy')} value={purchaseReturn.creator?.name ?? '-'} />
          </Box>
          {purchaseReturn.notes && (
            <Box sx={{ mt: 2 }}>
              <DetailLine label={t('returns.fields.notes')} value={purchaseReturn.notes} />
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('create.items.product')}</TableCell>
                  <TableCell align="right">{t('returns.fields.unitCost')}</TableCell>
                  <TableCell align="right">{t('returns.fields.qty')}</TableCell>
                  <TableCell align="right">{t('returns.fields.subtotal')}</TableCell>
                  <TableCell>{t('returns.fields.lot')}</TableCell>
                  <TableCell>{t('returns.fields.serials')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchaseReturn.items?.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">{itemLabel(item)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{formatMoney(item.unit_cost, currencyFormatter)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{formatQuantity(item.quantity)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{formatMoney(item.total_amount, currencyFormatter)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{item.lot?.lot_number ?? '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{serialLabel(item)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Stack>
  )
}
