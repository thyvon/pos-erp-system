'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
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
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import PageLoader from '@/components/ui/PageLoader'
import { ArrowBack } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { receivePurchaseSchema, type ReceivePurchaseFormInput, type ReceivePurchaseFormValues } from './schema'
import { PurchaseReceiveItemsTable } from './components/PurchaseReceiveItemsTable'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { usePurchaseQuery, usePurchaseReceiveQuery, useReceivePurchaseMutation, useUpdatePurchaseReceiveMutation, useDeletePurchaseReceiveItemMutation } from './hooks'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import { PurchaseReceiveItemDialog } from './components/PurchaseReceiveItemDialog'
import type { PurchaseReceive, ReceivePurchasePayload, UpdatePurchaseReceivePayload } from '@/types/purchase'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'

interface PurchaseReceivePageProps {
  purchaseId: string
  receiveId?: string | null
}

const today = () => new Date().toISOString().slice(0, 10)

function toNumber(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
}

function toDateInput(value: string | null | undefined) {
  return value ? value.slice(0, 10) : null
}

function itemLabel(item: NonNullable<ReturnType<typeof usePurchaseQuery>['data']>['items'][number]) {
  return [item.product?.name, item.variation?.name].filter(Boolean).join(' / ') || item.product_id
}

function itemSku(item: NonNullable<ReturnType<typeof usePurchaseQuery>['data']>['items'][number]) {
  return item.variation?.sku ?? item.product?.sku ?? null
}

function buildDefaults(
  purchase: NonNullable<ReturnType<typeof usePurchaseQuery>['data']> | null,
  receiveRecord: PurchaseReceive | null,
): ReceivePurchaseFormInput {
  if (receiveRecord) {
    return {
      received_at: toDateInput(receiveRecord.received_at) ?? today(),
      notes: receiveRecord.notes ?? '',
      items: (receiveRecord.items ?? []).map((item) => {
        const purchaseItem = purchase?.items?.find((pi) => pi.id === item.purchase_item_id)
        const itemQuantity = toNumber(purchaseItem?.quantity ?? 0)
        return {
          id: item.id,
          purchase_item_id: item.purchase_item_id,
          product_label: purchaseItem ? itemLabel(purchaseItem) : item.purchase_item_id,
          sku: purchaseItem ? itemSku(purchaseItem) : null,
          unit_cost: purchaseItem?.unit_cost ?? null,
          stock_tracking: purchaseItem?.product?.stock_tracking ?? 'none',
          has_expiry: purchaseItem?.product?.has_expiry ?? false,
          sub_unit_id: purchaseItem?.sub_unit_id ?? null,
          _conversion_factor: purchaseItem?.sub_unit?.conversion_factor ?? null,
          _base_unit_label: purchaseItem?.product?.unit?.short_name ?? null,
          sub_unit_label: purchaseItem?.sub_unit?.short_name ?? null,
          remaining_quantity: itemQuantity - toNumber(purchaseItem?.received_quantity ?? 0) + item.quantity,
          item_quantity: itemQuantity,
          quantity: item.quantity,
          lot_number: item.lot_number ?? '',
          manufacture_date: toDateInput(item.manufacture_date),
          expiry_date: toDateInput(item.expiry_date),
          serial_numbers_text: (item.serial_numbers ?? []).join('\n'),
          warranty_expires: toDateInput(item.warranty_expires),
          notes: item.notes ?? '',
        }
      }),
    }
  }

  return {
    received_at: today(),
    notes: '',
    items: (purchase?.items ?? [])
      .filter((item) => {
        const itemQuantity = toNumber(item.quantity)
        const receivedQuantity = toNumber(item.received_quantity)
        return itemQuantity > receivedQuantity
      })
      .map((item) => {
        const itemQuantity = toNumber(item.quantity)
        const receivedQuantity = toNumber(item.received_quantity)
        const remainingQuantity = Math.max(0, itemQuantity - receivedQuantity)
        return {
          purchase_item_id: item.id,
          product_label: itemLabel(item),
          sku: itemSku(item),
          unit_cost: item.unit_cost ?? null,
          stock_tracking: item.product?.stock_tracking ?? 'none',
          has_expiry: item.product?.has_expiry ?? false,
          sub_unit_id: item.sub_unit_id ?? null,
          _conversion_factor: item.sub_unit?.conversion_factor ?? null,
          _base_unit_label: item.product?.unit?.short_name ?? null,
          sub_unit_label: item.sub_unit?.short_name ?? null,
          remaining_quantity: remainingQuantity,
          item_quantity: itemQuantity,
          quantity: remainingQuantity,
          lot_number: '',
          manufacture_date: null,
          expiry_date: null,
          serial_numbers_text: '',
          warranty_expires: null,
          notes: '',
        }
      }),
  }
}

function buildCreatePayload(values: ReceivePurchaseFormValues): ReceivePurchasePayload {
  return {
    received_at: values.received_at || null,
    notes: values.notes || null,
    items: values.items.map((item) => ({
      purchase_item_id: item.purchase_item_id,
      quantity: item.quantity,
      lot_number: item.lot_number || null,
      manufacture_date: item.manufacture_date || null,
      expiry_date: item.expiry_date || null,
      serial_numbers: item.stock_tracking === 'serial'
        ? (item.serial_numbers_text ?? '').split(/\r?\n|,/).map((value) => value.trim()).filter(Boolean)
        : undefined,
      warranty_expires: item.warranty_expires || null,
      notes: item.notes || null,
    })),
  }
}

function buildUpdatePayload(values: ReceivePurchaseFormValues): UpdatePurchaseReceivePayload {
  return {
    received_at: values.received_at || null,
    notes: values.notes || null,
    items: values.items.map((item) => ({
      id: item.id ?? '',
      quantity: item.quantity,
      notes: item.notes || null,
    })),
  }
}

export function PurchaseReceivePage({ purchaseId, receiveId }: PurchaseReceivePageProps) {
  const { t, i18n } = useTranslation(['purchases', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const [serverError, setServerError] = useState('')
  const [detailItemIndex, setDetailItemIndex] = useState<number | null>(null)
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<{ itemId: string; label: string; index?: number } | null>(null)
  const dateFormat = useAppDateFormat()
  const currencyFormatter = useCurrencyFormatter()
  const isEditing = !!receiveId

  const purchaseQuery = usePurchaseQuery(purchaseId)
  const receiveQuery = usePurchaseReceiveQuery(purchaseId, receiveId ?? null)
  const receivePurchase = useReceivePurchaseMutation()
  const updateReceive = useUpdatePurchaseReceiveMutation()
  const isSaving = receivePurchase.isPending || updateReceive.isPending
  const deleteItemMutation = useDeletePurchaseReceiveItemMutation()
  const purchase = purchaseQuery.data
  const receiveRecord = receiveQuery.data

  const defaultValues = useMemo(
    () => buildDefaults(purchase ?? null, receiveRecord ?? null),
    [purchase, receiveRecord],
  )
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ReceivePurchaseFormInput, unknown, ReceivePurchaseFormValues>({
    resolver: zodResolver(receivePurchaseSchema),
    values: defaultValues,
  })
  const { fields, remove } = useFieldArray({ control, name: 'items', keyName: 'fieldId' })

  const submit = handleSubmit(async (formValues) => {
    setServerError('')
    try {
      if (isEditing && receiveId) {
        await updateReceive.mutateAsync({ purchaseId, receiveId, payload: buildUpdatePayload(formValues) })
        enqueueSnackbar(t('receive.receiveUpdated'), { variant: 'success' })
        router.push(`/purchases/${purchaseId}`)
      } else {
        const updatedPurchase = await receivePurchase.mutateAsync({ id: purchaseId, payload: buildCreatePayload(formValues) })
        enqueueSnackbar(t('messages.received'), { variant: 'success' })
        const latestReceive = [...(updatedPurchase.receives ?? [])]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        router.push(`/purchases/${purchaseId}/labels${latestReceive ? `?receiveId=${latestReceive.id}` : ''}`)
      }
    } catch (error) {
      const apiError = toAppApiError(error)
      setServerError(apiError.message)
    }
  })

  if (purchaseQuery.isLoading || (isEditing && receiveQuery.isLoading)) {
    return <PageLoader />
  }

  if (purchaseQuery.isError) {
    return (
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">{t('receive.title')}</Typography>
          <Tooltip title="Back">
            <IconButton size="small" onClick={() => router.push(`/purchases/${purchaseId}`)}>
              <ArrowBack />
            </IconButton>
          </Tooltip>
        </Stack>
        <Alert severity="error">{toAppApiError(purchaseQuery.error).message}</Alert>
      </Stack>
    )
  }

  if (isEditing && receiveQuery.isError) {
    return (
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4">{t('receive.title')}</Typography>
          <Tooltip title="Back">
            <IconButton size="small" onClick={() => router.push(`/purchases/${purchaseId}`)}>
              <ArrowBack />
            </IconButton>
          </Tooltip>
        </Stack>
        <Alert severity="error">{toAppApiError(receiveQuery.error).message}</Alert>
      </Stack>
    )
  }

  const columnSx = {
    checkbox: { width: 48, minWidth: 48 },
    item: { width: 280, minWidth: 280 },
    unit: { width: 70, minWidth: 70 },
    unitCost: { width: 100, minWidth: 100 },
    originalQty: { width: 80, minWidth: 80 },
    receivedQty: { width: 100, minWidth: 100 },
    qty: { width: 110, minWidth: 110 },
    lot: { width: 170, minWidth: 170 },
    serials: { width: 160, minWidth: 160 },
    details: { width: 60, minWidth: 60 },
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Stack spacing={0.5}>
          <Typography variant="h4">
            {isEditing ? t('common:buttons.edit') : t('receive.title')}
          </Typography>
          {purchase?.purchase_number && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {purchase.purchase_number}
            </Typography>
          )}
        </Stack>
        <Tooltip title={t('common:buttons.back')}>
          <IconButton size="small" onClick={() => router.push(`/purchases/${purchaseId}`)}>
            <ArrowBack />
          </IconButton>
        </Tooltip>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2.5}>
            <Typography variant="subtitle2">{t('detail.title')}</Typography>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="h5">{purchase?.purchase_number}</Typography>
              {purchase?.status && <Chip size="small" label={t(`statuses.${purchase.status}`)} variant="outlined" />}
              {purchase?.payment_status && <Chip size="small" label={t(`paymentStatuses.${purchase.payment_status}`)} variant="outlined" />}
            </Stack>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr 1fr' },
                gap: { xs: 1.25, md: 2 },
                pt: 2,
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Stack spacing={1}>
                <Typography variant="body2"><strong>{t('detail.supplier')}:</strong> {purchase?.supplier?.name ?? '-'}</Typography>
                <Typography variant="body2"><strong>{t('detail.poNumber')}:</strong> {purchase?.purchase_number}</Typography>
                <Typography variant="body2"><strong>{t('detail.date')}:</strong> {purchase?.purchase_date ? formatAppDate(purchase.purchase_date, dateFormat, i18n.language) : '-'}</Typography>
                {purchase?.supplier_invoice_no && (
                  <Typography variant="body2"><strong>{t('detail.invoice')}:</strong> {purchase.supplier_invoice_no}</Typography>
                )}
              </Stack>
              <Stack spacing={1}>
                <Typography variant="body2"><strong>{t('detail.branch')}:</strong> {purchase?.branch?.name ?? '-'}</Typography>
                <Typography variant="body2"><strong>{t('detail.warehouse')}:</strong> {purchase?.warehouse?.name ?? '-'}</Typography>
                {purchase?.expected_date && (
                  <Typography variant="body2"><strong>{t('detail.expected')}:</strong> {formatAppDate(purchase.expected_date, dateFormat, i18n.language)}</Typography>
                )}
              </Stack>
              <Stack spacing={1}>
                <Typography variant="body2"><strong>{t('detail.createdAt')}:</strong> {purchase?.created_at ? formatAppDateTime(purchase.created_at, dateFormat, i18n.language) : '-'}</Typography>
                <Typography variant="body2"><strong>{t('detail.createdBy')}:</strong> {purchase?.creator?.name ?? '-'}</Typography>
                {purchase?.received_at && (
                  <Typography variant="body2"><strong>{t('detail.received')}:</strong> {formatAppDateTime(purchase.received_at, dateFormat, i18n.language)}</Typography>
                )}
                {purchase?.receiver && (
                  <Typography variant="body2"><strong>{t('detail.receivedBy')}:</strong> {purchase.receiver?.name ?? '-'}</Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Box component="form" noValidate onSubmit={submit}>
        <Stack spacing={3}>
          {serverError && <Alert severity="error">{serverError}</Alert>}

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2.5}>
                <Typography variant="subtitle2">{t('receive.receiveDetails')}</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '220px 1fr' }, gap: 2 }}>
                  <Controller
                    name="received_at"
                    control={control}
                    render={({ field }) => (
                      <AppDatePicker
                        label={t('receive.receiveDate')}
                        value={field.value || ''}
                        onChange={field.onChange}
                        error={!!errors.received_at}
                        helperText={errors.received_at?.message}
                      />
                    )}
                  />
                  <Controller
                    name="notes"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} value={field.value ?? ''} label={t('receive.notes')} error={!!errors.notes} helperText={errors.notes?.message} />
                    )}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2.5}>
                <PurchaseReceiveItemsTable
                  fields={fields}
                  control={control}
                  errors={errors}
                  selectedItemIds={selectedItemIds}
                  onSelectedItemIdsChange={setSelectedItemIds}
                  onDetailItem={setDetailItemIndex}
                  onDeleteTarget={setDeleteTarget}
                  t={t}
                  columnSx={columnSx}
                  currencyFormatter={currencyFormatter}
                />
              </Stack>
            </CardContent>
          </Card>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => router.push(`/purchases/${purchaseId}`)} disabled={isSaving}>
              {t('common:buttons.cancel')}
            </Button>
            <Button type="submit" variant="contained" disabled={isSaving}>
              {isSaving ? <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} /> : null}
              {isEditing ? t('common:buttons.save') : t('receive.receive')}
            </Button>
          </Box>
        </Stack>
      </Box>

      {detailItemIndex !== null && (
        <PurchaseReceiveItemDialog
          open={detailItemIndex !== null}
          index={detailItemIndex}
          productLabel={fields[detailItemIndex]?.product_label ?? ''}
          sku={fields[detailItemIndex]?.sku}
          stockTracking={fields[detailItemIndex]?.stock_tracking}
          hasExpiry={fields[detailItemIndex]?.has_expiry}
          control={control}
          errors={errors}
          onClose={() => setDetailItemIndex(null)}
        />
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title={deleteTarget?.itemId === '__bulk__' ? t('receive.deleteBulkTitle') : t('receive.deleteItemTitle')}
        message={
          deleteTarget?.itemId === '__bulk__'
            ? t('receive.deleteBulkConfirm', { count: selectedItemIds.size })
            : t('receive.deleteItemConfirm', { label: deleteTarget?.label ?? '' })
        }
        confirmText={t('common:buttons.delete')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteItemMutation.isPending}
        confirmColor="error"
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (!deleteTarget) return

          try {
            if (isEditing && receiveId) {
              const ids = deleteTarget.itemId === '__bulk__'
                ? fields.filter((f) => selectedItemIds.has(String(f.fieldId))).map((f) => f.id).filter(Boolean) as string[]
                : [fields.find((f) => String(f.fieldId) === deleteTarget.itemId)?.id].filter(Boolean) as string[]

              if (ids.length === 0) return

              for (const itemId of ids) {
                await deleteItemMutation.mutateAsync({ purchaseId, receiveId, itemId })
              }

              enqueueSnackbar(t('receive.itemDeleted'), { variant: 'success' })
            } else {
              if (deleteTarget.itemId === '__bulk__') {
                const indices = fields
                  .map((f, i) => (selectedItemIds.has(String(f.fieldId)) ? i : -1))
                  .filter((i) => i >= 0)
                  .sort((a, b) => b - a)
                indices.forEach((i) => remove(i))
              } else if (deleteTarget.index !== undefined) {
                remove(deleteTarget.index)
              }
            }

            setSelectedItemIds(new Set())
          } catch (error) {
            enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
          } finally {
            setDeleteTarget(null)
          }
        }}
      />
    </Stack>
  )
}
