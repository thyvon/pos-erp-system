'use client'

import { Autocomplete, Box, IconButton, Stack, TextField, Tooltip } from '@mui/material'
import { Controller, type Control, type FieldErrors } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Add } from '@/components/ui/icons'
import { InventoryProductLookupPicker } from '@/features/inventory/components/InventoryProductLookupPicker'
import type { Customer } from '@/types/customer'
import type { InventoryProductLookupItem } from '@/types/inventory'
import type { Warehouse } from '@/types/warehouse'
import type { SaleFormInput, SaleFormValues } from '../schema'

interface PosHeaderFieldsProps {
  control: Control<SaleFormInput, unknown, SaleFormValues>
  errors: FieldErrors<SaleFormInput>
  warehouses: Warehouse[]
  customers: Customer[]
  warehousesLoading: boolean
  customersLoading: boolean
  canCreateCustomer: boolean
  warehouseId: string
  isSaving: boolean
  onWarehouseChange: (warehouseId: string, branchId: string) => void
  onAddCustomer: () => void
  onSelectItem: (item: InventoryProductLookupItem) => void
}

function warehouseLabel(warehouse: Warehouse) {
  return [warehouse.name, warehouse.code, warehouse.branch?.name].filter(Boolean).join(' / ')
}

function customerLabel(customer: Customer) {
  return [customer.name, customer.code, customer.phone || customer.mobile].filter(Boolean).join(' / ')
}

export function PosHeaderFields({
  control,
  errors,
  warehouses,
  customers,
  warehousesLoading,
  customersLoading,
  canCreateCustomer,
  warehouseId,
  isSaving,
  onWarehouseChange,
  onAddCustomer,
  onSelectItem,
}: PosHeaderFieldsProps) {
  const { t } = useTranslation(['sales'])

  return (
    <Box
      sx={{
        flex: '0 0 auto',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.25fr)' },
        gap: 0.75,
        p: { xs: 0.75, md: 1 },
        mb: -0.75,
        boxSizing: 'border-box',
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Controller
        name="warehouse_id"
        control={control}
        render={({ field }) => (
          <Autocomplete
            options={warehouses}
            value={warehouses.find((warehouse) => warehouse.id === field.value) ?? null}
            loading={warehousesLoading}
            getOptionLabel={warehouseLabel}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            onBlur={field.onBlur}
            onChange={(_, selectedWarehouse) => {
              field.onChange(selectedWarehouse?.id ?? '')
              onWarehouseChange(selectedWarehouse?.id ?? '', selectedWarehouse?.branch_id ?? '')
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('fields.warehouse')}
                error={!!errors.warehouse_id || !!errors.branch_id}
                helperText={errors.warehouse_id?.message || errors.branch_id?.message}
                required
              />
            )}
          />
        )}
      />
      <Controller
        name="customer_id"
        control={control}
        render={({ field }) => (
          <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
            <Autocomplete
              options={customers}
              value={customers.find((customer) => customer.id === field.value) ?? null}
              loading={customersLoading}
              getOptionLabel={customerLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onBlur={field.onBlur}
              onChange={(_, customer) => field.onChange(customer?.id ?? '')}
              sx={{ flex: '1 1 auto', minWidth: 0 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('fields.customer')}
                  placeholder={t('labels.walkInCustomer')}
                  error={!!errors.customer_id}
                  helperText={errors.customer_id?.message}
                />
              )}
            />
            {canCreateCustomer && (
              <Tooltip title={t('pos.actions.addCustomer')}>
                <IconButton
                  aria-label={t('pos.actions.addCustomer')}
                  size="small"
                  color="primary"
                  onClick={onAddCustomer}
                  sx={{
                    width: 'var(--app-control-height)',
                    height: 'var(--app-control-height)',
                    minWidth: 'var(--app-control-height)',
                    minHeight: 'var(--app-control-height)',
                    border: 1,
                    borderColor: 'divider',
                    flex: '0 0 auto',
                  }}
                >
                  <Add fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        )}
      />
      <InventoryProductLookupPicker
        warehouseId={warehouseId || undefined}
        disabled={!warehouseId || isSaving}
        autoFocus
        label={t('pos.scanLabel')}
        onSelect={onSelectItem}
      />
    </Box>
  )
}
