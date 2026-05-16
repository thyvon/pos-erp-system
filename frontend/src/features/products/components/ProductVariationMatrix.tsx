import { useEffect, useMemo } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Checkbox,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { DeleteOutlined, ImageOutlined, UploadOutlined } from '@mui/icons-material'
import { Controller, useFieldArray } from 'react-hook-form'
import type { FieldErrors } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { ProductFormValues } from '../schema'
import { NumberField, TextInput, type ProductFormControl } from './ProductFormFields'
import { SelectField } from './ProductFormFields'
import type { SubUnit } from '@/types/unit'

interface ProductVariationMatrixProps {
  control: ProductFormControl
  errors: FieldErrors<ProductFormValues>
  valueLabelMap: Map<string, string>
  subUnits: SubUnit[]
}

const columnSx = {
  selectedValues: { width: 260, minWidth: 260 },
  sku: { width: 180, minWidth: 180 },
  money: { width: 160, minWidth: 160 },
  subUnit: { width: 190, minWidth: 190 },
  image: { width: 190, minWidth: 190 },
  active: { width: 96, minWidth: 96 },
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

function VariationImageInput({
  file,
  onChange,
}: {
  file: File | null
  onChange: (file: File | null) => void
}) {
  const { t } = useTranslation(['products', 'common'])
  const objectUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [objectUrl])

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', width: 176 }}>
      <Avatar
        variant="rounded"
        src={objectUrl ?? ''}
        sx={{
          width: 48,
          height: 48,
          flex: '0 0 auto',
          borderRadius: 1,
          bgcolor: 'action.hover',
          color: 'text.secondary',
          '& img': { objectFit: 'cover' },
        }}
      >
        <ImageOutlined fontSize="small" />
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Button component="label" size="small" startIcon={<UploadOutlined fontSize="small" />}>
            {t('actions.upload')}
            <input
              hidden
              type="file"
              accept="image/*"
              onChange={(event) => {
                onChange(event.target.files?.[0] ?? null)
                event.target.value = ''
              }}
            />
          </Button>
          {file && (
            <IconButton size="small" color="inherit" onClick={() => onChange(null)} aria-label={t('common:buttons.delete')}>
              <DeleteOutlined fontSize="small" />
            </IconButton>
          )}
        </Stack>
        {file && (
          <Typography variant="caption" noWrap sx={{ display: 'block', maxWidth: 112, color: 'text.secondary' }}>
            {file.name}
          </Typography>
        )}
      </Box>
    </Stack>
  )
}

export function ProductVariationMatrix({ control, errors, valueLabelMap, subUnits }: ProductVariationMatrixProps) {
  const { t } = useTranslation(['products', 'common'])
  const variations = useFieldArray({ control, name: 'variations' })

  if (!variations.fields.length) {
    return <Alert severity="info">{t('messages.selectVariationValues')}</Alert>
  }

  return (
    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: 1880, tableLayout: 'fixed' }}>
        <TableHead>
          <TableRow>
            <TableCell sx={columnSx.selectedValues}>{t('columns.selectedValues')}</TableCell>
            <TableCell sx={columnSx.sku}>{t('fields.sku')}</TableCell>
            <TableCell sx={columnSx.money}><RequiredHeader>{t('fields.sellingPrice')}</RequiredHeader></TableCell>
            <TableCell sx={columnSx.money}><RequiredHeader>{t('fields.purchasePrice')}</RequiredHeader></TableCell>
            <TableCell sx={columnSx.subUnit}>{t('fields.subUnit')}</TableCell>
            <TableCell sx={columnSx.money}>{t('fields.subUnitSellingPrice')}</TableCell>
            <TableCell sx={columnSx.money}>{t('fields.subUnitPurchasePrice')}</TableCell>
            <TableCell sx={columnSx.money}>{t('fields.minimumSellingPrice')}</TableCell>
            <TableCell sx={columnSx.money}>{t('fields.profitMargin')}</TableCell>
            <TableCell sx={columnSx.image}>{t('fields.imageFile')}</TableCell>
            <TableCell sx={columnSx.active}>{t('fields.is_active')}</TableCell>
            <TableCell sx={columnSx.actions} align="right">{t('columns.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {variations.fields.map((field, index) => (
            <TableRow key={field.id}>
              <TableCell sx={columnSx.selectedValues}>
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap' }}>
                  {(field.variation_value_ids ?? []).map((valueId) => (
                    <Typography
                      key={valueId}
                      variant="caption"
                      sx={{ px: 1, py: 0.5, borderRadius: 1, bgcolor: 'action.hover' }}
                    >
                      {valueLabelMap.get(valueId) ?? valueId}
                    </Typography>
                  ))}
                </Stack>
              </TableCell>
              <TableCell sx={columnSx.sku}><TextInput name={`variations.${index}.sku`} control={control} /></TableCell>
              <TableCell sx={columnSx.money}>
                <NumberField
                  name={`variations.${index}.selling_price`}
                  control={control}
                  label=""
                  error={errors.variations?.[index]?.selling_price?.message}
                  required
                />
              </TableCell>
              <TableCell sx={columnSx.money}>
                <NumberField
                  name={`variations.${index}.purchase_price`}
                  control={control}
                  label=""
                  error={errors.variations?.[index]?.purchase_price?.message}
                  required
                />
              </TableCell>
              <TableCell sx={columnSx.subUnit}>
                <SelectField name={`variations.${index}.sub_unit_id`} control={control} label="">
                  <MenuItem value="">{t('labels.none')}</MenuItem>
                  {subUnits.map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
                </SelectField>
              </TableCell>
              <TableCell sx={columnSx.money}>
                <NumberField name={`variations.${index}.sub_unit_selling_price`} control={control} label="" />
              </TableCell>
              <TableCell sx={columnSx.money}>
                <NumberField name={`variations.${index}.sub_unit_purchase_price`} control={control} label="" />
              </TableCell>
              <TableCell sx={columnSx.money}>
                <NumberField name={`variations.${index}.minimum_selling_price`} control={control} label="" />
              </TableCell>
              <TableCell sx={columnSx.money}>
                <NumberField name={`variations.${index}.profit_margin`} control={control} label="" />
              </TableCell>
              <TableCell sx={columnSx.image}>
                <Controller
                  name={`variations.${index}.image_file`}
                  control={control}
                  render={({ field: { value, onChange } }) => (
                    <VariationImageInput file={value ?? null} onChange={onChange} />
                  )}
                />
              </TableCell>
              <TableCell sx={columnSx.active}>
                <Controller
                  name={`variations.${index}.is_active`}
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      checked={field.value !== false}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  )}
                />
              </TableCell>
              <TableCell sx={columnSx.actions} align="right">
                <Button color="error" onClick={() => variations.remove(index)}>
                  {t('common:buttons.delete')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
