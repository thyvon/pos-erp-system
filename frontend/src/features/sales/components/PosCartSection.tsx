'use client'

import type { ReactNode } from 'react'
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
import { InventoryProductLookupPicker } from '@/features/inventory/components/InventoryProductLookupPicker'
import { DeleteOutlined, EditOutlined } from '@/components/ui/icons'
import type { InventoryProductLookupItem } from '@/types/inventory'
import { lineTotal, round, toNumber } from '../formHelpers'
import type { SaleFormInput, SaleFormValues } from '../schema'

const cartColumnSx = {
  product: { width: 400, minWidth: 400 },
  quantity: { width: 170, minWidth: 170 },
  price: { width: 160, minWidth: 160 },
  total: { width: 132, minWidth: 132 },
  actions: { width: 96, minWidth: 96 },
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
  onEditItem,
  onRemoveItem,
  onEditSummary,
  children,
}: PosCartSectionProps) {
  const { t } = useTranslation(['sales'])

  return (
    <>
      <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1, bgcolor: 'background.paper' }}>
        <Stack spacing={1.5}>
          <InventoryProductLookupPicker
            warehouseId={warehouseId || undefined}
            disabled={!warehouseId || isSaving}
            autoFocus
            label={t('pos.scanLabel')}
            helperText={warehouseId ? t('form.pickerHelp') : t('form.selectWarehouseFirst')}
            onSelect={onSelectItem}
          />
          {typeof errors.items?.message === 'string' && <Alert severity="error">{errors.items.message}</Alert>}

          <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
            <Table sx={{ minWidth: 958, tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={cartColumnSx.product}>{t('items.product')}</TableCell>
                  <TableCell sx={cartColumnSx.quantity} align="right">{t('items.quantity')}</TableCell>
                  <TableCell sx={cartColumnSx.price} align="right">{t('items.unitPrice')}</TableCell>
                  <TableCell sx={cartColumnSx.total} align="right">{t('items.total')}</TableCell>
                  <TableCell sx={cartColumnSx.actions} align="right">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itemFields.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{t('pos.emptyCart')}</Typography>
                    </TableCell>
                  </TableRow>
                )}
                {itemFields.map((field, index) => (
                  <TableRow key={field.fieldId}>
                    <TableCell sx={cartColumnSx.product}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{field.product_label || field.product_id}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {[field.sku, field.lot_number, field.serial_number, field.unit_label].filter(Boolean).join(' / ') || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={cartColumnSx.quantity}>
                      <Stack direction="row" spacing={0} sx={{ justifyContent: 'flex-end' }}>
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
                            sx={{ width: 84, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
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
                      <Typography variant="subtitle2">{currencyFormatter.format(lineTotal(watchedItems[index] ?? field, taxScope))}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={cartColumnSx.actions}>
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
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
        </Stack>
      </Box>

      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: 'background.paper',
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(5, minmax(0, 1fr))' },
            borderBottomWidth: 1,
            borderBottomStyle: 'solid',
            borderBottomColor: 'divider',
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
        {children}
      </Box>
    </>
  )
}
