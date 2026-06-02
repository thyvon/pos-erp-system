'use client'

import {
  Autocomplete,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Controller } from 'react-hook-form'
import type { Control, FieldArrayWithId, FieldErrors, UseFieldArrayRemove, UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { DeleteOutlined } from '@/components/ui/icons'
import { InventoryProductLookupPicker } from '@/features/inventory/components/InventoryProductLookupPicker'
import { UnitConversionBadge } from '@/features/sales/components/UnitConversionBadge'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { formatMoney } from '@/utils/formatMoney'
import type { TaxRate } from '@/types/taxRate'
import type { PurchaseFormInput, PurchaseFormValues } from '../schema'

const discountTypes = ['fixed', 'percentage'] as const

interface PurchaseLineCalculation {
  lineTotal: number
}

interface PurchaseItemsTableProps {
  control: Control<PurchaseFormInput, unknown, PurchaseFormValues>
  errors: FieldErrors<PurchaseFormInput>
  itemFields: FieldArrayWithId<PurchaseFormInput, 'items', 'fieldId'>[]
  watchedItems: PurchaseFormInput['items']
  warehouseId?: string
  isSaving: boolean
  taxScope?: string
  taxRates: TaxRate[]
  isTaxRatesLoading: boolean
  lineCalculations: PurchaseLineCalculation[]
  setValue: UseFormSetValue<PurchaseFormInput>
  remove: UseFieldArrayRemove
  onSelectProduct: Parameters<typeof InventoryProductLookupPicker>[0]['onSelect']
}

function taxRateLabel(rate: TaxRate) {
  return `${rate.name} (${rate.rate}${rate.type === 'percentage' ? '%' : ''})`
}

export function PurchaseItemsTable({
  control,
  errors,
  itemFields,
  watchedItems,
  warehouseId,
  isSaving,
  taxScope,
  taxRates,
  isTaxRatesLoading,
  lineCalculations,
  setValue,
  remove,
  onSelectProduct,
}: PurchaseItemsTableProps) {
  const { t } = useTranslation(['purchases', 'common'])
  const currencyFormatter = useCurrencyFormatter()

  const applyTaxRate = (index: number, taxRateId: string) => {
    const taxRate = taxRates.find((item) => item.id === taxRateId)
    setValue(`items.${index}.tax_rate_id`, taxRateId)
    setValue(`items.${index}.tax_rate_type`, taxRate?.type ?? null)
    setValue(`items.${index}.tax_rate`, taxRate?.rate ?? 0)
  }

  return (
    <Stack spacing={2.5}>
      <Typography variant="subtitle2">{t('form.items')}</Typography>

      <InventoryProductLookupPicker
        warehouseId={warehouseId || undefined}
        disabled={!warehouseId || isSaving}
        onSelect={onSelectProduct}
      />

      <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
        <Table sx={{ minWidth: 1300, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 260, minWidth: 260 }}>{t('form.product')}</TableCell>
              <TableCell sx={{ width: 110, minWidth: 110 }} align="right">{t('form.quantity')}</TableCell>
              <TableCell sx={{ width: 110, minWidth: 110 }}>{t('form.subUnit')}</TableCell>
              <TableCell sx={{ width: 140, minWidth: 140 }} align="right">{t('form.unitCost')}</TableCell>
              <TableCell sx={{ width: 140, minWidth: 140 }}>{t('form.discountType')}</TableCell>
              <TableCell sx={{ width: 120, minWidth: 120 }} align="right">{t('form.discountAmount')}</TableCell>
              <TableCell sx={{ width: 150, minWidth: 150 }}>{t('form.tax')}</TableCell>
              <TableCell sx={{ width: 120, minWidth: 120 }} align="right">{t('form.subtotal')}</TableCell>
              <TableCell sx={{ width: 72, minWidth: 72 }} align="center">{t('common:buttons.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {itemFields.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {t('empty')}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {itemFields.map((field, index) => {
              const watchedItem = watchedItems[index]
              const calc = lineCalculations[index] ?? { lineTotal: 0 }

              return (
                <TableRow key={field.fieldId}>
                  <TableCell>
                    <Stack spacing={0.25}>
                      <Typography variant="body2">{field.product_label || '-'}</Typography>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {field.sku || '-'}
                        </Typography>
                        {watchedItem?.sub_unit_id && watchedItem?.conversion_factor ? (
                          <UnitConversionBadge
                            conversionFactor={watchedItem.conversion_factor}
                            baseUnitLabel={field.unit_name ?? ''}
                            subUnitLabel={field.unit_label ?? ''}
                            quantity={Number(watchedItem?.quantity ?? 0)}
                          />
                        ) : field.unit_name ? (
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            · {field.unit_name}
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
                  <TableCell align="right">
                    <Controller
                      name={`items.${index}.quantity`}
                      control={control}
                      render={({ field: itemField }) => (
                        <TextField
                          {...itemField}
                          fullWidth
                          type="number"
                          error={!!errors.items?.[index]?.quantity}
                          helperText={errors.items?.[index]?.quantity?.message}
                          required
                          slotProps={{ htmlInput: { min: 0.0001, step: 0.0001 } }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    {watchedItem?._default_sub_unit_id ? (
                      <Select
                        fullWidth
                        value={watchedItem?.sub_unit_id ?? '__none__'}
                        onChange={(event) => {
                          const value = event.target.value === '__none__' ? null : event.target.value
                          setValue(`items.${index}.sub_unit_id`, value)
                          if (value) {
                            setValue(`items.${index}.unit_label`, watchedItem?.unit_label || field.unit_name)
                          }
                        }}
                      >
                        <MenuItem value="__none__">
                          {watchedItem?.unit_name ?? t('form.noSubUnit')}
                        </MenuItem>
                        <MenuItem value={watchedItem?._default_sub_unit_id ?? ''}>
                          {watchedItem?.unit_label || t('form.subUnit')}
                        </MenuItem>
                      </Select>
                    ) : (
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Controller
                      name={`items.${index}.unit_cost`}
                      control={control}
                      render={({ field: itemField }) => (
                        <TextField
                          {...itemField}
                          fullWidth
                          type="number"
                          error={!!errors.items?.[index]?.unit_cost}
                          helperText={errors.items?.[index]?.unit_cost?.message}
                          required
                          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`items.${index}.discount_type`}
                      control={control}
                      render={({ field: itemField }) => (
                        <TextField {...itemField} fullWidth value={itemField.value ?? ''} select>
                          <MenuItem value="">{t('form.noDiscount')}</MenuItem>
                          {discountTypes.map((type) => (
                            <MenuItem key={type} value={type}>{t(`discountTypes.${type}`)}</MenuItem>
                          ))}
                        </TextField>
                      )}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Controller
                      name={`items.${index}.discount_amount`}
                      control={control}
                      render={({ field: itemField }) => (
                        <TextField
                          {...itemField}
                          fullWidth
                          value={itemField.value ?? ''}
                          type="number"
                          slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`items.${index}.tax_rate_id`}
                      control={control}
                      render={({ field: itemField }) => (
                        <Autocomplete
                          fullWidth
                          options={taxRates}
                          value={taxRates.find((rate) => rate.id === itemField.value) ?? null}
                          loading={isTaxRatesLoading}
                          getOptionLabel={taxRateLabel}
                          isOptionEqualToValue={(option, value) => option.id === value.id}
                          disabled={taxScope === 'sale'}
                          onBlur={itemField.onBlur}
                          onChange={(_, rate) => applyTaxRate(index, rate?.id ?? '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              error={!!errors.items?.[index]?.tax_rate_id}
                              helperText={errors.items?.[index]?.tax_rate_id?.message}
                            />
                          )}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatMoney(calc.lineTotal, currencyFormatter)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="error" disabled={isSaving} onClick={() => remove(index)}>
                      <DeleteOutlined />
                    </IconButton>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
