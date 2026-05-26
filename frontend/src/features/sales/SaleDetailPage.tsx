'use client'

import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  CircularProgress,
  Divider,
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
import { ArrowBack, CheckCircleOutlined, Close, DeleteOutlined, EditOutlined, PaymentsOutlined, PointOfSaleOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SaleCancelDialog } from './SaleCancelDialog'
import { SalePaymentDialog } from './SalePaymentDialog'
import {
  useCancelSaleMutation,
  useCompleteSaleMutation,
  useConfirmSaleMutation,
  useDeleteSaleMutation,
  useRecordSalePaymentMutation,
  useSaleQuery,
} from './hooks'
import { useDefaultExchangeRateQuery, usePaymentAccountsQuery } from '@/features/accounting/hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import type { Sale, SaleCancelPayload, SaleItem, SalePayment, SalePaymentPayload } from '@/types/sales'

interface SaleDetailPageProps {
  saleId: string
}

function formatMoney(value: number | string | null | undefined, formatter: Intl.NumberFormat) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? formatter.format(numeric) : '-'
}

function formatQuantity(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-'
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(value)
}

function itemLabel(item: SaleItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function outstandingAmount(sale: Sale) {
  return Math.max(Number(sale.total_amount ?? 0) - Number(sale.paid_amount ?? 0), 0)
}

function paymentAccountLabel(payment: SalePayment) {
  return payment.payment_account
    ? [payment.payment_account.name, payment.payment_account.type].filter(Boolean).join(' / ')
    : payment.payment_account_id
}

function paymentEnteredAmount(payment: SalePayment) {
  if (payment.payment_currency === 'KHR' && payment.payment_amount) {
    return `KHR ${Number(payment.payment_amount).toLocaleString()}`
  }

  return `USD ${Number(payment.payment_amount ?? payment.amount ?? 0).toFixed(2)}`
}

export function SaleDetailPage({ saleId }: SaleDetailPageProps) {
  const { t, i18n } = useTranslation(['sales', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [completeOpen, setCompleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const saleQuery = useSaleQuery(saleId)
  const paymentAccountsQuery = usePaymentAccountsQuery({ status: 'active', per_page: 100 })
  const defaultExchangeRateQuery = useDefaultExchangeRateQuery('USD', 'KHR')
  const confirmSale = useConfirmSaleMutation()
  const completeSale = useCompleteSaleMutation()
  const cancelSale = useCancelSaleMutation()
  const deleteSale = useDeleteSaleMutation()
  const recordPayment = useRecordSalePaymentMutation()
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()
  const sale = saleQuery.data
  const paymentAccounts = paymentAccountsQuery.data?.data ?? []
  const isMutating = confirmSale.isPending || completeSale.isPending || cancelSale.isPending || deleteSale.isPending || recordPayment.isPending

  const isEditableStatus = !!sale && ['draft', 'quotation', 'suspended', 'confirmed'].includes(sale.status)
  const canEdit = !!sale && can('sales.edit')
  const canDelete = !!sale && can('sales.delete') && isEditableStatus
  const canConfirm = !!sale && can('sales.confirm') && ['draft', 'suspended'].includes(sale.status)
  const canComplete = !!sale && can('sales.complete') && ['draft', 'suspended', 'confirmed'].includes(sale.status)
  const canCancel = !!sale && can('sales.cancel') && ['draft', 'quotation', 'suspended', 'confirmed'].includes(sale.status)
  const canPay = !!sale
    && can('payments.create')
    && sale.status === 'completed'
    && ['unpaid', 'partial'].includes(sale.payment_status)

  const handleConfirm = async () => {
    if (!sale) return
    await confirmSale.mutateAsync(sale.id)
    enqueueSnackbar(t('messages.confirmed'), { variant: 'success' })
    setConfirmOpen(false)
  }

  const handleComplete = async () => {
    if (!sale) return
    await completeSale.mutateAsync(sale.id)
    enqueueSnackbar(t('messages.completed'), { variant: 'success' })
    setCompleteOpen(false)
  }

  const handleCancel = async (payload: SaleCancelPayload) => {
    if (!sale) return
    await cancelSale.mutateAsync({ id: sale.id, payload })
    enqueueSnackbar(t('messages.cancelled'), { variant: 'success' })
    setCancelOpen(false)
  }

  const handlePayment = async (payload: SalePaymentPayload) => {
    if (!sale) return
    await recordPayment.mutateAsync({ id: sale.id, payload })
    enqueueSnackbar(t('messages.paymentRecorded'), { variant: 'success' })
    setPaymentOpen(false)
  }

  const handleDelete = async () => {
    if (!sale) return
    await deleteSale.mutateAsync(sale.id)
    enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
    setDeleteOpen(false)
    router.push('/sales')
  }

  if (saleQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (saleQuery.isError) {
    return <Alert severity="error">{toAppApiError(saleQuery.error).message}</Alert>
  }

  if (!sale) {
    return <Alert severity="warning">{t('detail.notFound')}</Alert>
  }

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Stack spacing={3}>
            <Box>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={2}
                sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Tooltip title={t('common:buttons.back')}>
                    <IconButton component={NextLink} href="/sales" size="small" aria-label={t('common:buttons.back')}>
                      <ArrowBack />
                    </IconButton>
                  </Tooltip>
                  <Box>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <PointOfSaleOutlined color="primary" />
                      <Typography variant="h4">{sale.sale_number}</Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                      {t('detail.subtitle', {
                        customer: sale.customer?.name ?? t('labels.walkInCustomer'),
                        date: formatAppDate(sale.sale_date, dateFormat, i18n.language),
                      })}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  {canEdit && (
                    <Button
                      component={NextLink}
                      href={sale.type === 'pos_sale' ? `/pos/${sale.id}/edit` : `/sales/${sale.id}/edit`}
                      startIcon={<EditOutlined />}
                      variant="outlined"
                    >
                      {t('common:buttons.edit')}
                    </Button>
                  )}
                  {canPay && (
                    <Button startIcon={<PaymentsOutlined />} variant="contained" onClick={() => setPaymentOpen(true)}>
                      {t('actions.recordPayment')}
                    </Button>
                  )}
                  {canConfirm && (
                    <Button startIcon={<CheckCircleOutlined />} variant="outlined" onClick={() => setConfirmOpen(true)}>
                      {t('actions.confirm')}
                    </Button>
                  )}
                  {canComplete && (
                    <Button startIcon={<CheckCircleOutlined />} variant="contained" color="success" onClick={() => setCompleteOpen(true)}>
                      {t('actions.complete')}
                    </Button>
                  )}
                  {canCancel && (
                    <Button startIcon={<Close />} variant="outlined" color="warning" onClick={() => setCancelOpen(true)}>
                      {t('actions.cancelSale')}
                    </Button>
                  )}
                  {canDelete && (
                    <Button startIcon={<DeleteOutlined />} variant="outlined" color="error" onClick={() => setDeleteOpen(true)}>
                      {t('common:buttons.delete')}
                    </Button>
                  )}
                </Stack>
              </Stack>

              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', mt: 2.5 }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {sale.notes || t('detail.noNotes')}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: { md: 'flex-end' } }}>
                  <Chip label={t(`statuses.${sale.status}`, { defaultValue: sale.status })} variant="outlined" />
                  <Chip label={t(`paymentStatuses.${sale.payment_status}`, { defaultValue: sale.payment_status })} variant="outlined" />
                  {sale.delivery_status && (
                    <Chip label={t(`deliveryStatuses.${sale.delivery_status}`, { defaultValue: sale.delivery_status })} variant="outlined" />
                  )}
                </Stack>
              </Stack>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
                  gap: 2,
                  mt: 2.5,
                }}
              >
                {[
                  [t('fields.customer'), sale.customer?.name ?? t('labels.walkInCustomer')],
                  [t('fields.branch'), sale.branch?.name ?? '-'],
                  [t('fields.warehouse'), sale.warehouse?.name ?? '-'],
                  [t('fields.createdBy'), sale.creator?.name ?? '-'],
                  [t('fields.saleDate'), formatAppDate(sale.sale_date, dateFormat, i18n.language)],
                  [t('fields.dueDate'), formatAppDate(sale.due_date, dateFormat, i18n.language)],
                  [t('fields.cashRegister'), sale.cash_register_session?.cash_register?.name ?? '-'],
                  [t('fields.createdAt'), formatAppDateTime(sale.created_at, dateFormat, i18n.language)],
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {label}
                    </Typography>
                    <Typography variant="body2">{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('detail.items')}
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('items.product')}</TableCell>
                      <TableCell align="right">{t('items.quantity')}</TableCell>
                      <TableCell>{t('items.unit')}</TableCell>
                      <TableCell align="right">{t('items.unitPrice')}</TableCell>
                      <TableCell align="right">{t('items.discount')}</TableCell>
                      <TableCell align="right">{t('items.tax')}</TableCell>
                      <TableCell align="right">{t('items.total')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(sale.items ?? []).map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="subtitle2">{itemLabel(item)}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {item.variation?.sku ?? item.product?.sku ?? '-'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{formatQuantity(item.quantity)}</TableCell>
                        <TableCell>{item.sub_unit?.short_name ?? item.product?.unit?.short_name ?? '-'}</TableCell>
                        <TableCell align="right">{formatMoney(item.unit_price, currencyFormatter)}</TableCell>
                        <TableCell align="right">{formatMoney(item.discount_amount, currencyFormatter)}</TableCell>
                        <TableCell align="right">{formatMoney(item.tax_amount, currencyFormatter)}</TableCell>
                        <TableCell align="right">{formatMoney(item.total_amount, currencyFormatter)}</TableCell>
                      </TableRow>
                    ))}
                    {(sale.items ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          {t('detail.noItems')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Divider />

            <Box>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
                sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: 2 }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <Typography variant="h6">{t('payment.historyTitle')}</Typography>
                  <Tooltip title={t(historyOpen ? 'payment.hideHistory' : 'payment.showHistory')}>
                    <IconButton size="small" onClick={() => setHistoryOpen((open) => !open)}>
                      <PaymentsOutlined />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {(sale.payments?.length ?? 0).toLocaleString()} {t('columns.payment').toLowerCase()}
                </Typography>
              </Stack>
              <Collapse in={historyOpen}>
                {(sale.payments?.length ?? 0) === 0 ? (
                  <Alert severity="info">{t('payment.noHistory')}</Alert>
                ) : (
                  <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                    <Table sx={{ minWidth: 1100, tableLayout: 'fixed' }}>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ width: 140 }}>{t('payment.date')}</TableCell>
                          <TableCell sx={{ width: 220 }}>{t('payment.account')}</TableCell>
                          <TableCell sx={{ width: 140 }}>{t('payment.method')}</TableCell>
                          <TableCell sx={{ width: 170 }} align="right">{t('payment.amount')}</TableCell>
                          <TableCell sx={{ width: 170 }} align="right">{t('payment.converted')}</TableCell>
                          <TableCell sx={{ width: 140 }}>{t('payment.status')}</TableCell>
                          <TableCell sx={{ width: 170 }}>{t('payment.reference')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(sale.payments ?? []).map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.payment_date ? formatAppDate(payment.payment_date, dateFormat, i18n.language) : '-'}</TableCell>
                            <TableCell>{paymentAccountLabel(payment)}</TableCell>
                            <TableCell>{t(`paymentMethods.${payment.method}`, { defaultValue: payment.method })}</TableCell>
                            <TableCell align="right">{paymentEnteredAmount(payment)}</TableCell>
                            <TableCell align="right">{formatMoney(payment.amount, currencyFormatter)}</TableCell>
                            <TableCell>{t(`payment.${payment.status}`, { defaultValue: payment.status })}</TableCell>
                            <TableCell>{payment.reference || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Collapse>
            </Box>

            <Divider />

            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('detail.totals')}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
                  gap: 2,
                }}
              >
                {[
                  [t('fields.subtotal'), formatMoney(sale.subtotal, currencyFormatter)],
                  [t('fields.discount'), formatMoney(sale.discount_amount, currencyFormatter)],
                  [t('fields.tax'), formatMoney(sale.tax_amount, currencyFormatter)],
                  [t('fields.shipping'), formatMoney(sale.shipping_charges, currencyFormatter)],
                  [t('fields.total'), formatMoney(sale.total_amount, currencyFormatter)],
                  [t('fields.paid'), formatMoney(sale.paid_amount, currencyFormatter)],
                  [t('detail.summary.due'), formatMoney(outstandingAmount(sale), currencyFormatter)],
                  [t('fields.change'), formatMoney(sale.change_amount, currencyFormatter)],
                  [t('fields.returns'), sale.returns_count],
                  [t('detail.summary.items'), sale.items?.length ?? 0],
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {label}
                    </Typography>
                    <Typography variant="body2">{value}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        title={t('confirm.title')}
        message={t('confirm.message', { number: sale.sale_number })}
        confirmText={t('actions.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={isMutating}
        confirmColor="primary"
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
      <ConfirmDialog
        open={completeOpen}
        title={t('complete.title')}
        message={t('complete.message', { number: sale.sale_number })}
        confirmText={t('actions.complete')}
        cancelText={t('common:buttons.cancel')}
        loading={isMutating}
        confirmColor="success"
        onClose={() => setCompleteOpen(false)}
        onConfirm={handleComplete}
      />
      <SaleCancelDialog
        open={cancelOpen}
        sale={sale}
        isSaving={cancelSale.isPending}
        onClose={() => setCancelOpen(false)}
        onSubmit={handleCancel}
      />
      <SalePaymentDialog
        open={paymentOpen}
        sale={sale}
        paymentAccounts={paymentAccounts}
        defaultExchangeRate={defaultExchangeRateQuery.data ?? null}
        isExchangeRateLoading={defaultExchangeRateQuery.isLoading}
        isSaving={recordPayment.isPending}
        onClose={() => setPaymentOpen(false)}
        onSubmit={handlePayment}
      />
      <ConfirmDialog
        open={deleteOpen}
        title={t('delete.title')}
        message={t('delete.message', { number: sale.sale_number })}
        confirmText={t('common:buttons.delete')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteSale.isPending}
        confirmColor="error"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
