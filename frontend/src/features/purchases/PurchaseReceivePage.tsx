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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import PageHeader from '@/components/common/PageHeader'
import PageLoader from '@/components/ui/PageLoader'
import { ArrowBack } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { receivePurchaseSchema, type ReceivePurchaseFormInput, type ReceivePurchaseFormValues } from './schema'
import { UnitConversionBadge } from '@/features/sales/components/UnitConversionBadge'
import { useAppDateFormat } from '@/features/settings/useAppDateFormat'
import { usePurchaseQuery, usePurchaseReceiveQuery, useReceivePurchaseMutation, useUpdatePurchaseReceiveMutation } from './hooks'
import { formatAppDate, formatAppDateTime } from '@/utils/dateFormat'
import type { PurchaseReceive, ReceivePurchasePayload, UpdatePurchaseReceivePayload } from '@/types/purchase'

interface PurchaseReceivePageProps {
  purchaseId: string
  receiveId?: string | null
}

const today = () => new Date().toISOString().slice(0, 10)

function toNumber(value: string | number | null | undefined) {
  const numeric = Number(value ?? 0)
  return Number.isFinite(numeric) ? numeric : 0
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
      received_at: receiveRecord.received_at ?? today(),
      notes: receiveRecord.notes ?? '',
      items: (receiveRecord.items ?? []).map((item) => {
        const purchaseItem = purchase?.items?.find((pi) => pi.id === item.purchase_item_id)
        const itemQuantity = toNumber(purchaseItem?.quantity ?? 0)
        return {
          id: item.id,
          purchase_item_id: item.purchase_item_id,
          product_label: purchaseItem ? itemLabel(purchaseItem) : item.purchase_item_id,
          sku: purchaseItem ? itemSku(purchaseItem) : null,
          stock_tracking: purchaseItem?.product?.stock_tracking ?? 'none',
          has_expiry: purchaseItem?.product?.has_expiry ?? false,
          sub_unit_id: purchaseItem?.sub_unit_id ?? null,
          _conversion_factor: purchaseItem?.sub_unit?.conversion_factor ?? null,
          _base_unit_label: purchaseItem?.product?.unit?.short_name ?? null,
          sub_unit_label: purchaseItem?.sub_unit?.short_name ?? null,
          remaining_quantity: itemQuantity - toNumber(purchaseItem?.received_quantity ?? 0) + item.quantity,
          item_quantity: itemQuantity,
          fully_received: false,
          quantity: item.quantity,
          lot_number: item.lot_number ?? '',
          manufacture_date: item.manufacture_date ?? null,
          expiry_date: item.expiry_date ?? null,
          serial_numbers_text: (item.serial_numbers ?? []).join('\n'),
          warranty_expires: item.warranty_expires ?? null,
          notes: item.notes ?? '',
        }
      }),
    }
  }

  return {
    received_at: today(),
    notes: '',
    items: (purchase?.items ?? [])
      .map((item) => {
        const itemQuantity = toNumber(item.quantity)
        const receivedQuantity = toNumber(item.received_quantity)
        const remainingQuantity = Math.max(0, itemQuantity - receivedQuantity)
        return {
          purchase_item_id: item.id,
          product_label: itemLabel(item),
          sku: itemSku(item),
          stock_tracking: item.product?.stock_tracking ?? 'none',
          has_expiry: item.product?.has_expiry ?? false,
          sub_unit_id: item.sub_unit_id ?? null,
          _conversion_factor: item.sub_unit?.conversion_factor ?? null,
          _base_unit_label: item.product?.unit?.short_name ?? null,
          sub_unit_label: item.sub_unit?.short_name ?? null,
          remaining_quantity: remainingQuantity,
          item_quantity: itemQuantity,
          fully_received: remainingQuantity === 0,
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
  const dateFormat = useAppDateFormat()
  const isEditing = !!receiveId

  const purchaseQuery = usePurchaseQuery(purchaseId)
  const receiveQuery = usePurchaseReceiveQuery(purchaseId, receiveId ?? null)
  const receivePurchase = useReceivePurchaseMutation()
  const updateReceive = useUpdatePurchaseReceiveMutation()
  const isSaving = receivePurchase.isPending || updateReceive.isPending
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
  const { fields } = useFieldArray({ control, name: 'items', keyName: 'fieldId' })

  const submit = handleSubmit(async (formValues) => {
    setServerError('')
    try {
      if (isEditing && receiveId) {
        await updateReceive.mutateAsync({ purchaseId, receiveId, payload: buildUpdatePayload(formValues) })
        enqueueSnackbar(t('receive.receiveUpdated'), { variant: 'success' })
      } else {
        await receivePurchase.mutateAsync({ id: purchaseId, payload: buildCreatePayload(formValues) })
        enqueueSnackbar(t('messages.received'), { variant: 'success' })
      }
      router.push(`/purchases/${purchaseId}`)
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
        <PageHeader title={t('receive.title')} actions={
          <Tooltip title={t('common:buttons.back')}>
            <IconButton size="small" onClick={() => router.push(`/purchases/${purchaseId}`)}>
              <ArrowBack />
            </IconButton>
          </Tooltip>
        } />
        <Alert severity="error">{toAppApiError(purchaseQuery.error).message}</Alert>
      </Stack>
    )
  }

  if (isEditing && receiveQuery.isError) {
    return (
      <Stack spacing={3}>
        <PageHeader title={t('receive.title')} actions={
          <Tooltip title={t('common:buttons.back')}>
            <IconButton size="small" onClick={() => router.push(`/purchases/${purchaseId}`)}>
              <ArrowBack />
            </IconButton>
          </Tooltip>
        } />
        <Alert severity="error">{toAppApiError(receiveQuery.error).message}</Alert>
      </Stack>
    )
  }

  const columnSx = {
    item: { width: 180, minWidth: 180 },
    unit: { width: 70, minWidth: 70 },
    originalQty: { width: 80, minWidth: 80 },
    receivedQty: { width: 100, minWidth: 100 },
    qty: { width: 110, minWidth: 110 },
    lot: { width: 200, minWidth: 200 },
    serials: { width: 160, minWidth: 160 },
    notes: { width: 130, minWidth: 130 },
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title={isEditing ? t('common:buttons.edit') : t('receive.title')}
        description={purchase?.purchase_number ? `${isEditing ? t('common:buttons.edit') : t('receive.title')} - ${purchase.purchase_number}` : undefined}
        actions={
          <Tooltip title={t('common:buttons.back')}>
            <IconButton size="small" onClick={() => router.push(`/purchases/${purchaseId}`)}>
              <ArrowBack />
            </IconButton>
          </Tooltip>
        }
      />

      <Card variant="outlined">
        <CardContent sx={{ p: { xs: 2, md: 3 }, '&:last-child': { pb: { xs: 2, md: 3 } } }}>
          <Stack spacing={2}>
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
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent sx={{ p: '0 !important' }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 1200, tableLayout: 'fixed' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={columnSx.item}>{t('receive.item')}</TableCell>
                      <TableCell sx={columnSx.unit}>{t('form.subUnit')}</TableCell>
                      <TableCell sx={columnSx.originalQty} align="center">{t('receive.originalQty')}</TableCell>
                      <TableCell sx={columnSx.receivedQty} align="center">{t('receive.receivedQty')}</TableCell>
                      <TableCell sx={columnSx.qty}>{t('receive.receiveQty')}</TableCell>
                      <TableCell sx={columnSx.lot}>{t('receive.lot')}</TableCell>
                      <TableCell sx={columnSx.serials}>{t('receive.serials')}</TableCell>
                      <TableCell sx={columnSx.notes}>{t('receive.notes')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.fieldId}>
                        <TableCell sx={columnSx.item}>
                          <Stack spacing={0.25}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{field.product_label}</Typography>
                            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {field.sku || '-'}
                              </Typography>
                              {field.sub_unit_id && field._conversion_factor ? (
                                <UnitConversionBadge
                                  conversionFactor={field._conversion_factor}
                                  baseUnitLabel={field._base_unit_label ?? ''}
                                  subUnitLabel={field.sub_unit_label ?? ''}
                                  quantity={Number(field.quantity)}
                                />
                              ) : field._base_unit_label ? (
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  · {field._base_unit_label}
                                </Typography>
                              ) : null}
                            </Stack>
                            {field.stock_tracking && field.stock_tracking !== 'none' && (
                              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {field.stock_tracking}
                              </Typography>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell sx={columnSx.unit}>
                          {field.sub_unit_id ? (field.sub_unit_label ?? '-') : (field._base_unit_label ?? '-')}
                        </TableCell>
                        <TableCell sx={columnSx.originalQty} align="center">
                          <Typography variant="body2">{field.item_quantity}</Typography>
                        </TableCell>
                        <TableCell sx={columnSx.receivedQty} align="center">
                          <Typography variant="body2">{field.item_quantity - field.remaining_quantity}</Typography>
                        </TableCell>
                        <TableCell sx={columnSx.qty}>
                            <Controller
                              name={`items.${index}.quantity`}
                              control={control}
                              render={({ field: f }) => (
                                <TextField
                                  {...f}
                                  type="number"
                                  error={!!errors.items?.[index]?.quantity}
                                  helperText={errors.items?.[index]?.quantity?.message}
                                  slotProps={{ htmlInput: { min: 0, max: field.item_quantity, step: 0.0001 } }}
                                />
                              )}
                            />
                        </TableCell>
                        <TableCell sx={columnSx.lot}>
                          {field.stock_tracking === 'lot' || field.has_expiry ? (
                            <Stack spacing={1}>
                              {field.stock_tracking === 'lot' && (
                                <Controller
                                  name={`items.${index}.lot_number`}
                                  control={control}
                                  render={({ field: f }) => (
                                    <TextField
                                      {...f}
                                      value={f.value ?? ''}
                                      label={t('receive.lot')}
                                      error={!!errors.items?.[index]?.lot_number}
                                      helperText={errors.items?.[index]?.lot_number?.message}
                                    />
                                  )}
                                />
                              )}
                              <Controller
                                name={`items.${index}.manufacture_date`}
                                control={control}
                                render={({ field: f }) => (
                                  <AppDatePicker
                                    label={t('receive.manufactureDate')}
                                    value={f.value ?? ''}
                                    onChange={f.onChange}
                                  />
                                )}
                              />
                              <Controller
                                name={`items.${index}.expiry_date`}
                                control={control}
                                render={({ field: f }) => (
                                  <AppDatePicker
                                    label={t('receive.expiryDate')}
                                    value={f.value ?? ''}
                                    onChange={f.onChange}
                                  />
                                )}
                              />
                              {field.stock_tracking === 'lot' && (
                                <Controller
                                  name={`items.${index}.warranty_expires`}
                                  control={control}
                                  render={({ field: f }) => (
                                  <AppDatePicker
                                    label={t('receive.warrantyExpires')}
                                    value={f.value ?? ''}
                                    onChange={f.onChange}
                                  />
                                  )}
                                />
                              )}
                            </Stack>
                          ) : (
                            <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={columnSx.serials}>
                          {field.stock_tracking === 'serial' ? (
                            <Controller
                              name={`items.${index}.serial_numbers_text`}
                              control={control}
                              render={({ field: f }) => (
                                <TextField
                                  {...f}
                                  value={f.value ?? ''}
                                  multiline
                                  minRows={1}
                                  maxRows={3}
                                  placeholder={t('receive.serialsPlaceholder')}
                                  error={!!errors.items?.[index]?.serial_numbers_text}
                                  helperText={errors.items?.[index]?.serial_numbers_text?.message}
                                  onPaste={(event: React.ClipboardEvent) => {
                                    const pasted = event.clipboardData.getData('text')
                                    const split = pasted.split(/[\r\n,;\t]+|  +/).map((s) => s.trim()).filter(Boolean)
                                    if (split.length > 1) {
                                      event.preventDefault()
                                      const existing = (f.value ?? '').trim()
                                      const merged = existing ? existing + '\n' + split.join('\n') : split.join('\n')
                                      f.onChange(merged)
                                    }
                                  }}
                                />
                              )}
                            />
                          ) : (
                            <Typography variant="body2" sx={{ color: 'text.disabled' }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={columnSx.notes}>
                          <Controller
                            name={`items.${index}.notes`}
                            control={control}
                            render={({ field: f }) => (
                          <TextField {...f} value={f.value ?? ''}  />
                        )}
                      />
                    </TableCell>
                  </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
    </Stack>
  )
}
