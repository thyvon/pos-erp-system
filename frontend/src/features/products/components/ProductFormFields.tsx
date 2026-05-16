import {
  Box,
  FormControl,
  FormHelperText,
  InputLabel,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Controller } from 'react-hook-form'
import type { Control, FieldPath } from 'react-hook-form'
import type { ProductFormInput, ProductFormValues } from '../schema'

export type ProductFormControl = Control<ProductFormInput, unknown, ProductFormValues>

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Stack spacing={2} sx={{ minWidth: 0 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {children}
    </Stack>
  )
}

export function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
        gap: 2,
      }}
    >
      {children}
    </Box>
  )
}

interface SelectFieldProps {
  name: FieldPath<ProductFormInput>
  control: ProductFormControl
  label: string
  error?: string
  required?: boolean
  children: React.ReactNode
}

export function SelectField({ name, control, label, error, required, children }: SelectFieldProps) {
  const isMultiple = name === 'variation_template_ids'

  return (
    <FormControl error={!!error} required={required}>
      <InputLabel required={required}>{label}</InputLabel>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select
            {...field}
            multiple={isMultiple}
            value={field.value ?? (isMultiple ? [] : '')}
            label={label}
          >
            {children}
          </Select>
        )}
      />
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  )
}

interface FieldProps {
  name: FieldPath<ProductFormInput>
  control: ProductFormControl
  label?: string
  error?: string
  required?: boolean
}

export function NumberField({ name, control, label, error, required }: FieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <TextField
          {...field}
          value={field.value ?? ''}
          type="number"
          label={label}
          error={!!error}
          helperText={error}
          size={label ? 'medium' : 'small'}
          required={required}
        />
      )}
    />
  )
}

export function TextInput({ name, control }: FieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => <TextField {...field} value={field.value ?? ''} size="small" />}
    />
  )
}
