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
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import {
  rackLocationSchema,
  type RackLocationFormInput,
  type RackLocationFormValues,
} from './schema'
import type { RackLocation, RackLocationPayload } from '@/types/rackLocation'
import type { Warehouse } from '@/types/warehouse'

interface RackLocationFormDialogProps {
  open: boolean
  rackLocation: RackLocation | null
  warehouses: Warehouse[]
  isLoadingWarehouses: boolean
  isSaving: boolean
  onClose: () => void
  onSubmit: (payload: RackLocationPayload) => Promise<void>
}

const defaultValues: RackLocationFormInput = {
  warehouse_id: '',
  name: '',
  code: '',
  description: '',
}

function rackLocationToFormValues(rackLocation: RackLocation | null): RackLocationFormInput {
  if (!rackLocation) return defaultValues

  return {
    warehouse_id: rackLocation.warehouse_id,
    name: rackLocation.name,
    code: rackLocation.code,
    description: rackLocation.description ?? '',
  }
}

export function RackLocationFormDialog({
  open,
  rackLocation,
  warehouses,
  isLoadingWarehouses,
  isSaving,
  onClose,
  onSubmit,
}: RackLocationFormDialogProps) {
  const { t } = useTranslation(['rackLocations', 'common'])
  const [serverError, setServerError] = useState('')
  const title = rackLocation ? t('form.editTitle') : t('form.createTitle')
  const values = useMemo(() => rackLocationToFormValues(rackLocation), [rackLocation])
  const warehouseOptions = useMemo(() => {
    if (
      !rackLocation?.warehouse
      || warehouses.some((warehouse) => warehouse.id === rackLocation.warehouse_id)
    ) {
      return warehouses
    }

    return [
      {
        id: rackLocation.warehouse.id,
        business_id: rackLocation.business_id,
        branch_id: rackLocation.warehouse.branch?.id ?? null,
        name: rackLocation.warehouse.name,
        code: rackLocation.warehouse.code ?? '',
        type: 'main' as const,
        is_active: true,
        is_default: false,
        allow_negative_stock: false,
        branch: rackLocation.warehouse.branch
          ? {
              id: rackLocation.warehouse.branch.id,
              name: rackLocation.warehouse.branch.name,
              code: null,
            }
          : null,
        created_at: '',
        updated_at: '',
      },
      ...warehouses,
    ]
  }, [rackLocation, warehouses])

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<RackLocationFormInput, unknown, RackLocationFormValues>({
    resolver: zodResolver(rackLocationSchema),
    defaultValues,
  })

  useEffect(() => {
    if (open) reset(values)
  }, [open, reset, values])

  const submitForm = async (formValues: RackLocationFormValues) => {
    setServerError('')

    try {
      await onSubmit(formValues)
      onClose()
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof RackLocationFormInput, {
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
      <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ pt: 0.5 }}>
            {serverError && <Alert severity="error">{serverError}</Alert>}
            {!isLoadingWarehouses && warehouseOptions.length === 0 && (
              <Alert severity="warning">{t('messages.noWarehouses')}</Alert>
            )}

            <FormControl error={!!errors.warehouse_id}>
              <InputLabel id="rack-location-warehouse-label">{t('fields.warehouse')}</InputLabel>
              <Controller
                name="warehouse_id"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value ?? ''}
                    labelId="rack-location-warehouse-label"
                    label={t('fields.warehouse')}
                    disabled={isLoadingWarehouses}
                    required
                  >
                    {warehouseOptions.map((warehouse) => (
                      <MenuItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                        {warehouse.code ? ` (${warehouse.code})` : ''}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              <FormHelperText>{errors.warehouse_id?.message}</FormHelperText>
            </FormControl>

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
                    label={t('fields.code')}
                    error={!!errors.code}
                    helperText={errors.code?.message}
                    required
                  />
                )}
              />
            </Box>

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  label={t('fields.description')}
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  multiline
                  minRows={3}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={isSaving}>
            {t('common:buttons.cancel')}
          </Button>
          <Button type="submit" variant="contained" disabled={isSaving || warehouseOptions.length === 0}>
            {isSaving ? <CircularProgress size={20} color="inherit" /> : t('common:buttons.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
