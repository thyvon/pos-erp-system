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
import { UnitConversionBadge } from '@/features/sales/components/UnitConversionBadge'
import { UnitToggle } from '@/features/sales/components/UnitToggle'
import { InventoryProductLookupPicker } from '@/features/inventory/components/InventoryProductLookupPicker'
import { DeleteOutlined, EditOutlined } from '@/components/ui/icons'
import type { InventoryProductLookupItem } from '@/types/inventory'
import { lineTotal, round, toNumber } from '../formHelpers'
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

interface PosCartSectionProps {
  control: Control<SaleFormInput, unknown, SaleFormValues>
  errors: FieldErrors<SaleFormInput>
  itemFields: Array<FieldArrayWithId<SaleFormInput, 'items', 'fieldId'>>
  watchedItems: Array<Partial<SaleFormInput['items'][number]>>
  warehouseId: string
  isSaving: boolean
  currency: string
  currencyFormatter: Intl.NumberFormat
  taxScope: string
  totals: CartTotals
  onSelectItem: (item: InventoryProductLookupItem) => void
  onQuantityChange: (index: number, quantity: number) => void
  onChangeUnit: (index: number, subUnitId: string | null, unitLabel: string, unitPrice: number) => void
  onEditItem: (index: number) => void
  onRemoveItem: (index: number) => void
  onEditSummary: (summary: 'discount' | 'tax' | 'shipping') => void
  children: ReactNode
}

export function PosCartSection({
  control,
  errors,
  itemFields,
  watchedItems,
  warehouseId,
  isSaving,
  currency,
  currencyFormatter,
  taxScope,
  totals,
  onSelectItem,
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
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Box>
        <Stack spacing={1.5}>
          <InventoryProductLookupPicker
            warehouseId={warehouseId || undefined}
            disabled={!warehouseId || isSaving}
            autoFocus
            label={t('pos.scanLabel')}
            onSelect={onSelectItem}
          />
          {typeof errors.items?.message === 'string' && <Alert severity="error">{errors.items.message}</Alert>}
        </Stack>
      </Box>

      <Box sx={{ minHeight: 0, flex: '1 1 auto', overflow: 'auto' }}>
        <TableContainer sx={{ display: { xs: 'none', md: 'block' }, minHeight: 220, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'auto' }}>
          <Table sx={{ minWidth: 840, tableLayout: 'fixed' }}>
            <TableHead>
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
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('pos.emptyCart')}</Typography>
                  </TableCell>
                </TableRow>
              )}
              {itemFields.map((field, index) => (
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
                          required
                          sx={{ width: 78, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                          slotProps={{ htmlInput: { min: 0.0001, step: 0.0001, style: { textAlign: 'center' } } }}
                        />
                      )} />
                      <Button
                        type="button"
                        variant="outlined"
                        size="small"
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Stack
          spacing={1}
          sx={{
            display: { xs: 'flex', md: 'none' },
            minHeight: 220,
            minWidth: 0,
          }}
        >
          {itemFields.length === 0 && (
            <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 1, py: 8, px: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('pos.emptyCart')}</Typography>
            </Box>
          )}
          {itemFields.map((field, index) => (
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
                        required
                        sx={{ width: 88, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                        slotProps={{ htmlInput: { min: 0.0001, step: 0.0001, style: { textAlign: 'center' } } }}
                      />
                    )} />
                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
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
          ))}
        </Stack>
        {children}
      </Box>

      <Box
        sx={{
          flex: '0 0 auto',
          borderTop: 1,
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, minmax(0, 1fr))' },
          }}
        >
          {[
            { key: 'items', label: t('pos.summary.items'), value: watchedItems.length.toString() },
            { key: 'subtotal', label: t('fields.subtotal'), value: currencyFormatter.format(totals.subtotal) },
            { key: 'discount', label: t('fields.discount'), value: currencyFormatter.format(totals.discount), color: 'error.main', edit: 'discount' as const },
            { key: 'tax', label: t('fields.tax'), value: currencyFormatter.format(totals.tax), edit: 'tax' as const },
            { key: 'shipping', label: t('fields.shipping'), value: currencyFormatter.format(totals.shipping), edit: 'shipping' as const },
          ].map((item) => (
            <Box
              key={item.key}
              sx={{
                p: 1.25,
                textAlign: 'center',
                borderRightWidth: { md: 1 },
                borderRightStyle: { md: 'solid' },
                borderRightColor: 'divider',
                borderBottomWidth: { xs: 1, md: 0 },
                borderBottomStyle: { xs: 'solid', md: 'none' },
                borderBottomColor: 'divider',
                '&:nth-of-type(2n)': { borderRightWidth: { xs: 0, md: 1 } },
                '&:nth-of-type(5)': { borderRightWidth: 0, borderBottomWidth: 0 },
              }}
            >
              <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase' }}>
                  {item.label}
                </Typography>
                {item.edit && (
                  <Tooltip title={t('pos.summary.edit')}>
                    <IconButton size="small" onClick={() => onEditSummary(item.edit)} sx={{ p: 0.25 }}>
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
              <Typography variant="subtitle2" sx={{ color: item.color ?? 'text.primary', fontWeight: 800 }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
