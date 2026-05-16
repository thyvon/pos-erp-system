import { MenuItem } from '@mui/material'
import type { FieldErrors } from 'react-hook-form'
import type { TFunction } from 'i18next'
import type { ProductType } from '@/types/product'
import type { ProductFormValues } from '../schema'
import { FieldGrid, FormSection, NumberField, SelectField, type ProductFormControl } from './ProductFormFields'

interface ProductPricingSectionProps {
  control: ProductFormControl
  errors: FieldErrors<ProductFormValues>
  type: ProductType
  t: TFunction<['products', 'common']>
}

export function ProductPricingSection({ control, errors, type, t }: ProductPricingSectionProps) {
  return (
    <FormSection title={t('sections.pricing')}>
      <FieldGrid>
        <SelectField name="barcode_type" control={control} label={t('fields.barcodeType')} required>
          {(['C128', 'EAN13', 'QR'] as const).map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
        </SelectField>
        <SelectField name="stock_tracking" control={control} label={t('fields.stockTracking')} required>
          {(['none', 'lot', 'serial'] as const).map((item) => (
            <MenuItem key={item} value={item}>{t(`stockTracking.${item}`)}</MenuItem>
          ))}
        </SelectField>
        <SelectField name="tax_type" control={control} label={t('fields.taxType')} required>
          {(['exclusive', 'inclusive'] as const).map((item) => (
            <MenuItem key={item} value={item}>{t(`taxTypes.${item}`)}</MenuItem>
          ))}
        </SelectField>
        {type !== 'variable' && (
          <>
            <NumberField name="selling_price" control={control} label={t('fields.sellingPrice')} error={errors.selling_price?.message} required />
            <NumberField name="purchase_price" control={control} label={t('fields.purchasePrice')} error={errors.purchase_price?.message} required />
            <NumberField name="sub_unit_selling_price" control={control} label={t('fields.subUnitSellingPrice')} error={errors.sub_unit_selling_price?.message} />
            <NumberField name="sub_unit_purchase_price" control={control} label={t('fields.subUnitPurchasePrice')} error={errors.sub_unit_purchase_price?.message} />
            <NumberField name="minimum_selling_price" control={control} label={t('fields.minimumSellingPrice')} error={errors.minimum_selling_price?.message} />
            <NumberField name="profit_margin" control={control} label={t('fields.profitMargin')} error={errors.profit_margin?.message} />
          </>
        )}
      </FieldGrid>
    </FormSection>
  )
}
