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
  Collapse,
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

function taxLabel(item: SaleItem, formatter: Intl.NumberFormat) {
  const taxAmount = formatMoney(item.tax_amount, formatter)
  const taxRate = item.tax_rate ? Number(item.tax_rate) : null

  if (!taxRate || !Number.isFinite(taxRate)) return taxAmount

  return `${taxAmount} (${taxRate}${item.tax_rate_type === 'percentage' ? '%' : ''})`
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

function InvoiceHeaderLine({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '112px minmax(0, 1fr)', md: '128px minmax(0, 1fr)' },
        columnGap: 1,
        alignItems: 'end',
      }}
    >
      <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', textAlign: 'left' }}>
        {label}:
      </Typography>
      <Typography
        variant="body2"
        sx={{
          minHeight: 24,
          borderBottom: 1,
          borderBottomStyle: 'dashed',
          borderColor: 'divider',
          fontWeight: 800,
          overflowWrap: 'anywhere',
        }}
      >
        {value || '-'}
      </Typography>
    </Box>
  )
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
  const isClearlyEditBlocked = !!sale && (['cancelled', 'returned'].includes(sale.status) || sale.returns_count > 0)
  const canEdit = !!sale && can('sales.edit') && !isClearlyEditBlocked
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
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Tooltip title={t('common:buttons.back')}>
            <IconButton component={NextLink} href="/sales" size="small" aria-label={t('common:buttons.back')}>
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography variant="h4">{sale.sale_number}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
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

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 4 }, '&:last-child': { pb: { xs: 2, md: 4 } } }}>
          <Stack spacing={3.5}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5} sx={{ justifyContent: 'space-between' }}>
              <Stack spacing={1}>
                <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
                  <PointOfSaleOutlined color="primary" />
                  <Typography variant="h3" sx={{ lineHeight: 1 }}>
                    {t(`types.${sale.type}`, { defaultValue: sale.type })}
                  </Typography>
                </Stack>
                <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                  {sale.sale_number}
                </Typography>
              </Stack>

              <Stack spacing={1} sx={{ alignItems: { xs: 'flex-start', md: 'flex-end' } }}>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', justifyContent: { md: 'flex-end' } }}>
                  <Chip label={t(`statuses.${sale.status}`, { defaultValue: sale.status })} color="primary" variant="outlined" />
                  <Chip label={t(`paymentStatuses.${sale.payment_status}`, { defaultValue: sale.payment_status })} color="success" variant="outlined" />
                  {sale.delivery_status && (
                    <Chip label={t(`deliveryStatuses.${sale.delivery_status}`, { defaultValue: sale.delivery_status })} variant="outlined" />
                  )}
                </Stack>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('fields.createdAt')}: {formatAppDateTime(sale.created_at, dateFormat, i18n.language)}
                </Typography>
              </Stack>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr' },
                gap: { xs: 1.25, md: 2 },
                py: 2.5,
                borderTop: 1,
                borderBottom: 1,
                borderColor: 'divider',
              }}
            >
              <Stack spacing={1}>
                <InvoiceHeaderLine label={t('fields.customer')} value={sale.customer?.name ?? t('labels.walkInCustomer')} />
                {sale.customer?.code && (
                  <InvoiceHeaderLine label={t('fields.code')} value={sale.customer.code} />
                )}
                {sale.customer?.phone && (
                  <InvoiceHeaderLine label={t('fields.phone')} value={sale.customer.phone} />
                )}
              </Stack>

              <Stack spacing={1}>
                <InvoiceHeaderLine label={t('fields.branch')} value={sale.branch?.name ?? '-'} />
                <InvoiceHeaderLine label={t('fields.warehouse')} value={sale.warehouse?.name ?? '-'} />
                <InvoiceHeaderLine label={t('fields.cashRegister')} value={sale.cash_register_session?.cash_register?.name ?? '-'} />
              </Stack>

              <Stack spacing={1}>
                <InvoiceHeaderLine label={t('fields.saleDate')} value={formatAppDate(sale.sale_date, dateFormat, i18n.language)} />
                <InvoiceHeaderLine label={t('fields.dueDate')} value={formatAppDate(sale.due_date, dateFormat, i18n.language)} />
                <InvoiceHeaderLine label={t('fields.createdBy')} value={sale.creator?.name ?? '-'} />
              </Stack>
            </Box>

            <Box>
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
                    {(sale.items ?? []).map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Stack spacing={0.25}>
                            <Typography variant="subtitle2">{itemLabel(item)}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {item.variation?.sku ?? item.product?.sku ?? '-'}
                            </Typography>
                            {item.notes && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {item.notes}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">{formatQuantity(item.quantity)}</TableCell>
                        <TableCell>{item.sub_unit?.short_name ?? item.product?.unit?.short_name ?? '-'}</TableCell>
                        <TableCell align="right">{formatMoney(item.unit_price, currencyFormatter)}</TableCell>
                        <TableCell align="right">{formatMoney(item.discount_amount, currencyFormatter)}</TableCell>
                        <TableCell align="right">{taxLabel(item, currencyFormatter)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="subtitle2">{formatMoney(item.total_amount, currencyFormatter)}</Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(sale.items ?? []).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          {t('detail.noItems')}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Stack spacing={2.5}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800 }}>
                    {t('fields.notes')}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75, color: sale.notes ? 'text.primary' : 'text.secondary' }}>
                    {sale.notes || t('detail.noNotes')}
                  </Typography>
                </Box>
                {sale.staff_note && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800 }}>
                      {t('fields.staffNote')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.75 }}>
                      {sale.staff_note}
                    </Typography>
                  </Box>
                )}
              </Stack>

              <Box
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflowX: 'auto',
                  '& .summary-grid': {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(9, minmax(136px, 1fr))',
                    minWidth: 1224,
                  },
                  '& .summary-cell': {
                    minHeight: 78,
                    px: 1.5,
                    py: 1.25,
                    borderRight: 1,
                    borderColor: 'divider',
                    display: 'grid',
                    alignContent: 'center',
                    gap: 0.5,
                    '&:last-of-type': {
                      borderRight: 0,
                    },
                  },
                  '& .highlight-cell': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <Box className="summary-grid">
                  {[
                    [t('fields.subtotal'), formatMoney(sale.subtotal, currencyFormatter)],
                    [t('fields.discount'), formatMoney(sale.discount_amount, currencyFormatter)],
                    [t('fields.tax'), formatMoney(sale.tax_amount, currencyFormatter)],
                    [t('fields.shipping'), formatMoney(sale.shipping_charges, currencyFormatter)],
                    [t('fields.total'), formatMoney(sale.total_amount, currencyFormatter), 'highlight-cell'],
                    [t('fields.paid'), formatMoney(sale.paid_amount, currencyFormatter)],
                    [t('detail.summary.due'), formatMoney(outstandingAmount(sale), currencyFormatter), 'highlight-cell'],
                    [t('fields.change'), formatMoney(sale.change_amount, currencyFormatter)],
                    [t('fields.returns'), sale.returns_count?.toLocaleString?.() ?? sale.returns_count],
                  ].map(([label, value, className]) => (
                    <Box
                      key={label}
                      className={`summary-cell ${className ? String(className) : ''}`}
                    >
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                        {label}
                      </Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: className ? 900 : 700, overflowWrap: 'anywhere' }}>
                        {value}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Stack>

            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2.5 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between', mb: historyOpen ? 2 : 0 }}>
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
