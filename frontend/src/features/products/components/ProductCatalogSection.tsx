import { MenuItem } from '@mui/material'
import type { FieldErrors } from 'react-hook-form'
import type { TFunction } from 'i18next'
import type { ProductFormOptions, ProductType } from '@/types/product'
import type { SubUnit } from '@/types/unit'
import type { ProductFormValues } from '../schema'
import { FieldGrid, FormSection, SelectField, type ProductFormControl } from './ProductFormFields'

interface ProductCatalogSectionProps {
  control: ProductFormControl
  errors: FieldErrors<ProductFormValues>
  options?: ProductFormOptions
  subUnits: SubUnit[]
  type: ProductType
  t: TFunction<['products', 'common']>
}

export function ProductCatalogSection({ control, errors, options, subUnits, type, t }: ProductCatalogSectionProps) {
  return (
    <FormSection title={t('sections.catalog')}>
      <FieldGrid>
        <SelectField name="category_id" control={control} label={t('fields.category')} error={errors.category_id?.message}>
          <MenuItem value="">{t('labels.none')}</MenuItem>
          {options?.categories.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </SelectField>
        <SelectField name="brand_id" control={control} label={t('fields.brand')} error={errors.brand_id?.message}>
          <MenuItem value="">{t('labels.none')}</MenuItem>
          {options?.brands.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </SelectField>
        <SelectField name="unit_id" control={control} label={t('fields.unit')} error={errors.unit_id?.message} required={type !== 'service'}>
          <MenuItem value="">{t('labels.none')}</MenuItem>
          {options?.units.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </SelectField>
        <SelectField name="sub_unit_id" control={control} label={t('fields.subUnit')} error={errors.sub_unit_id?.message}>
          <MenuItem value="">{t('labels.none')}</MenuItem>
          {subUnits.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </SelectField>
        <SelectField name="tax_rate_id" control={control} label={t('fields.taxRate')} error={errors.tax_rate_id?.message}>
          <MenuItem value="">{t('labels.none')}</MenuItem>
          {options?.tax_rates.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </SelectField>
        <SelectField name="price_group_id" control={control} label={t('fields.priceGroup')} error={errors.price_group_id?.message}>
          <MenuItem value="">{t('labels.none')}</MenuItem>
          {options?.price_groups.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </SelectField>
        {options?.rack_locations_enabled && (
          <SelectField name="rack_location_id" control={control} label={t('fields.rackLocation')} error={errors.rack_location_id?.message}>
            <MenuItem value="">{t('labels.none')}</MenuItem>
            {options.rack_locations.map((item) => (
              <MenuItem key={item.id} value={item.id}>{item.name} ({item.code})</MenuItem>
            ))}
          </SelectField>
        )}
      </FieldGrid>
    </FormSection>
  )
}
