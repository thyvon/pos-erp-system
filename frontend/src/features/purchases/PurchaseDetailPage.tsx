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
  Collapse,
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
import { ArrowBack, DeleteOutlined, EditOutlined, LocalShippingOutlined, PaymentsOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PurchaseReceiveDialog } from './PurchaseReceiveDialog'
import { PurchasePaymentDialog } from './PurchasePaymentDialog'

import { useDefaultExchangeRateQuery, usePaymentAccountsQuery } from '@/features/accounting/hooks'
import {
  useDeletePurchaseMutation,
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
import type { PurchaseItem, PurchasePayment, PurchasePaymentCorrectionPayload, PurchasePaymentPayload, ReceivePurchasePayload } from '@/types/purchase'


interface PurchaseDetailPageProps {
  purchaseId: string
}

function formatMoney(value: number | string | null | undefined, formatter: Intl.NumberFormat) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? formatter.format(numeric) : '-'
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
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary', minWidth: 100, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, borderBottom: '1px dashed', borderColor: 'divider', pb: 0.5, flexGrow: 1 }}>
        {value}
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
  const [receiveOpen, setReceiveOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [editingPayment, setEditingPayment] = useState<PurchasePayment | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [confirmPaymentDeleteId, setConfirmPaymentDeleteId] = useState<string | null>(null)
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()

  const purchaseQuery = usePurchaseQuery(purchaseId)
  const paymentAccountsQuery = usePaymentAccountsQuery({ status: 'active', per_page: 100 })
  const defaultExchangeRateQuery = useDefaultExchangeRateQuery('USD', 'KHR')
  const deletePurchase = useDeletePurchaseMutation()
  const receivePurchase = useReceivePurchaseMutation()
  const recordPayment = useRecordPurchasePaymentMutation()
  const updatePayment = useUpdatePurchasePaymentMutation()
  const deletePayment = useDeletePurchasePaymentMutation()
  const isMutating = deletePurchase.isPending || receivePurchase.isPending || recordPayment.isPending || updatePayment.isPending || deletePayment.isPending

  const purchase = purchaseQuery.data
  const paymentAccounts = paymentAccountsQuery.data?.data ?? []

  const canEdit = can('purchases.edit') && purchase && ['draft', 'confirmed'].includes(purchase.status)
  const canDelete = can('purchases.delete') && purchase && ['draft', 'confirmed', 'cancelled'].includes(purchase.status)
  const canReceive = can('purchases.receive') && purchase && ['confirmed', 'partially_received'].includes(purchase.status)
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

  const handleReceive = async (payload: ReceivePurchasePayload) => {
    await receivePurchase.mutateAsync({ id: purchaseId, payload })
    enqueueSnackbar(t('messages.received'), { variant: 'success' })
    setReceiveOpen(false)
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

  const handleDeletePayment = async () => {
    if (!purchase || !confirmPaymentDeleteId) return
    await deletePayment.mutateAsync({ purchaseId: purchase.id, paymentId: confirmPaymentDeleteId })
    enqueueSnackbar(t('messages.paymentDeleted', { defaultValue: 'Payment deleted successfully' }), { variant: 'success' })
    setConfirmPaymentDeleteId(null)
  }

  if (purchaseQuery.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
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

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between' }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Tooltip title={t('detail.back')}>
            <IconButton size="small" component={NextLink} href="/purchases">
              <ArrowBack />
            </IconButton>
          </Tooltip>
          <LocalShippingOutlined color="primary" />
          <Box>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="h4">{purchase.purchase_number}</Typography>
              <Chip size="small" label={t(`statuses.${purchase.status}`)} variant="outlined" />
              <Chip size="small" label={t(`paymentStatuses.${purchase.payment_status}`)} variant="outlined" />
            </Stack>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>
              {purchase.supplier?.name ?? '-'}
              {' · '}
              {formatAppDate(purchase.purchase_date, dateFormat, i18n.language)}
            </Typography>
          </Box>
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
              variant="contained"
              startIcon={<LocalShippingOutlined />}
              onClick={() => setReceiveOpen(true)}
              disabled={isMutating}
            >
              {t('detail.receive')}
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
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Stack spacing={2.5}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: { xs: 2, md: 0 } }}>
              <Stack spacing={1.5} sx={{ flex: 1, pr: { md: 3 } }}>
                <InvoiceHeaderLine label={t('detail.supplier')} value={purchase.supplier?.name ?? '-'} />
                <InvoiceHeaderLine label={t('detail.branch')} value={purchase.branch?.name ?? '-'} />
                <InvoiceHeaderLine label={t('detail.warehouse')} value={purchase.warehouse?.name ?? '-'} />
                <InvoiceHeaderLine label={t('detail.date')} value={formatAppDate(purchase.purchase_date, dateFormat, i18n.language)} />
                {purchase.expected_date && (
                  <InvoiceHeaderLine label={t('detail.expected')} value={formatAppDate(purchase.expected_date, dateFormat, i18n.language)} />
                )}
                {purchase.supplier_invoice_no && (
                  <InvoiceHeaderLine label={t('detail.invoice')} value={purchase.supplier_invoice_no} />
                )}
                <InvoiceHeaderLine label={t('detail.createdAt')} value={formatAppDateTime(purchase.created_at, dateFormat, i18n.language)} />
              </Stack>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', md: 'block' } }} />
              <Divider sx={{ display: { md: 'none' } }} />
              <Stack spacing={1.5} sx={{ flex: 1, pl: { md: 3 } }}>
                {purchase.received_at && (
                  <InvoiceHeaderLine label={t('detail.received')} value={formatAppDateTime(purchase.received_at, dateFormat, i18n.language)} />
                )}
                <InvoiceHeaderLine label={t('detail.poNumber')} value={purchase.purchase_number} />
                <InvoiceHeaderLine
                  label={t('detail.createdBy')}
                  value={purchase.creator?.name ?? '-'}
                />
                {purchase.receiver && (
                  <InvoiceHeaderLine
                    label={t('detail.receivedBy')}
                    value={purchase.receiver?.name ?? '-'}
                  />
                )}
              </Stack>
            </Box>

            <Typography variant="subtitle2">{t('detail.items')}</Typography>
            <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>#</TableCell>
                    <TableCell>{t('form.product')}</TableCell>
                    <TableCell align="right">{t('form.quantity')}</TableCell>
                    <TableCell align="right">{t('detail.receivedQty')}</TableCell>
                    <TableCell>{t('form.unit')}</TableCell>
                    <TableCell align="right">{t('form.unitCost')}</TableCell>
                    <TableCell align="right">{t('form.discountAmount')}</TableCell>
                    <TableCell align="right">{t('form.taxAmount')}</TableCell>
                    <TableCell align="right">{t('form.subtotal')}</TableCell>
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

            {(purchase.notes || purchase.staff_note) && (
              <Stack spacing={1.5}>
                {purchase.notes && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('detail.notes')}</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{purchase.notes}</Typography>
                  </Box>
                )}
                {purchase.staff_note && (
                  <Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>{t('detail.staffNote')}</Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{purchase.staff_note}</Typography>
                  </Box>
                )}
              </Stack>
            )}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                gap: 2,
                borderTop: 1,
                borderColor: 'divider',
                pt: 2,
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('form.subtotal')}</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{formatMoney(purchase.subtotal, currencyFormatter)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('form.discountAmount')}</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{formatMoney(purchase.discount_amount, currencyFormatter)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('form.taxAmount')}</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{formatMoney(purchase.tax_amount, currencyFormatter)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('form.shippingAmount')}</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{formatMoney(purchase.shipping_charges, currencyFormatter)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('detail.paidAmount')}</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{formatMoney(purchase.paid_amount, currencyFormatter)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('form.total')}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatMoney(purchase.total_amount, currencyFormatter)}</Typography>
              </Box>
            </Box>

            <Divider />

            <Box>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2">{t('payment.title')}</Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => setHistoryOpen((prev) => !prev)}
                >
                  {historyOpen ? 'Hide' : 'Show'}
                </Button>
              </Stack>
              <Collapse in={historyOpen}>
                {payments.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 1.5 }}>{t('payment.noHistory')}</Alert>
                ) : (
                  <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mt: 1.5, overflowX: 'auto' }}>
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
                          <TableCell sx={{ width: 100 }} align="right">{t('detail.actions')}</TableCell>
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
                            <TableCell align="right">
                              <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
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
              </Collapse>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <PurchaseReceiveDialog
        open={receiveOpen}
        purchase={purchase}
        isSaving={receivePurchase.isPending}
        onClose={() => setReceiveOpen(false)}
        onSubmit={handleReceive}
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

      <ConfirmDialog
        open={!!confirmPaymentDeleteId}
        title={t('payment.deleteTitle')}
        message={t('payment.deleteConfirm')}
        confirmText={t('payment.deleteAction')}
        cancelText={t('common:buttons.cancel')}
        loading={deletePayment.isPending}
        confirmColor="error"
        onClose={() => setConfirmPaymentDeleteId(null)}
        onConfirm={handleDeletePayment}
      />
    </Stack>
  )
}
