'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm, useWatch } from 'react-hook-form'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { ArrowBack, SaveOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { useCreateStockCountMutation, useInventoryOptionsQuery } from './hooks'
import { useDefaultWarehouseSelection } from '@/features/warehouses/useDefaultWarehouseSelection'
import { stockCountSchema, type StockCountFormInput, type StockCountFormValues } from './schema'
import type { InventoryWarehouseOption, StockCountPayload } from '@/types/inventory'

const today = () => new Date().toISOString().slice(0, 10)

function getDefaultValues(): StockCountFormInput {
  return {
    warehouse_id: '',
    date: today(),
    notes: '',
  }
}

function buildPayload(values: StockCountFormValues): StockCountPayload {
  return {
    warehouse_id: values.warehouse_id,
    date: values.date,
    notes: values.notes ?? null,
  }
}

function warehouseLabel(warehouse: InventoryWarehouseOption) {
  return [warehouse.name, warehouse.code, warehouse.branch_name].filter(Boolean).join(' / ')
}

export function StockCountFormPage() {
  const { t } = useTranslation(['inventory', 'common'])
  const router = useRouter()
  const { enqueueSnackbar } = useSnackbar()
  const [serverError, setServerError] = useState('')
  const optionsQuery = useInventoryOptionsQuery()
  const createCount = useCreateStockCountMutation()
  const warehouseOptions = optionsQuery.data?.warehouses ?? []

  const {
    control,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<StockCountFormInput, unknown, StockCountFormValues>({
    resolver: zodResolver(stockCountSchema),
    defaultValues: getDefaultValues(),
  })
  const warehouseId = useWatch({ control, name: 'warehouse_id' })
  const selectDefaultWarehouse = useCallback((warehouse: InventoryWarehouseOption) => {
    setValue('warehouse_id', warehouse.id, { shouldDirty: false, shouldValidate: true })
  }, [setValue])

  useDefaultWarehouseSelection({
    warehouses: warehouseOptions,
    warehouseId,
    onWarehouseChange: selectDefaultWarehouse,
  })

  const submitForm = async (values: StockCountFormValues) => {
    setServerError('')

    try {
      const count = await createCount.mutateAsync(buildPayload(values))
      enqueueSnackbar(t('counts.messages.created'), { variant: 'success' })
      router.push(`/inventory/counts/${count.id}`)
    } catch (error) {
      const apiError = toAppApiError(error)
      if (apiError.fieldErrors) {
        Object.entries(apiError.fieldErrors).forEach(([field, messages]) => {
          setError(field as keyof StockCountFormInput, {
            type: 'server',
            message: messages[0],
          })
        })
      }
      setServerError(apiError.message)
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4">{t('counts.form.createTitle')}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('counts.form.pageSubtitle')}
          </Typography>
        </Box>
        <Tooltip title={t('counts.actions.backToList')}>
          <IconButton
            size="small"
            aria-label={t('counts.actions.backToList')}
            onClick={() => router.push('/inventory/counts')}
          >
            <ArrowBack />
          </IconButton>
        </Tooltip>
      </Stack>

      {optionsQuery.isError && <Alert severity="error">{toAppApiError(optionsQuery.error).message}</Alert>}

      <Card>
        <CardContent>
          <Box component="form" noValidate onSubmit={handleSubmit(submitForm)}>
            <Stack spacing={2.5}>
              {serverError && <Alert severity="error">{serverError}</Alert>}
              {!optionsQuery.isLoading && warehouseOptions.length === 0 && (
                <Alert severity="warning">{t('counts.messages.noWarehouses')}</Alert>
              )}

              <Alert severity="info">{t('counts.form.autoSeedNotice')}</Alert>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 220px' }, gap: 2 }}>
                <Controller
                  name="warehouse_id"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      options={warehouseOptions}
                      value={warehouseOptions.find((warehouse) => warehouse.id === field.value) ?? null}
                      loading={optionsQuery.isLoading}
                      getOptionLabel={warehouseLabel}
                      isOptionEqualToValue={(option, value) => option.id === value.id}
                      disabled={optionsQuery.isLoading}
                      onBlur={field.onBlur}
                      onChange={(_, warehouse) => field.onChange(warehouse?.id ?? '')}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={t('counts.fields.warehouse')}
                          error={!!errors.warehouse_id}
                          helperText={errors.warehouse_id?.message}
                          required
                        />
                      )}
                    />
                  )}
                />

                <Controller
                  name="date"
                  control={control}
                  render={({ field }) => (
                    <AppDatePicker
                      value={field.value ?? ''}
                      onChange={(value) => field.onChange(value ?? '')}
                      label={t('counts.fields.date')}
                      error={!!errors.date}
                      helperText={errors.date?.message}
                      required
                    />
                  )}
                />
              </Box>

              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    value={field.value ?? ''}
                    label={t('counts.fields.notes')}
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                  />
                )}
              />

              <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
                <Button variant="outlined" onClick={() => router.push('/inventory/counts')} disabled={createCount.isPending}>
                  {t('common:buttons.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={createCount.isPending ? undefined : <SaveOutlined />}
                  disabled={createCount.isPending || warehouseOptions.length === 0}
                >
                  {createCount.isPending ? <CircularProgress size={20} color="inherit" /> : t('counts.actions.start')}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Stack>
  )
}
