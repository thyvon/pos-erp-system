import { Box, Checkbox, FormControlLabel } from '@mui/material'
import { Controller } from 'react-hook-form'
import type { TFunction } from 'i18next'
import { FieldGrid, FormSection, NumberField, type ProductFormControl } from './ProductFormFields'

interface ProductStockSectionProps {
  control: ProductFormControl
  t: TFunction<['products', 'common']>
}

export function ProductStockSection({ control, t }: ProductStockSectionProps) {
  return (
    <FormSection title={t('sections.stock')}>
      <FieldGrid>
        <NumberField name="alert_quantity" control={control} label={t('fields.alertQuantity')} />
        <NumberField name="max_stock_level" control={control} label={t('fields.maxStockLevel')} />
        <NumberField name="weight" control={control} label={t('fields.weight')} />
      </FieldGrid>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 1 }}>
        {(['track_inventory', 'has_expiry', 'is_for_selling', 'is_active'] as const).map((name) => (
          <Controller
            key={name}
            name={name}
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                }
                label={t(`fields.${name}`)}
              />
            )}
          />
        ))}
      </Box>
    </FormSection>
  )
}
