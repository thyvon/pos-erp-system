import {
  Button,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { Add, DeleteOutlined } from '@mui/icons-material'
import { useWatch } from 'react-hook-form'
import type { FieldErrors, UseFieldArrayReturn } from 'react-hook-form'
import type { TFunction } from 'i18next'
import type { ProductFormOptions } from '@/types/product'
import type { ProductFormInput, ProductFormValues } from '../schema'
import { FormSection, NumberField, SelectField, type ProductFormControl } from './ProductFormFields'

interface ProductComboSectionProps {
  control: ProductFormControl
  errors: FieldErrors<ProductFormValues>
  comboItems: UseFieldArrayReturn<ProductFormInput, 'combo_items'>
  options?: ProductFormOptions
  t: TFunction<['products', 'common']>
}

const comboColumnSx = {
  product: { width: 360, minWidth: 360 },
  variation: { width: 280, minWidth: 280 },
  quantity: { width: 180, minWidth: 180 },
  actions: { width: 120, minWidth: 120 },
} as const

function RequiredHeader({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Typography component="span" sx={{ ml: 0.25, color: 'error.main' }}>*</Typography>
    </>
  )
}

export function ProductComboSection({ control, errors, comboItems, options, t }: ProductComboSectionProps) {
  const watchedComboItems = useWatch({ control, name: 'combo_items' }) ?? []
  const variationsForProduct = (productId?: string) =>
    options?.combo_products.find((product) => product.id === productId)?.variations ?? []

  return (
    <FormSection title={t('sections.combo')}>
      <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 940, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={comboColumnSx.product}><RequiredHeader>{t('fields.comboProduct')}</RequiredHeader></TableCell>
              <TableCell sx={comboColumnSx.variation}>{t('fields.comboVariation')}</TableCell>
              <TableCell sx={comboColumnSx.quantity}><RequiredHeader>{t('fields.quantity')}</RequiredHeader></TableCell>
              <TableCell sx={comboColumnSx.actions} align="right">{t('columns.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {comboItems.fields.map((field, index) => (
              <TableRow key={field.id}>
                <TableCell sx={comboColumnSx.product}>
                  <SelectField
                    name={`combo_items.${index}.child_product_id`}
                    control={control}
                    label=""
                    error={errors.combo_items?.[index]?.child_product_id?.message}
                    required
                  >
                    <MenuItem value="">{t('labels.none')}</MenuItem>
                    {options?.combo_products.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                  </SelectField>
                </TableCell>
                <TableCell sx={comboColumnSx.variation}>
                  <SelectField
                    name={`combo_items.${index}.child_variation_id`}
                    control={control}
                    label=""
                    error={errors.combo_items?.[index]?.child_variation_id?.message}
                  >
                    <MenuItem value="">{t('labels.none')}</MenuItem>
                    {variationsForProduct(watchedComboItems[index]?.child_product_id).map((variation) => (
                      <MenuItem key={variation.id} value={variation.id ?? ''}>{variation.name}</MenuItem>
                    ))}
                  </SelectField>
                </TableCell>
                <TableCell sx={comboColumnSx.quantity}>
                  <NumberField
                    name={`combo_items.${index}.quantity`}
                    control={control}
                    label=""
                    error={errors.combo_items?.[index]?.quantity?.message}
                    required
                  />
                </TableCell>
                <TableCell sx={comboColumnSx.actions} align="right">
                  <Button color="error" startIcon={<DeleteOutlined />} onClick={() => comboItems.remove(index)}>
                    {t('common:buttons.delete')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button
        startIcon={<Add />}
        onClick={() => comboItems.append({ child_product_id: '', child_variation_id: '', quantity: 1 })}
      >
        {t('actions.addComboItem')}
      </Button>
    </FormSection>
  )
}
