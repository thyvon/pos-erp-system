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
import { ArrowBack, CompareArrowsOutlined, DeleteOutlined, EditOutlined, Inventory2Outlined, LocalOfferOutlined, LocalShippingOutlined, PaymentsOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { UnitConversionBadge } from '@/features/sales/components/UnitConversionBadge'

import { PurchasePaymentDialog } from './PurchasePaymentDialog'
import { PurchasePaymentDeleteDialog } from './PurchasePaymentDeleteDialog'
import { PurchaseReturnDialog } from './PurchaseReturnDialog'

import { useDefaultExchangeRateQuery, usePaymentAccountsQuery } from '@/features/accounting/hooks'
import {
  useCreatePurchaseReturnMutation,
  useDeletePurchaseMutation,
  useDeletePurchaseReceiveMutation,
  usePurchaseQuery,
  useReceivePurchaseMutation,
  useRecordPurchasePaymentMutation,
  useUpdatePurchasePaymentMutation,
  useDeletePurchasePaymentMutation,
} from './hooks'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { useAuthStore } from '@/stores/authStore'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import { formatMoney } from '@/utils/formatMoney'
import type { PurchaseItem, PurchasePayment, PurchasePaymentCorrectionPayload, PurchasePaymentPayload, PurchaseReceive, PurchaseReturnPayload } from '@/types/purchase'

interface PurchaseDetailPageProps {
  purchaseId: string
}

function formatQuantity(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? String(numeric) : '-'
}

function itemLabel(item: PurchaseItem) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || '-'
}

function itemUnitLabel(item: PurchaseItem) {
  return item.unit_label ?? '-'
}

function paymentAccountLabel(payment: PurchasePayment) {
  return payment.payment_account
    ? [payment.payment_account.name, payment.payment_account.type].filter(Boolean).join(' / ')
    : payment.payment_account_id
}

function paymentEnteredAmount(payment: PurchasePayment) {
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

export function PurchaseDetailPage({ purchaseId }: PurchaseDetailPageProps) {
  const { t, i18n } = useTranslation(['purchases', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PurchasePayment | null>(null)
  const [confirmPaymentDeleteId, setConfirmPaymentDeleteId] = useState<string | null>(null)
  const [confirmReceiveDeleteId, setConfirmReceiveDeleteId] = useState<string | null>(null)
  const [confirmReceiveDeleteNumber, setConfirmReceiveDeleteNumber] = useState('')
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()

  const purchaseQuery = usePurchaseQuery(purchaseId)
  const paymentAccountsQuery = usePaymentAccountsQuery({ status: 'active', per_page: 100 })
  const defaultExchangeRateQuery = useDefaultExchangeRateQuery('USD', 'KHR')
  const deletePurchase = useDeletePurchaseMutation()
  const receivePurchase = useReceivePurchaseMutation()
  const createReturn = useCreatePurchaseReturnMutation()
  const recordPayment = useRecordPurchasePaymentMutation()
  const updatePayment = useUpdatePurchasePaymentMutation()
  const deletePayment = useDeletePurchasePaymentMutation()
  const deleteReceive = useDeletePurchaseReceiveMutation()
  const isMutating = deletePurchase.isPending || receivePurchase.isPending || createReturn.isPending || recordPayment.isPending || updatePayment.isPending || deletePayment.isPending || deleteReceive.isPending

  const purchase = purchaseQuery.data
  const paymentAccounts = paymentAccountsQuery.data?.data ?? []

  const canEdit = can('purchases.edit') && purchase && ['draft', 'confirmed', 'partially_received'].includes(purchase.status)
  const canDelete = can('purchases.delete') && purchase && ['draft', 'confirmed', 'cancelled'].includes(purchase.status)
  const canReceive = can('purchases.receive') && purchase && ['confirmed', 'partially_received'].includes(purchase.status)
  const canManageReceives = can('purchases.receive') && purchase && ['confirmed', 'partially_received', 'received'].includes(purchase.status)
  const canReturn = can('purchases.return') && purchase && ['received', 'partially_received'].includes(purchase.status)
  const canRecordPayment = !!purchase
    && can('payments.create')
    && ['confirmed', 'partially_received', 'received'].includes(purchase.status)
    && ['unpaid', 'partial'].includes(purchase.payment_status)
  const canCorrectPayment = !!purchase
    && can('payments.edit')
    && ['confirmed', 'partially_received', 'received'].includes(purchase.status)
  const canDeletePayment = !!purchase
    && can('payments.delete')
    && ['confirmed', 'partially_received', 'received'].includes(purchase.status)

  const handleDelete = async () => {
    await deletePurchase.mutateAsync(purchaseId)
    enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
    setDeleteOpen(false)
    router.push('/purchases')
  }

  const handleReturn = async (payload: PurchaseReturnPayload) => {
    await createReturn.mutateAsync({ purchaseId, payload })
    enqueueSnackbar(t('messages.returnRecorded', { defaultValue: 'Purchase return recorded successfully' }), { variant: 'success' })
    setReturnOpen(false)
  }

  const handlePayment = async (payload: PurchasePaymentPayload) => {
    if (!purchase) return
    await recordPayment.mutateAsync({ id: purchase.id, payload })
    enqueueSnackbar(t('messages.paymentRecorded', { defaultValue: 'Payment recorded successfully' }), { variant: 'success' })
    setPaymentOpen(false)
  }

  const handleUpdatePayment = async (paymentId: string, payload: PurchasePaymentCorrectionPayload) => {
    if (!purchase) return
    await updatePayment.mutateAsync({ purchaseId: purchase.id, paymentId, payload })
    enqueueSnackbar(t('messages.paymentUpdated', { defaultValue: 'Payment updated successfully' }), { variant: 'success' })
    setEditingPayment(null)
  }

  const handleDeletePayment = async (reason: string) => {
    if (!purchase || !confirmPaymentDeleteId) return
    await deletePayment.mutateAsync({ purchaseId: purchase.id, paymentId: confirmPaymentDeleteId, payload: { reason } })
    enqueueSnackbar(t('messages.paymentDeleted', { defaultValue: 'Payment deleted successfully' }), { variant: 'success' })
    setConfirmPaymentDeleteId(null)
  }

  const handleDeleteReceive = async () => {
    if (!purchase || !confirmReceiveDeleteId) return
    await deleteReceive.mutateAsync({ purchaseId: purchase.id, receiveId: confirmReceiveDeleteId })
    enqueueSnackbar(t('receive.receiveDeleted'), { variant: 'success' })
    setConfirmReceiveDeleteId(null)
    setConfirmReceiveDeleteNumber('')
  }

  if (purchaseQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    )
  }

  if (purchaseQuery.isError) {
    return <Alert severity="error">{toAppApiError(purchaseQuery.error).message}</Alert>
  }

  if (!purchase) {
    return <Alert severity="warning">{t('common:errors.notFound')}</Alert>
  }

  const items = purchase.items ?? []
  const payments = purchase.payments ?? []
  const receives = purchase.receives ?? []
  const returnedAmount = Number(purchase.returned_amount ?? 0)
  const netPayableAmount = Number(purchase.net_payable_amount ?? Math.max(Number(purchase.total_amount ?? 0) - returnedAmount, 0))
  const dueAmount = Number(purchase.due_amount ?? Math.max(netPayableAmount - Number(purchase.paid_amount ?? 0), 0))

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Tooltip title={t('detail.back')}>
            <IconButton size="small" component={NextLink} href="/purchases">
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <PageHeader
            icon={<LocalShippingOutlined color="primary" />}
            title={purchase.purchase_number}
            description={`${purchase.supplier?.name ?? '-'} · ${formatAppDate(purchase.purchase_date, dateFormat, i18n.language)}`}
            meta={
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Chip size="small" label={t(`statuses.${purchase.status}`)} variant="outlined" />
                <Chip size="small" label={t(`paymentStatuses.${purchase.payment_status}`)} variant="outlined" />
              </Stack>
            }
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { xs: 'stretch', sm: 'center' } }}>
          {canRecordPayment && (
            <Button
              variant="contained"
              startIcon={<PaymentsOutlined />}
              onClick={() => setPaymentOpen(true)}
              disabled={isMutating}
            >
              {t('payment.record')}
            </Button>
          )}
          {canReceive && (
            <Button
              component={NextLink}
              href={`/purchases/${purchaseId}/receive`}
              variant="contained"
              startIcon={<Inventory2Outlined />}
            >
              {t('detail.receive')}
            </Button>
          )}
          {receives.length > 0 && (
            <Button
              component={NextLink}
              href={`/purchases/${purchaseId}/labels`}
              variant="outlined"
              startIcon={<LocalOfferOutlined />}
            >
              {t('labelPrinting.printLabels')}
            </Button>
          )}
          {canReturn && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<CompareArrowsOutlined />}
              onClick={() => setReturnOpen(true)}
              disabled={isMutating}
            >
              {t('returns.actions.record')}
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outlined"
              startIcon={<EditOutlined />}
              component={NextLink}
              href={`/purchases/${purchaseId}/edit`}
            >
              {t('detail.edit')}
            </Button>
          )}
          {canDelete && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlined />}
              onClick={() => setDeleteOpen(true)}
              disabled={isMutating}
            >
              {t('detail.delete')}
            </Button>
          )}
        </Stack>
      </Stack>

      <Card>
        <CardContent sx={{ p: { xs: 2, md: 4 }, '&:last-child': { pb: { xs: 2, md: 4 } } }}>
          <Stack spacing={3.5}>
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
                <InvoiceHeaderLine label={t('detail.supplier')} value={purchase.supplier?.name ?? '-'} />
                <InvoiceHeaderLine label={t('detail.poNumber')} value={purchase.purchase_number} />
                <InvoiceHeaderLine label={t('detail.date')} value={formatAppDate(purchase.purchase_date, dateFormat, i18n.language)} />
                {purchase.supplier_invoice_no && (
                  <InvoiceHeaderLine label={t('detail.invoice')} value={purchase.supplier_invoice_no} />
                )}
              </Stack>
              <Stack spacing={1}>
                <InvoiceHeaderLine label={t('detail.branch')} value={purchase.branch?.name ?? '-'} />
                <InvoiceHeaderLine label={t('detail.warehouse')} value={purchase.warehouse?.name ?? '-'} />
                {purchase.expected_date && (
                  <InvoiceHeaderLine label={t('detail.expected')} value={formatAppDate(purchase.expected_date, dateFormat, i18n.language)} />
                )}
              </Stack>
              <Stack spacing={1}>
                <InvoiceHeaderLine label={t('detail.createdAt')} value={formatAppDateTime(purchase.created_at, dateFormat, i18n.language)} />
                <InvoiceHeaderLine label={t('detail.createdBy')} value={purchase.creator?.name ?? '-'} />

              </Stack>
            </Box>

            <Box>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 920, tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: 56 }}>#</TableCell>
                    <TableCell sx={{ width: 280 }}>{t('form.product')}</TableCell>
                    <TableCell sx={{ width: 100 }} align="right">{t('form.quantity')}</TableCell>
                    <TableCell sx={{ width: 100 }} align="right">{t('detail.receivedQty')}</TableCell>
                    <TableCell sx={{ width: 90 }}>{t('form.unit')}</TableCell>
                    <TableCell sx={{ width: 110 }} align="right">{t('form.unitCost')}</TableCell>
                    <TableCell sx={{ width: 110 }} align="right">{t('form.discountAmount')}</TableCell>
                    <TableCell sx={{ width: 110 }} align="right">{t('form.taxAmount')}</TableCell>
                    <TableCell sx={{ width: 130 }} align="right">{t('form.subtotal')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {t('empty')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item, index) => {
                      const qty = Number(item.quantity)
                      const cost = Number(item.unit_cost)
                      const discount = Number(item.discount_amount)
                      const rate = Number(item.tax_rate)
                      const lineSubtotal = qty * cost
                      const lineDiscounted = Math.max(0, lineSubtotal - discount)
                      const lineTax = lineDiscounted * rate / 100
                      const lineTotal = lineDiscounted + lineTax

                      return (
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
                              {item.notes && (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {item.notes}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right">{formatQuantity(item.quantity)}</TableCell>
                          <TableCell align="right">{formatQuantity(item.received_quantity)}</TableCell>
                          <TableCell>{itemUnitLabel(item)}</TableCell>
                          <TableCell align="right">{formatMoney(item.unit_cost, currencyFormatter)}</TableCell>
                          <TableCell align="right">{formatMoney(item.discount_amount, currencyFormatter)}</TableCell>
                          <TableCell align="right">{formatMoney(lineTax, currencyFormatter)}</TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle2">{formatMoney(lineTotal, currencyFormatter)}</Typography>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            </Box>

            <Stack spacing={2.5}>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800 }}>
                    {t('detail.notes')}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.75, color: purchase.notes ? 'text.primary' : 'text.secondary' }}>
                    {purchase.notes || t('detail.noNotes')}
                  </Typography>
                </Box>
                {purchase.staff_note && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontWeight: 800 }}>
                      {t('detail.staffNote')}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 0.75 }}>
                      {purchase.staff_note}
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
                    [t('form.subtotal'), formatMoney(purchase.subtotal, currencyFormatter)],
                    [t('form.discountAmount'), formatMoney(purchase.discount_amount, currencyFormatter)],
                    [t('form.taxAmount'), formatMoney(purchase.tax_amount, currencyFormatter)],
                    [t('form.shippingAmount'), formatMoney(purchase.shipping_charges, currencyFormatter)],
                    [t('form.total'), formatMoney(purchase.total_amount, currencyFormatter), 'highlight-cell'],
                    [t('detail.returnedAmount'), formatMoney(returnedAmount, currencyFormatter)],
                    [t('detail.netPayableAmount'), formatMoney(netPayableAmount, currencyFormatter), 'highlight-cell'],
                    [t('detail.paidAmount'), formatMoney(purchase.paid_amount, currencyFormatter)],
                    [t('detail.dueAmount'), formatMoney(dueAmount, currencyFormatter), 'highlight-cell'],
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
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Inventory2Outlined color="primary" />
                <Box>
                  <Typography variant="subtitle2">{t('receive.historyTitle')}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {(receives.length).toLocaleString()} {t('receive.historyTitle').toLowerCase()}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
            {receives.length === 0 ? (
              <Alert severity="info">{t('receive.noHistory')}</Alert>
            ) : (
              <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 900, tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 160 }}>{t('receive.receiveNumber')}</TableCell>
                      <TableCell sx={{ width: 160 }}>{t('receive.receivedAt')}</TableCell>
                      <TableCell sx={{ width: 100 }} align="center">{t('receive.item')}</TableCell>
                      <TableCell sx={{ width: 200 }}>{t('receive.notes')}</TableCell>
                      <TableCell sx={{ width: 140 }}>{t('detail.receivedBy')}</TableCell>
                      <TableCell sx={{ width: 132 }} align="center">{t('detail.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {receives.map((receive: PurchaseReceive) => (
                      <TableRow key={receive.id}>
                        <TableCell>{receive.receive_number}</TableCell>
                        <TableCell>{receive.received_at ? formatAppDateTime(receive.received_at, dateFormat, i18n.language) : '-'}</TableCell>
                        <TableCell align="center">{receive.items_count ?? receive.items?.length ?? 0}</TableCell>
                        <TableCell>{receive.notes || '-'}</TableCell>
                        <TableCell>{receive.creator?.name ?? '-'}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                            <Tooltip title={t('labelPrinting.printLabels')}>
                              <IconButton size="small" component={NextLink} href={`/purchases/${purchaseId}/labels?receiveId=${receive.id}`}>
                                <LocalOfferOutlined fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {canManageReceives && (
                              <Tooltip title={t('receive.editAction')}>
                                <IconButton size="small" component={NextLink} href={`/purchases/${purchaseId}/receive?receiveId=${receive.id}`}>
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canManageReceives && (
                              <Tooltip title={t('receive.deleteAction')}>
                                <IconButton size="small" color="error" onClick={() => {
                                  setConfirmReceiveDeleteId(receive.id)
                                  setConfirmReceiveDeleteNumber(receive.receive_number)
                                }}>
                                  <DeleteOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <PaymentsOutlined color="primary" />
                <Box>
                  <Typography variant="subtitle2">{t('payment.title')}</Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {(payments.length).toLocaleString()} {t('payment.title').toLowerCase()}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
            {payments.length === 0 ? (
              <Alert severity="info">{t('payment.noHistory')}</Alert>
            ) : (
              <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 1100, tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: 140 }}>{t('payment.date')}</TableCell>
                      <TableCell sx={{ width: 220 }}>{t('payment.account')}</TableCell>
                      <TableCell sx={{ width: 140 }}>{t('payment.method')}</TableCell>
                      <TableCell sx={{ width: 170 }} align="right">{t('payment.amount')}</TableCell>
                      <TableCell sx={{ width: 170 }} align="right">{t('payment.converted')}</TableCell>
                      <TableCell sx={{ width: 140 }}>{t('payment.status')}</TableCell>
                      <TableCell sx={{ width: 170 }}>{t('payment.reference')}</TableCell>
                      <TableCell sx={{ width: 100 }} align="center">{t('detail.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.payment_date ? formatAppDate(payment.payment_date, dateFormat, i18n.language) : '-'}</TableCell>
                        <TableCell>{paymentAccountLabel(payment)}</TableCell>
                        <TableCell>{t(`paymentMethods.${payment.method}`, { defaultValue: payment.method })}</TableCell>
                        <TableCell align="right">{paymentEnteredAmount(payment)}</TableCell>
                        <TableCell align="right">{formatMoney(payment.amount, currencyFormatter)}</TableCell>
                        <TableCell>{t(`payment.${payment.status}`, { defaultValue: payment.status })}</TableCell>
                        <TableCell>{payment.reference || '-'}</TableCell>
                        <TableCell align="center">
                          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                            {canCorrectPayment && payment.status === 'completed' && (
                              <Tooltip title={t('payment.editAction')}>
                                <IconButton size="small" onClick={() => setEditingPayment(payment)}>
                                  <EditOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            {canDeletePayment && payment.status === 'completed' && (
                              <Tooltip title={t('payment.deleteAction')}>
                                <IconButton size="small" color="error" onClick={() => setConfirmPaymentDeleteId(payment.id)}>
                                  <DeleteOutlined fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Stack>
        </CardContent>
      </Card>

      <PurchaseReturnDialog
        open={returnOpen}
        purchase={purchase}
        isSaving={createReturn.isPending}
        onClose={() => setReturnOpen(false)}
        onSubmit={handleReturn}
      />

      <PurchasePaymentDialog
        open={paymentOpen || !!editingPayment}
        purchase={purchase}
        paymentAccounts={paymentAccounts}
        defaultExchangeRate={defaultExchangeRateQuery.data ?? null}
        isExchangeRateLoading={defaultExchangeRateQuery.isLoading}
        isSaving={recordPayment.isPending || updatePayment.isPending}
        onClose={() => { setPaymentOpen(false); setEditingPayment(null) }}
        onSubmit={handlePayment}
        existingPayment={editingPayment}
        onUpdate={handleUpdatePayment}
      />

      <ConfirmDialog
        open={deleteOpen}
        title={t('delete.title')}
        message={t('delete.message', { number: purchase.purchase_number })}
        confirmText={t('common:buttons.delete')}
        cancelText={t('common:buttons.cancel')}
        loading={deletePurchase.isPending}
        confirmColor="error"
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />

      {confirmPaymentDeleteId && (
        <PurchasePaymentDeleteDialog
          open
          isSaving={deletePayment.isPending}
          onClose={() => setConfirmPaymentDeleteId(null)}
          onConfirm={handleDeletePayment}
        />
      )}

      <ConfirmDialog
        open={!!confirmReceiveDeleteId}
        title={t('receive.deleteTitle')}
        message={t('receive.deleteConfirm', { number: confirmReceiveDeleteNumber })}
        confirmText={t('common:buttons.delete')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteReceive.isPending}
        confirmColor="error"
        onClose={() => { setConfirmReceiveDeleteId(null); setConfirmReceiveDeleteNumber('') }}
        onConfirm={handleDeleteReceive}
      />
    </Stack>
  )
}
