'use client'

import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
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
} from '@mui/material'
import { ArrowBack, CheckCircleOutlined, Close, ReceiptLongOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { SaleCancelDialog } from './SaleCancelDialog'
import { QuotationConvertDialog } from './QuotationConvertDialog'
import { UnitConversionBadge } from '@/features/sales/components/UnitConversionBadge'
import { useCancelQuotationMutation, useConvertQuotationMutation, useQuotationQuery } from './hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import type { QuotationConvertPayload, SaleCancelPayload, SaleItem } from '@/types/sales'

interface QuotationDetailPageProps {
  quotationId: string
}

function formatQuantity(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : '-'
}

function itemLabel(item: SaleItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function taxLabel(item: SaleItem, formatter: Intl.NumberFormat) {
  const taxAmount = formatMoney(item.tax_amount, formatter)
  const taxRate = item.tax_rate ? Number(item.tax_rate) : null

  if (!taxRate || !Number.isFinite(taxRate)) return taxAmount

  return `${taxAmount} (${taxRate}${item.tax_rate_type === 'percentage' ? '%' : ''})`
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

export function QuotationDetailPage({ quotationId }: QuotationDetailPageProps) {
  const { t, i18n } = useTranslation(['sales', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [convertOpen, setConvertOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const quotationQuery = useQuotationQuery(quotationId)
  const convertQuotation = useConvertQuotationMutation()
  const cancelQuotation = useCancelQuotationMutation()
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()
  const quotation = quotationQuery.data
  const isActiveQuotation = quotation?.type === 'quotation' && quotation.status === 'quotation'
  const canConvert = !!quotation && isActiveQuotation && can('sales.create')
  const canCancel = !!quotation && isActiveQuotation && can('sales.cancel')

  const handleConvert = async (payload: QuotationConvertPayload) => {
    if (!quotation) return
    const result = await convertQuotation.mutateAsync({ id: quotation.id, payload })
    enqueueSnackbar(t('quotations.messages.converted'), { variant: 'success' })
    setConvertOpen(false)
    router.push(`/sales/${result.sale.id}`)
  }

  const handleCancel = async (payload: SaleCancelPayload) => {
    if (!quotation) return
    await cancelQuotation.mutateAsync({ id: quotation.id, payload })
    enqueueSnackbar(t('quotations.messages.cancelled'), { variant: 'success' })
    setCancelOpen(false)
  }

  if (quotationQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (quotationQuery.isError) {
    return <Alert severity="error">{toAppApiError(quotationQuery.error).message}</Alert>
  }

  if (!quotation) {
    return <Alert severity="warning">{t('quotations.detail.notFound')}</Alert>
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Tooltip title={t('common:buttons.back')}>
            <IconButton component={NextLink} href="/quotations" size="small" aria-label={t('common:buttons.back')}>
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h4">{quotation.sale_number}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('quotations.detail.subtitle', {
                customer: quotation.customer?.name ?? t('labels.walkInCustomer'),
                date: formatAppDate(quotation.sale_date, dateFormat, i18n.language),
              })}
            </Typography>
          </Box>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          {canConvert && (
            <Button startIcon={<CheckCircleOutlined />} variant="contained" onClick={() => setConvertOpen(true)}>
              {t('quotations.actions.convert')}
            </Button>
          )}
          {canCancel && (
            <Button startIcon={<Close />} variant="outlined" color="warning" onClick={() => setCancelOpen(true)}>
              {t('quotations.actions.cancel')}
            </Button>
          )}
        </Stack>
      </Stack>

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 3 }, '&:last-child': { pb: { xs: 2, md: 3 } } }}>
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                <ReceiptLongOutlined color="primary" />
                <Typography variant="h3" sx={{ lineHeight: 1 }}>
                  {t('types.quotation')}
                </Typography>
              </Stack>
              <Stack spacing={1} sx={{ alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                <Chip label={t(`statuses.${quotation.status}`, { defaultValue: quotation.status })} color="primary" variant="outlined" />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('fields.createdAt')}: {formatAppDateTime(quotation.created_at, dateFormat, i18n.language)}
                </Typography>
              </Stack>
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
              <DetailLine label={t('fields.customer')} value={quotation.customer?.name ?? t('labels.walkInCustomer')} />
              <DetailLine label={t('fields.branch')} value={quotation.branch?.name} />
              <DetailLine label={t('fields.warehouse')} value={quotation.warehouse?.name} />
              <DetailLine label={t('fields.createdBy')} value={quotation.creator?.name} />
              <DetailLine label={t('fields.saleDate')} value={formatAppDate(quotation.sale_date, dateFormat, i18n.language)} />
              <DetailLine label={t('fields.dueDate')} value={formatAppDate(quotation.due_date, dateFormat, i18n.language)} />
              <DetailLine label={t('fields.priceGroup')} value={quotation.price_group?.name} />
              <DetailLine label={t('fields.total')} value={formatMoney(quotation.total_amount, currencyFormatter)} />
            </Box>

            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 920, tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 56 }}>#</TableCell>
                    <TableCell sx={{ width: 320 }}>{t('items.product')}</TableCell>
                    <TableCell sx={{ width: 120 }} align="right">{t('items.quantity')}</TableCell>
                    <TableCell sx={{ width: 110 }}>{t('items.unit')}</TableCell>
                    <TableCell sx={{ width: 140 }} align="right">{t('items.unitPrice')}</TableCell>
                    <TableCell sx={{ width: 140 }} align="right">{t('items.discount')}</TableCell>
                    <TableCell sx={{ width: 150 }} align="right">{t('items.tax')}</TableCell>
                    <TableCell sx={{ width: 150 }} align="right">{t('items.total')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(quotation.items ?? []).map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle2">{itemLabel(item)}</Typography>
                          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {item.variation?.sku ?? item.product?.sku ?? '-'}
                            </Typography>
                            {item.sub_unit_id && item.sub_unit?.conversion_factor ? (
                              <UnitConversionBadge
                                conversionFactor={item.sub_unit.conversion_factor}
                                baseUnitLabel={item.product?.unit?.short_name ?? ''}
                                subUnitLabel={item.sub_unit.short_name ?? ''}
                                quantity={Number(item.quantity ?? 0)}
                              />
                            ) : item.product?.unit?.short_name ? (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                · {item.product.unit.short_name}
                              </Typography>
                            ) : null}
                          </Stack>
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{formatQuantity(item.quantity)}</TableCell>
                      <TableCell>{item.sub_unit?.short_name ?? item.product?.unit?.short_name ?? '-'}</TableCell>
                      <TableCell align="right">{formatMoney(item.unit_price, currencyFormatter)}</TableCell>
                      <TableCell align="right">{formatMoney(item.discount_amount, currencyFormatter)}</TableCell>
                      <TableCell align="right">{taxLabel(item, currencyFormatter)}</TableCell>
                      <TableCell align="right">{formatMoney(item.total_amount, currencyFormatter)}</TableCell>
                    </TableRow>
                  ))}
                  {(quotation.items ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        {t('detail.noItems')}
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
              <Typography variant="body2" sx={{ mt: 0.75, color: quotation.notes ? 'text.primary' : 'text.secondary' }}>
                {quotation.notes || t('detail.noNotes')}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {convertOpen && (
        <QuotationConvertDialog
          open={convertOpen}
          quotation={quotation}
          isSaving={convertQuotation.isPending}
          onClose={() => setConvertOpen(false)}
          onSubmit={handleConvert}
        />
      )}
      <SaleCancelDialog
        open={cancelOpen}
        sale={quotation}
        isSaving={cancelQuotation.isPending}
        title={t('quotations.cancel.title')}
        message={t('quotations.cancel.message', { number: quotation.sale_number })}
        confirmText={t('quotations.actions.cancel')}
        onClose={() => setCancelOpen(false)}
        onSubmit={handleCancel}
      />
    </Stack>
  )
}
