import { Box, MenuItem, TextField } from '@mui/material'
import { Controller } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import type { TFunction } from 'i18next'
import type { ProductType } from '@/types/product'
import type { Product } from '@/types/product'
import { AppImageUpload } from '@/components/ui/AppImageUpload'
import type { ProductFormValues } from '../schema'
import { FormSection, SelectField, type ProductFormControl } from './ProductFormFields'

interface ProductGeneralSectionProps {
  control: ProductFormControl
  errors: FieldErrors<ProductFormValues>
  imageUrl?: Product['image_url']
  t: TFunction<['products', 'common']>
}

export function ProductGeneralSection({ control, errors, imageUrl, t }: ProductGeneralSectionProps) {
  return (
    <FormSection title={t('sections.general')}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1fr) 320px' }, gap: 3 }}>
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 180px 180px' }, gap: 2 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('fields.name')}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  required
                />
              )}
            />
            <Controller
              name="sku"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('fields.sku')}
                  error={!!errors.sku}
                  helperText={errors.sku?.message}
                />
              )}
            />
            <SelectField name="type" control={control} label={t('fields.type')} required>
              {(['single', 'variable', 'service', 'combo'] as ProductType[]).map((item) => (
                <MenuItem key={item} value={item}>
                  {t(`types.${item}`)}
                </MenuItem>
              ))}
            </SelectField>
          </Box>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                label={t('fields.description')}
                multiline
                minRows={3}
              />
            )}
          />
        </Box>
        <Controller
          name="image_file"
          control={control}
          render={({ field: { value, onChange } }) => (
            <AppImageUpload
              label={t('fields.imageFile')}
              value={imageUrl ?? null}
              file={value ?? null}
              onUrlChange={() => undefined}
              onFileChange={onChange}
              uploadLabel={t('actions.upload')}
              helperText={imageUrl ? t('labels.currentImage') : undefined}
              hideUrlField
              allowRemoveExisting={false}
            />
          )}
        />
      </Box>
    </FormSection>
  )
}
