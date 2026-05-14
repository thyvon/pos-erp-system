'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { warehouseSchema, type WarehouseFormInput, type WarehouseFormValues } from './schema'
import type { Branch } from '@/types/branch'
import type { Warehouse, WarehousePayload } from '@/types/warehouse'

interface WarehouseFormDialogProps {
  open: boolean
  warehouse: Warehouse | null
  branches: Branch[]
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: WarehousePayload) => Promise<void>
}

const defaultValues: WarehouseFormInput = {
  branch_id: '',
  name: '',
  code: '',
  type: 'main',
  is_default: false,
  is_active: true,
  allow_negative_stock: false,
}

function warehouseToFormValues(warehouse: Warehouse | null): WarehouseFormInput {
  if (!warehouse) return defaultValues

  return {
    branch_id: warehouse.branch_id ?? '',
    name: warehouse.name,
    code: warehouse.code ?? '',
    type: warehouse.type,
    is_default: warehouse.is_default,
    is_active: warehouse.is_active,
    allow_negative_stock: warehouse.allow_negative_stock,
  }
}

export function WarehouseFormDialog({
  open,
  warehouse,
  branches,
  isSaving,
  onClose,
  onSubmit,
}: WarehouseFormDialogProps) {
  const { t } = useTranslation(['warehouses', 'common'])
  const [serverError, setServerError] = useState('')
  const title = warehouse ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => warehouseToFormValues(warehouse), [warehouse])
  const branchOptions = useMemo(() => {
    if (!warehouse?.branch || branches.some((branch) => branch.id === warehouse.branch?.id)) {
      return branches
    }

    return [
      {
        id: warehouse.branch.id,
        business_id: warehouse.business_id,
        name: warehouse.branch.name,
        code: warehouse.branch.code,
        type: 'retail' as const,
        phone: null,
        email: null,
        address: null,
        is_default: false,
        is_active: true,
        business_hours: null,
        invoice_settings: null,
        manager: null,
        created_at: '',
        updated_at: '',
      },
      ...branches,
    ]
  }, [branches, warehouse])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<WarehouseFormInput, unknown, WarehouseFormValues>({
    resolver: zodResolver(warehouseSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) reset(values)
  }, [open, reset, values])

  const submitForm = async (formValues: WarehouseFormValues) => {
    setServerError('')

    try {
      await onSubmit(formValues)
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof WarehouseFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit(submitForm)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
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
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('fields.code')}
                    error={!!errors.code}
                    helperText={errors.code?.message || t('help.code')}
                  />
                )}
              />

              <Controller
                name="branch_id"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.branch_id}>
                    <InputLabel id="warehouse-branch-label">{t('fields.branch')}</InputLabel>
                    <Select
                      {...field}
                      value={field.value ?? ''}
                      labelId="warehouse-branch-label"
                      label={t('fields.branch')}
                      required
                    >
                      {branchOptions.map((branch) => (
                        <MenuItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>{errors.branch_id?.message}</FormHelperText>
                  </FormControl>
                )}
              />

              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <FormControl error={!!errors.type}>
                    <InputLabel id="warehouse-type-label">{t('fields.type')}</InputLabel>
                    <Select {...field} labelId="warehouse-type-label" label={t('fields.type')}>
                      <MenuItem value="main">{t('type.main')}</MenuItem>
                      <MenuItem value="transit">{t('type.transit')}</MenuItem>
                      <MenuItem value="returns">{t('type.returns')}</MenuItem>
                      <MenuItem value="damaged">{t('type.damaged')}</MenuItem>
                    </Select>
                    <FormHelperText>{errors.type?.message}</FormHelperText>
                  </FormControl>
                )}
              />
            </Box>

            <Stack spacing={1}>
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                    label={t('fields.active')}
                  />
                )}
              />
              <Controller
                name="is_default"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                    label={t('fields.default')}
                  />
                )}
              />
              <Controller
                name="allow_negative_stock"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                    label={t('fields.allowNegativeStock')}
                  />
                )}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
