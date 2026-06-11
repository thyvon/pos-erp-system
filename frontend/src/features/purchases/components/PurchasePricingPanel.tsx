'use client'

import {
  Autocomplete,
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller } from 'react-hook-form'
import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useCurrencyFormatter } from '@/features/settings/useAppCurrency'
import { formatMoney } from '@/utils/formatMoney'
import type { TaxRate } from '@/types/taxRate'
import type { PurchaseFormInput, PurchaseFormValues } from '../schema'

const discountTypes = ['fixed', 'percentage'] as const

interface PurchasePricingTotals {
  subtotal: number
  tax: number
  shipping: number
  total: number
}

interface PurchasePricingPanelProps {
  control: Control<PurchaseFormInput, unknown, PurchaseFormValues>
  errors: FieldErrors<PurchaseFormInput>
  taxScope?: string
  taxRates: TaxRate[]
  isTaxRatesLoading: boolean
  totals: PurchasePricingTotals
  setValue: UseFormSetValue<PurchaseFormInput>
}

function taxRateLabel(rate: TaxRate) {
  return `${rate.name} (${rate.rate}${rate.type === 'percentage' ? '%' : ''})`
}

export function PurchasePricingPanel({
  control,
  errors,
  taxScope,
  taxRates,
  isTaxRatesLoading,
  totals,
  setValue,
}: PurchasePricingPanelProps) {
  const { t } = useTranslation(['purchases'])
  const currencyFormatter = useCurrencyFormatter()

  return (
    <Stack spacing={2.5}>
      <Typography variant="subtitle2">{t('form.pricing')}</Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
        <Controller
          name="discount_type"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              select
              label={t('form.discountType')}
              error={!!errors.discount_type}
              helperText={errors.discount_type?.message}
              slotProps={{ select: { MenuProps: { disableScrollLock: true } } }}
            >
              <MenuItem value="">{t('form.noDiscount')}</MenuItem>
              {discountTypes.map((type) => (
                <MenuItem key={type} value={type}>{t(`discountTypes.${type}`)}</MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="discount_amount"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              type="number"
              label={t('form.discount')}
              error={!!errors.discount_amount}
              helperText={errors.discount_amount?.message}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
          )}
        />
        <Controller
          name="shipping_charges"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              value={field.value ?? ''}
              type="number"
              label={t('form.shipping')}
              error={!!errors.shipping_charges}
              helperText={errors.shipping_charges?.message}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            />
          )}
        />
        <FormControl error={!!errors.tax_scope}>
          <InputLabel id="purchase-tax-scope-label">{t('form.taxScope')}</InputLabel>
          <Controller
            name="tax_scope"
            control={control}
            render={({ field }) => (
              <Select {...field} MenuProps={{ disableScrollLock: true }} labelId="purchase-tax-scope-label" label={t('form.taxScope')}>
                <MenuItem value="line">{t('form.taxScopeLine')}</MenuItem>
                <MenuItem value="sale">{t('form.taxScopeSale')}</MenuItem>
              </Select>
            )}
          />
          <FormHelperText>{errors.tax_scope?.message}</FormHelperText>
        </FormControl>
      </Box>

      {taxScope === 'sale' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          <Controller
            name="tax_rate_id"
            control={control}
            render={({ field }) => (
              <Autocomplete
                options={taxRates}
                value={taxRates.find((rate) => rate.id === field.value) ?? null}
                loading={isTaxRatesLoading}
                getOptionLabel={taxRateLabel}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onBlur={field.onBlur}
                onChange={(_, taxRate) => {
                  field.onChange(taxRate?.id ?? '')
                  setValue('tax_rate_type', taxRate?.type ?? null)
                  setValue('tax_rate', taxRate?.rate ?? 0)
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('form.tax')}
                    error={!!errors.tax_rate_id}
                    helperText={errors.tax_rate_id?.message || t('form.noTax')}
                  />
                )}
              />
            )}
          />
        </Box>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('form.subtotal')}</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{formatMoney(totals.subtotal, currencyFormatter)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('form.taxAmount')}</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{formatMoney(totals.tax, currencyFormatter)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('form.shippingAmount')}</Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{formatMoney(totals.shipping, currencyFormatter)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t('form.total')}</Typography>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>{formatMoney(totals.total, currencyFormatter)}</Typography>
        </Box>
      </Box>
    </Stack>
  )
}
