'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { Add, Inventory2Outlined, Search } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
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

const rowsPerPageOptions = [10, 25, 50]

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

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Inventory2Outlined color="primary" />
            <Typography variant="h4">{t('title')}</Typography>
          </Stack>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            {t('subtitle')}
          </Typography>
        </Box>
        {canCreate && (
          <Button startIcon={<Add />} variant="contained" onClick={openCreateForm}>
            {t('actions.new')}
          </Button>
        )}
      </Stack>

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { xs: 'stretch', md: 'center' }, mb: 2.5 }}>
            <TextField
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(0)
              }}
              placeholder={t('filters.search')}
              sx={{ flexGrow: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
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
              sx={{ minWidth: { xs: '100%', md: 260 } }}
            />
            <TextField
              select
              value={activeFilter}
              label={t('filters.status')}
              onChange={(event) => {
                setActiveFilter(event.target.value as 'all' | 'active' | 'inactive')
                setPage(0)
              }}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
            >
              <MenuItem value="all">{t('filters.allStatuses')}</MenuItem>
              <MenuItem value="active">{t('status.active')}</MenuItem>
              <MenuItem value="inactive">{t('status.inactive')}</MenuItem>
            </TextField>
          </Stack>

          {[settingsQuery, warehousesQuery, productsQuery, rackLocationsQuery, suppliersQuery].map((query, index) => (
            query.isError ? (
              <Alert key={index} severity="error" sx={{ mb: 2 }}>
                {toAppApiError(query.error).message}
              </Alert>
            ) : null
          ))}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.product')}</TableCell>
                  <TableCell>{t('columns.warehouse')}</TableCell>
                  <TableCell>{t('columns.rackLocation')}</TableCell>
                  <TableCell>{t('columns.reorder')}</TableCell>
                  <TableCell>{t('columns.minMax')}</TableCell>
                  <TableCell>{t('columns.supplier')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell align="center">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {settingsQuery.isLoading && <TableStateRow colSpan={8} loading />}

                {!settingsQuery.isLoading && settings.length === 0 && (
                  <TableStateRow colSpan={8} message={t('empty')} />
                )}

                {settings.map((setting) => (
                  <TableRow key={setting.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2">{productName(setting)}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {[setting.product?.sku, setting.variation?.sku].filter(Boolean).join(' / ') || '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="body2">{setting.warehouse?.name ?? '-'}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {[setting.warehouse?.code, setting.warehouse?.branch?.name].filter(Boolean).join(' / ') || '-'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{setting.rack_location ? `${setting.rack_location.name} (${setting.rack_location.code})` : '-'}</TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{t('fields.reorder_point')}: {numberText(setting.reorder_point)}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {t('fields.reorder_quantity')}: {numberText(setting.reorder_quantity)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">{t('fields.min_stock_alert')}: {numberText(setting.min_stock_alert)}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {t('fields.max_stock_level')}: {numberText(setting.max_stock_level)}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{setting.preferred_supplier?.name ?? '-'}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={setting.is_active ? 'success' : 'default'}
                        label={setting.is_active ? t('status.active') : t('status.inactive')}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteSetting.isPending}
                        onEdit={() => openEditForm(setting)}
                        onDelete={() => setDeletingSetting(setting)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={meta?.total ?? 0}
            page={page}
            rowsPerPage={perPage}
            rowsPerPageOptions={rowsPerPageOptions}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            onRowsPerPageChange={(event) => {
              setPerPage(Number(event.target.value))
              setPage(0)
            }}
          />
        </CardContent>
      </Card>

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
