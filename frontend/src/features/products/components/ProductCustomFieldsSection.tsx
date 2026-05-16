import { Checkbox, FormControl, FormControlLabel, FormHelperText, MenuItem, TextField } from '@mui/material'
import { Controller } from 'react-hook-form'
import type { FieldErrors, FieldPath } from 'react-hook-form'
import type { TFunction } from 'i18next'
import type { CustomFieldDefinition } from '@/types/product'
import type { ProductFormInput, ProductFormValues } from '../schema'
import { FieldGrid, FormSection, SelectField, type ProductFormControl } from './ProductFormFields'

interface ProductCustomFieldsSectionProps {
  control: ProductFormControl
  errors: FieldErrors<ProductFormValues>
  fields: CustomFieldDefinition[]
  t: TFunction<['products', 'common']>
}

function customFieldError(errors: FieldErrors<ProductFormValues>, fieldName: string) {
  const customFields = errors.custom_fields as Record<string, { message?: string }> | undefined
  return customFields?.[fieldName]?.message
}

export function ProductCustomFieldsSection({ control, errors, fields, t }: ProductCustomFieldsSectionProps) {
  if (!fields.length) return null

  return (
    <FormSection title={t('sections.customFields')}>
      <FieldGrid>
        {fields.map((definition) => {
          const name = `custom_fields.${definition.field_name}` as FieldPath<ProductFormInput>
          const error = customFieldError(errors, definition.field_name)

          if (definition.field_type === 'select') {
            return (
              <SelectField
                key={definition.id}
                name={name}
                control={control}
                label={definition.field_label}
                error={error}
                required={definition.is_required}
              >
                <MenuItem value="">{t('labels.none')}</MenuItem>
                {(definition.options ?? []).map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </SelectField>
            )
          }

          if (definition.field_type === 'checkbox') {
            return (
              <Controller
                key={definition.id}
                name={name}
                control={control}
                render={({ field }) => (
                  <FormControl error={!!error} required={definition.is_required}>
                    <FormControlLabel
                      control={<Checkbox checked={!!field.value} onChange={(event) => field.onChange(event.target.checked)} />}
                      label={definition.field_label}
                    />
                    {error && <FormHelperText>{error}</FormHelperText>}
                  </FormControl>
                )}
              />
            )
          }

          return (
            <Controller
              key={definition.id}
              name={name}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value == null ? '' : String(field.value)}
                  type={definition.field_type === 'number' ? 'number' : definition.field_type === 'date' ? 'date' : 'text'}
                  label={definition.field_label}
                  error={!!error}
                  helperText={error}
                  required={definition.is_required}
                  slotProps={definition.field_type === 'date' ? { inputLabel: { shrink: true } } : undefined}
                />
              )}
            />
          )
        })}
      </FieldGrid>
    </FormSection>
  )
}
