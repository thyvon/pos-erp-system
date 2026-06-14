'use client'

import { useMemo, type ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
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
import { Controller, type Control, type FieldArrayWithId, type FieldErrors } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import EmptyState from '@/components/common/EmptyState'
import { DeleteOutlined, EditOutlined, PointOfSaleOutlined } from '@/components/ui/icons'
import { UnitConversionBadge } from '@/features/sales/components/UnitConversionBadge'
import { UnitToggle } from '@/features/sales/components/UnitToggle'
import { CurrencyAmountStack } from './CurrencyAmountStack'
import { formatUsdKhrAmount, lineTotal, round, toNumber } from '../formHelpers'
import type { SaleFormInput, SaleFormValues } from '../schema'

const cartColumnSx = {
  product: { width: 250, minWidth: 250 },
  unit: { width: 100, minWidth: 100 },
  quantity: { width: 150, minWidth: 150 },
  price: { width: 140, minWidth: 140 },
  total: { width: 112, minWidth: 112 },
  actions: { width: 88, minWidth: 88 },
} as const

type CartTotals = {
  subtotal: number
  discount: number
  tax: number
  shipping: number
}

type AmountDisplay = {
  usd: string
  khr: string
}

interface PosCartSectionProps {
  control: Control<SaleFormInput, unknown, SaleFormValues>
  errors: FieldErrors<SaleFormInput>
  itemFields: Array<FieldArrayWithId<SaleFormInput, 'items', 'fieldId'>>
  watchedItems: Array<Partial<SaleFormInput['items'][number]>>
  isSaving: boolean
  currency: string
  currencyFormatter: Intl.NumberFormat
  exchangeRate: number
  taxScope: string
  totals: CartTotals
  totalDisplay: AmountDisplay
  paymentDisplay: AmountDisplay
  changeDisplay: AmountDisplay
  onQuantityChange: (index: number, quantity: number) => void
  onChangeUnit: (index: number, subUnitId: string | null, unitLabel: string, unitPrice: number) => void
  onEditItem: (index: number) => void
  onRemoveItem: (index: number) => void
  onEditSummary: (summary: 'discount' | 'tax' | 'shipping') => void
  children: ReactNode
}

function isSerialTrackedCartLine(
  field: Partial<SaleFormInput['items'][number]>,
  watchedItem: Partial<SaleFormInput['items'][number]> | undefined,
) {
  return (watchedItem?.stock_tracking ?? field.stock_tracking) === 'serial'
    || Boolean(watchedItem?.serial_id ?? field.serial_id)
}

export function PosCartSection({
  control,
  errors,
  itemFields,
  watchedItems,
  isSaving,
  currency,
  currencyFormatter,
  exchangeRate,
  taxScope,
  totals,
  totalDisplay,
  paymentDisplay,
  changeDisplay,
  onQuantityChange,
  onChangeUnit,
  onEditItem,
  onRemoveItem,
  onEditSummary,
  children,
}: PosCartSectionProps) {
  const { t } = useTranslation(['sales'])
  const lineTotals = useMemo(
    () => watchedItems.map((item) => lineTotal(item, taxScope)),
    [watchedItems, taxScope],
  )

  return (
    <Box
      sx={{
        minHeight: 0,
        height: '100%',
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 0.75,
        p: { xs: 0.75, md: 1 },
        boxSizing: 'border-box',
        bgcolor: 'background.paper',
        borderLeft: 1,
        borderRight: 1,
        borderBottom: 1,
        borderColor: 'divider',
        borderBottomLeftRadius: 1.5,
        borderBottomRightRadius: 1.5,
        overflow: 'hidden',
      }}
    >
      {typeof errors.items?.message === 'string' && <Alert severity="error">{errors.items.message}</Alert>}

      <Box sx={{ minHeight: 0, flex: '1 1 auto', overflow: 'hidden', display: 'flex' }}>
        <TableContainer
          sx={{
            display: { xs: 'none', md: 'block' },
            flex: '1 1 auto',
            minHeight: 220,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            overflow: 'auto',
            overscrollBehavior: 'contain',
          }}
        >
          <Table sx={{ minWidth: 840, height: itemFields.length === 0 ? '100%' : 'auto', tableLayout: 'fixed', '& .MuiTableCell-root': { py: 1 } }}>
            <TableHead
              sx={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                bgcolor: 'background.paper',
              }}
            >
              <TableRow>
                <TableCell sx={cartColumnSx.product}>{t('items.product')}</TableCell>
                <TableCell sx={cartColumnSx.unit}>{t('items.unit')}</TableCell>
                <TableCell sx={cartColumnSx.quantity} align="right">{t('items.quantity')}</TableCell>
                <TableCell sx={cartColumnSx.price} align="right">{t('items.unitPrice')}</TableCell>
                <TableCell sx={cartColumnSx.total} align="right">{t('items.total')}</TableCell>
                <TableCell sx={cartColumnSx.actions} align="center">{t('columns.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {itemFields.length === 0 && (
                <TableRow sx={{ height: '100%' }}>
                  <TableCell colSpan={6} sx={{ borderBottom: 0, height: '100%', p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ minHeight: 220, height: '100%', display: 'flex', alignItems: 'center' }}>
                      <EmptyState compact icon={<PointOfSaleOutlined />} title={t('pos.emptyCart')} />
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {itemFields.map((field, index) => {
                const isSerialTrackedLine = isSerialTrackedCartLine(field, watchedItems[index])

                return (
                  <TableRow key={field.fieldId}>
                    <TableCell sx={cartColumnSx.product}>
                      <Stack spacing={0.25}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap title={field.product_label || field.product_id}>{field.product_label || field.product_id}</Typography>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', minWidth: 0 }}>
                          <Typography variant="caption" noWrap sx={{ color: 'text.secondary', minWidth: 0 }}>
                            {field.sku || '-'}
                          </Typography>
                          {watchedItems[index]?.sub_unit_id && field._conversion_factor ? (
                            <UnitConversionBadge
                              conversionFactor={field._conversion_factor}
                              baseUnitLabel={field._base_unit_label ?? ''}
                              subUnitLabel={field.sub_unit_label ?? ''}
                              quantity={Number(watchedItems[index]?.quantity ?? 0)}
                            />
                          ) : field._base_unit_label ? (
                            <Typography variant="caption" sx={{ color: 'text.secondary', flex: '0 0 auto' }}>
                              · {field._base_unit_label}
                            </Typography>
                          ) : null}
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell sx={cartColumnSx.unit}>
                      <UnitToggle
                        subUnitOptionId={field._sub_unit_option_id ?? null}
                        currentSubUnitId={field.sub_unit_id ?? null}
                        baseUnitLabel={field._base_unit_label ?? null}
                        subUnitLabel={field.sub_unit_label ?? null}
                        baseUnitPrice={Number(field._base_unit_price ?? 0) || 0}
                        subUnitPrice={Number(field._sub_unit_price ?? 0) || 0}
                        disabled={isSaving}
                        onChange={(nextSubUnitId, nextLabel, nextPrice) => onChangeUnit(index, nextSubUnitId, nextLabel, nextPrice)}
                      />
                    </TableCell>
                    <TableCell align="right" sx={cartColumnSx.quantity}>
                      <Stack direction="row" spacing={0} sx={{ justifyContent: 'flex-end' }}>
                        <Button
                          type="button"
                          variant="outlined"
                          size="small"
                          disabled={isSaving || isSerialTrackedLine}
                          sx={{ minWidth: 32, px: 0.75, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                          onClick={() => onQuantityChange(index, Math.max(0.0001, round(toNumber(watchedItems[index]?.quantity ?? field.quantity) - 1)))}
                        >
                          -
                        </Button>
                        <Controller name={`items.${index}.quantity`} control={control} render={({ field }) => (
                          <TextField
                            {...field}
                            type="number"
                            error={!!errors.items?.[index]?.quantity}
                            helperText={errors.items?.[index]?.quantity?.message}
                            disabled={isSaving || isSerialTrackedLine}
                            required
                            sx={{ width: 78, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                            slotProps={{ htmlInput: { min: 0.0001, step: 0.0001, style: { textAlign: 'center' } } }}
                          />
                        )} />
                        <Button
                          type="button"
                          variant="outlined"
                          size="small"
                          disabled={isSaving || isSerialTrackedLine}
                          sx={{ minWidth: 32, px: 0.75, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                          onClick={() => onQuantityChange(index, round(toNumber(watchedItems[index]?.quantity ?? field.quantity) + 1))}
                        >
                          +
                        </Button>
                      </Stack>
                    </TableCell>
                    <TableCell align="right" sx={cartColumnSx.price}>
                      <Controller name={`items.${index}.unit_price`} control={control} render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          type="number"
                          error={!!errors.items?.[index]?.unit_price}
                          helperText={errors.items?.[index]?.unit_price?.message}
                          required
                          slotProps={{
                            htmlInput: { min: 0, step: 0.01, style: { textAlign: 'right' } },
                            input: { startAdornment: <InputAdornment position="start">{currency}</InputAdornment> },
                          }}
                        />
                      )} />
                    </TableCell>
                    <TableCell align="right" sx={cartColumnSx.total}>
                      <Typography variant="subtitle2">{currencyFormatter.format(lineTotals[index] ?? lineTotal(watchedItems[index] ?? field, taxScope))}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={cartColumnSx.actions}>
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center' }}>
                        <Tooltip title={t('pos.actions.editLine')}>
                          <span>
                            <IconButton size="small" disabled={isSaving} onClick={() => onEditItem(index)}>
                              <EditOutlined />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title={t('actions.removeItem')}>
                          <span>
                            <IconButton size="small" color="error" disabled={isSaving} onClick={() => onRemoveItem(index)}>
                              <DeleteOutlined />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack
          spacing={1}
          sx={{
            display: { xs: 'flex', md: 'none' },
            flex: '1 1 auto',
            minHeight: 220,
            minWidth: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            pr: 0.5,
          }}
        >
          {itemFields.length === 0 && (
            <EmptyState compact icon={<PointOfSaleOutlined />} title={t('pos.emptyCart')} />
          )}
          {itemFields.map((field, index) => {
            const isSerialTrackedLine = isSerialTrackedCartLine(field, watchedItems[index])

            return (
              <Box key={field.fieldId} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.25 }}>
                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }} title={field.product_label || field.product_id}>
                        {field.product_label || field.product_id}
                      </Typography>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>{field.sku || '-'}</Typography>
                        {watchedItems[index]?.sub_unit_id && field._conversion_factor ? (
                          <UnitConversionBadge
                            conversionFactor={field._conversion_factor}
                            baseUnitLabel={field._base_unit_label ?? ''}
                            subUnitLabel={field.sub_unit_label ?? ''}
                            quantity={Number(watchedItems[index]?.quantity ?? 0)}
                          />
                        ) : field._base_unit_label ? (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            · {field._base_unit_label}
                          </Typography>
                        ) : null}
                      </Stack>
                    </Stack>
                    <Typography variant="subtitle2" sx={{ flex: '0 0 auto', fontWeight: 800 }}>
                      {currencyFormatter.format(lineTotals[index] ?? lineTotal(watchedItems[index] ?? field, taxScope))}
                    </Typography>
                  </Stack>

                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    <UnitToggle
                      subUnitOptionId={field._sub_unit_option_id ?? null}
                      currentSubUnitId={field.sub_unit_id ?? null}
                      baseUnitLabel={field._base_unit_label ?? null}
                      subUnitLabel={field.sub_unit_label ?? null}
                      baseUnitPrice={Number(field._base_unit_price ?? 0) || 0}
                      subUnitPrice={Number(field._sub_unit_price ?? 0) || 0}
                      disabled={isSaving}
                      onChange={(nextSubUnitId, nextLabel, nextPrice) => onChangeUnit(index, nextSubUnitId, nextLabel, nextPrice)}
                    />
                    <Controller name={`items.${index}.unit_price`} control={control} render={({ field }) => (
                      <TextField
                        {...field}
                        fullWidth
                        type="number"
                        label={t('items.unitPrice')}
                        error={!!errors.items?.[index]?.unit_price}
                        helperText={errors.items?.[index]?.unit_price?.message}
                        required
                        slotProps={{
                          htmlInput: { min: 0, step: 0.01, style: { textAlign: 'right' } },
                          input: { startAdornment: <InputAdornment position="start">{currency}</InputAdornment> },
                        }}
                      />
                    )} />
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={0}>
                      <Button
                        type="button"
                        variant="outlined"
                        size="small"
                        disabled={isSaving || isSerialTrackedLine}
                        sx={{ minWidth: 36, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                        onClick={() => onQuantityChange(index, Math.max(0.0001, round(toNumber(watchedItems[index]?.quantity ?? field.quantity) - 1)))}
                      >
                        -
                      </Button>
                      <Controller name={`items.${index}.quantity`} control={control} render={({ field }) => (
                        <TextField
                          {...field}
                          type="number"
                          error={!!errors.items?.[index]?.quantity}
                          helperText={errors.items?.[index]?.quantity?.message}
                          disabled={isSaving || isSerialTrackedLine}
                          required
                          sx={{ width: 88, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                          slotProps={{ htmlInput: { min: 0.0001, step: 0.0001, style: { textAlign: 'center' } } }}
                        />
                      )} />
                      <Button
                        type="button"
                        variant="outlined"
                        size="small"
                        disabled={isSaving || isSerialTrackedLine}
                        sx={{ minWidth: 36, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        onClick={() => onQuantityChange(index, round(toNumber(watchedItems[index]?.quantity ?? field.quantity) + 1))}
                      >
                        +
                      </Button>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title={t('pos.actions.editLine')}>
                        <span>
                          <IconButton size="small" disabled={isSaving} onClick={() => onEditItem(index)}>
                            <EditOutlined />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title={t('actions.removeItem')}>
                        <span>
                          <IconButton size="small" color="error" disabled={isSaving} onClick={() => onRemoveItem(index)}>
                            <DeleteOutlined />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Stack>
              </Box>
            )
          })}
        </Stack>
      </Box>

      <Box
        sx={{
          flex: '0 0 auto',
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
          display: 'grid',
          gap: 1,
          p: 0.75,
          bgcolor: 'background.default',
          borderTop: 1,
          borderColor: 'divider',
          boxShadow: '0 -8px 20px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(4, minmax(0, 1fr))',
              xl: 'repeat(7, minmax(0, 1fr))',
            },
            gap: 0.75,
          }}
        >
          {[
            { key: 'subtotal', label: t('fields.subtotal'), amount: formatUsdKhrAmount(totals.subtotal, exchangeRate), color: undefined, edit: undefined, emphasis: false },
            { key: 'discount', label: t('fields.discount'), amount: formatUsdKhrAmount(totals.discount, exchangeRate), color: 'error.main', edit: 'discount' as const, emphasis: false },
            { key: 'tax', label: t('fields.tax'), amount: formatUsdKhrAmount(totals.tax, exchangeRate), color: undefined, edit: 'tax' as const, emphasis: false },
            { key: 'shipping', label: t('pos.summary.delivery'), amount: formatUsdKhrAmount(totals.shipping, exchangeRate), color: undefined, edit: 'shipping' as const, emphasis: false },
            { key: 'payable', label: t('pos.amountToPay'), amount: totalDisplay, color: 'success.dark', edit: undefined, emphasis: true },
            { key: 'entered', label: t('payment.totalEntered'), amount: paymentDisplay, color: 'primary.main', edit: undefined, emphasis: false },
            { key: 'change', label: t('payment.changeBack'), amount: changeDisplay, color: 'success.dark', edit: undefined, emphasis: false },
          ].map((item) => (
            <Box
              key={item.key}
              sx={{
                minWidth: 0,
                p: 1,
                border: 1,
                borderColor: item.emphasis ? 'success.main' : 'divider',
                borderRadius: 1.25,
                bgcolor: item.emphasis ? 'success.lighter' : 'background.paper',
                boxShadow: item.emphasis ? '0 8px 18px rgba(22, 163, 74, 0.12)' : '0 4px 12px rgba(15, 23, 42, 0.06)',
              }}
            >
              <Stack spacing={0.75} sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={0.35} sx={{ alignItems: 'center', justifyContent: 'space-between', minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: item.emphasis ? 'success.dark' : 'text.secondary',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                    }}
                    noWrap
                  >
                    {item.label}
                  </Typography>
                  {item.edit && (
                    <Tooltip title={t('pos.summary.edit')}>
                      <IconButton size="small" onClick={() => onEditSummary(item.edit)} sx={{ p: 0.25, flex: '0 0 auto' }}>
                        <EditOutlined fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
                <CurrencyAmountStack
                  amount={item.amount}
                  color={item.color ?? 'text.primary'}
                  primaryVariant="h6"
                  secondaryVariant="body2"
                />
              </Stack>
            </Box>
          ))}
        </Box>
        {children}
      </Box>
    </Box>
  )
}
