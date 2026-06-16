'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Add, Inventory2Outlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { useProductsQuery } from '@/features/products/hooks'
import { useRackLocationsQuery } from '@/features/rack-locations/hooks'
import { useSuppliersQuery } from '@/features/suppliers/hooks'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { WarehouseProductSettingFormDialog } from '@/features/warehouse-product-settings/WarehouseProductSettingFormDialog'
import {
  useCreateWarehouseProductSettingMutation,
  useDeleteWarehouseProductSettingMutation,
  useUpdateWarehouseProductSettingMutation,
  useWarehouseProductSettingsQuery,
} from '@/features/warehouse-product-settings/hooks'
import { useAuthStore } from '@/stores/authStore'
import type {
  WarehouseProductSetting,
  WarehouseProductSettingFilters,
  WarehouseProductSettingPayload,
} from '@/types/warehouseProductSetting'

function productName(setting: WarehouseProductSetting) {
  return [
    setting.product?.name,
    setting.variation?.name,
  ].filter(Boolean).join(' / ') || '-'
}

function numberText(value: string | null) {
  return value === null ? '-' : Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 })
}

export default function WarehouseProductSettingsPage() {
  const { t } = useTranslation(['warehouseProductSettings', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingSetting, setEditingSetting] = useState<WarehouseProductSetting | null>(null)
  const [deletingSetting, setDeletingSetting] = useState<WarehouseProductSetting | null>(null)

  const filters: WarehouseProductSettingFilters = useMemo(
    () => ({
      search: search || undefined,
      warehouse_id: warehouseFilter || undefined,
      is_active: activeFilter === 'all' ? undefined : activeFilter === 'active',
      page: page + 1,
      per_page: perPage,
    }),
    [activeFilter, page, perPage, search, warehouseFilter],
  )

  const settingsQuery = useWarehouseProductSettingsQuery(filters)
  const warehousesQuery = useWarehousesQuery({ per_page: 100 })
  const productsQuery = useProductsQuery({ per_page: 100, is_active: true })
  const rackLocationsQuery = useRackLocationsQuery({ per_page: 100 })
  const suppliersQuery = useSuppliersQuery({ per_page: 100, status: 'active' })
  const createSetting = useCreateWarehouseProductSettingMutation()
  const updateSetting = useUpdateWarehouseProductSettingMutation()
  const deleteSetting = useDeleteWarehouseProductSettingMutation()

  const settings = settingsQuery.data?.data ?? []
  const meta = settingsQuery.data?.meta
  const warehouses = warehousesQuery.data?.data ?? []
  const products = productsQuery.data?.data ?? []
  const rackLocations = rackLocationsQuery.data?.data ?? []
  const suppliers = suppliersQuery.data?.data ?? []
  const canCreate = can('warehouse_product_settings.create')
  const canEdit = can('warehouse_product_settings.edit')
  const canDelete = can('warehouse_product_settings.delete')
  const isLoadingOptions = warehousesQuery.isLoading || productsQuery.isLoading || rackLocationsQuery.isLoading || suppliersQuery.isLoading

  const openCreateForm = () => {
    setEditingSetting(null)
    setFormOpen(true)
  }

  const openEditForm = (setting: WarehouseProductSetting) => {
    setEditingSetting(setting)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: WarehouseProductSettingPayload) => {
    if (editingSetting) {
      await updateSetting.mutateAsync({ id: editingSetting.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createSetting.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingSetting) return

    try {
      await deleteSetting.mutateAsync(deletingSetting.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingSetting(null)
    } catch (error) {
      enqueueSnackbar(toAppApiError(error).message, { variant: 'error' })
    }
  }

  const activeFilters = useMemo(() => {
    const items: Array<{ key: string; label: string; onDelete: () => void }> = []

    if (warehouseFilter) {
      const warehouse = warehouses.find((w) => w.id === warehouseFilter)
      items.push({
        key: 'warehouse',
        label: `${t('filters.warehouse')}: ${warehouse?.name ?? warehouseFilter}`,
        onDelete: () => {
          setWarehouseFilter('')
          setPage(0)
        },
      })
    }

    if (activeFilter !== 'all') {
      items.push({
        key: 'status',
        label: `${t('filters.status')}: ${activeFilter === 'active' ? t('status.active') : t('status.inactive')}`,
        onDelete: () => {
          setActiveFilter('all')
          setPage(0)
        },
      })
    }

    return items
  }, [activeFilter, t, warehouseFilter, warehouses])

  const clearFilters = () => {
    setWarehouseFilter('')
    setActiveFilter('all')
    setPage(0)
  }

  const columns: EntityTableColumn<WarehouseProductSetting>[] = useMemo(
    () => [
      {
        key: 'product',
        label: t('columns.product'),
        render: (setting) => (
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">{productName(setting)}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {[setting.product?.sku, setting.variation?.sku].filter(Boolean).join(' / ') || '-'}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'warehouse',
        label: t('columns.warehouse'),
        render: (setting) => (
          <Stack spacing={0.5}>
            <Typography variant="body2">{setting.warehouse?.name ?? '-'}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {[setting.warehouse?.code, setting.warehouse?.branch?.name].filter(Boolean).join(' / ') || '-'}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'rackLocation',
        label: t('columns.rackLocation'),
        render: (setting) =>
          setting.rack_location ? `${setting.rack_location.name} (${setting.rack_location.code})` : '-',
      },
      {
        key: 'reorder',
        label: t('columns.reorder'),
        render: (setting) => (
          <Stack spacing={0.25}>
            <Typography variant="body2">{t('fields.reorder_point')}: {numberText(setting.reorder_point)}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('fields.reorder_quantity')}: {numberText(setting.reorder_quantity)}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'minMax',
        label: t('columns.minMax'),
        render: (setting) => (
          <Stack spacing={0.25}>
            <Typography variant="body2">{t('fields.min_stock_alert')}: {numberText(setting.min_stock_alert)}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('fields.max_stock_level')}: {numberText(setting.max_stock_level)}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'supplier',
        label: t('columns.supplier'),
        render: (setting) => setting.preferred_supplier?.name ?? '-',
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (setting) => (
          <Chip
            size="small"
            color={setting.is_active ? 'success' : 'default'}
            label={setting.is_active ? t('status.active') : t('status.inactive')}
          />
        ),
      },
    ],
    [t]
  )

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<Inventory2Outlined color="primary" />}
        title={t('title')}
        description={t('subtitle')}
        actions={canCreate && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('actions.new')}
          </Button>
        )}
      />

      <PageToolbar
        searchValue={search}
        searchPlaceholder={t('filters.search')}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(0)
        }}
        filters={
          <>
            <SearchableFilterSelect
              value={warehouseFilter}
              options={warehouses}
              loading={warehousesQuery.isLoading}
              label={t('filters.warehouse')}
              placeholder={t('filters.allWarehouses')}
              getOptionValue={(warehouse) => warehouse.id}
              getOptionLabel={(warehouse) => warehouse.name}
              getOptionDescription={(warehouse) => [warehouse.code, warehouse.branch?.name].filter(Boolean).join(' / ')}
              onChange={(value) => {
                setWarehouseFilter(value)
                setPage(0)
              }}
            />
            <TextField
              select
              value={activeFilter}
              label={t('filters.status')}
              onChange={(event) => {
                setActiveFilter(event.target.value as 'all' | 'active' | 'inactive')
                setPage(0)
              }}
            >
              <MenuItem value="all">{t('filters.allStatuses')}</MenuItem>
              <MenuItem value="active">{t('status.active')}</MenuItem>
              <MenuItem value="inactive">{t('status.inactive')}</MenuItem>
            </TextField>
          </>
        }
        activeFilters={activeFilters}
        onClearFilters={activeFilters.length > 0 ? clearFilters : undefined}
      />

      {[settingsQuery, warehousesQuery, productsQuery, rackLocationsQuery, suppliersQuery].map((query, index) => (
        query.isError ? (
          <Alert key={index} severity="error">
            {toAppApiError(query.error).message}
          </Alert>
        ) : null
      ))}

      <EntityTable
        rows={settings}
        columns={columns}
        getRowKey={(setting) => setting.id}
        loading={settingsQuery.isLoading}
        emptyIcon={<Inventory2Outlined />}
        emptyTitle={t('empty')}
        pagination={{
          page,
          rowsPerPage: perPage,
          count: meta?.total ?? 0,
          onPageChange: setPage,
          onRowsPerPageChange: (nextPerPage) => {
            setPerPage(nextPerPage)
            setPage(0)
          },
        }}
        rowActions={(setting) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteSetting.isPending}
            onEdit={() => openEditForm(setting)}
            onDelete={() => setDeletingSetting(setting)}
          />
        )}
      />

      <WarehouseProductSettingFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingSetting?.id ?? 'new'}`}
        open={formOpen}
        setting={editingSetting}
        warehouses={warehouses}
        products={products}
        rackLocations={rackLocations}
        suppliers={suppliers}
        isLoadingOptions={isLoadingOptions}
        isSaving={createSetting.isPending || updateSetting.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingSetting}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingSetting ? productName(deletingSetting) : '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteSetting.isPending}
        onClose={() => setDeletingSetting(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
