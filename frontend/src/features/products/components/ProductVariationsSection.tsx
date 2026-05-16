import { Autocomplete, Box, Chip, TextField } from '@mui/material'
import { Controller } from 'react-hook-form'
import type { FieldErrors, UseFormSetValue } from 'react-hook-form'
import type { TFunction } from 'i18next'
import type { VariationTemplate } from '@/types/variationTemplate'
import type { SubUnit } from '@/types/unit'
import type { ProductFormInput, ProductFormValues } from '../schema'
import { FormSection, type ProductFormControl } from './ProductFormFields'
import { ProductVariationMatrix } from './ProductVariationMatrix'

interface ProductVariationsSectionProps {
  control: ProductFormControl
  errors: FieldErrors<ProductFormValues>
  templates: VariationTemplate[]
  selectedTemplates: VariationTemplate[]
  selectedTemplateIds: string[]
  variationValueMap: Record<string, string[]>
  valueLabelMap: Map<string, string>
  subUnits: SubUnit[]
  setValue: UseFormSetValue<ProductFormInput>
  syncMatrix: (templateIds: string[], valueMap: Record<string, string[]>) => void
  t: TFunction<['products', 'common']>
}

export function ProductVariationsSection({
  control,
  errors,
  templates,
  selectedTemplates,
  selectedTemplateIds,
  variationValueMap,
  valueLabelMap,
  subUnits,
  setValue,
  syncMatrix,
  t,
}: ProductVariationsSectionProps) {
  return (
    <FormSection title={t('sections.variations')}>
      <Controller
        name="variation_template_ids"
        control={control}
        render={({ field }) => (
          <Autocomplete
            multiple
            options={templates}
            value={templates.filter((template) => (field.value ?? []).includes(template.id))}
            onChange={(_, value) => {
              const nextTemplateIds = value.map((template) => template.id)
              const nextValueMap = Object.fromEntries(
                Object.entries(variationValueMap).filter(([templateId]) => nextTemplateIds.includes(templateId))
              )

              field.onChange(nextTemplateIds)
              setValue('variation_value_map', nextValueMap)
              syncMatrix(nextTemplateIds, nextValueMap)
            }}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterSelectedOptions
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('fields.variationTemplate')}
                error={!!errors.variation_template_ids}
                helperText={errors.variation_template_ids?.message}
                required
              />
            )}
            renderValue={(value, getItemProps) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {value.map((template, index) => {
                  const { key, ...itemProps } = getItemProps({ index })

                  return <Chip key={key} size="small" label={template.name} {...itemProps} />
                })}
              </Box>
            )}
          />
        )}
      />
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' }, gap: 2 }}>
        {selectedTemplates.map((template) => (
          <Autocomplete
            key={template.id}
            multiple
            options={template.values}
            value={template.values.filter((value) => (variationValueMap[template.id] ?? []).includes(value.id))}
            onChange={(_, value) => {
              const nextMap = {
                ...variationValueMap,
                [template.id]: value.map((item) => item.id),
              }
              setValue('variation_value_map', nextMap)
              syncMatrix(selectedTemplateIds, nextMap)
            }}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            filterSelectedOptions
            renderInput={(params) => (
              <TextField
                {...params}
                label={template.name}
                required
              />
            )}
            renderValue={(value, getItemProps) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {value.map((item, index) => {
                  const { key, ...itemProps } = getItemProps({ index })

                  return <Chip key={key} size="small" label={item.name} {...itemProps} />
                })}
              </Box>
            )}
          />
        ))}
      </Box>
      <ProductVariationMatrix
        control={control}
        errors={errors}
        valueLabelMap={valueLabelMap}
        subUnits={subUnits}
      />
    </FormSection>
  )
}
