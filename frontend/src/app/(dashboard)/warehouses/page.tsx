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
import { Add, WarehouseOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { useBranchesQuery } from '@/features/branches/hooks'
import { WarehouseFormDialog } from '@/features/warehouses/WarehouseFormDialog'
import {
  useCreateWarehouseMutation,
  useDeleteWarehouseMutation,
  useUpdateWarehouseMutation,
  useWarehousesQuery,
} from '@/features/warehouses/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { BranchFilters } from '@/types/branch'
import type { Warehouse, WarehouseFilters, WarehousePayload, WarehouseType } from '@/types/warehouse'

const warehouseTypes: WarehouseType[] = ['main', 'transit', 'returns', 'damaged']

export default function WarehousesPage() {
  const { t } = useTranslation(['warehouses', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<WarehouseFilters['type']>('')
  const [branchFilter, setBranchFilter] = useState<WarehouseFilters['branch_id']>('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [deletingWarehouse, setDeletingWarehouse] = useState<Warehouse | null>(null)

  const filters: WarehouseFilters = useMemo(
    () => ({
      search: search || undefined,
      type: typeFilter,
      branch_id: branchFilter,
      page: page + 1,
      per_page: perPage,
    }),
    [branchFilter, page, perPage, search, typeFilter]
  )

  const branchFilters: BranchFilters = useMemo(
    () => ({
      is_active: true,
      per_page: 100,
    }),
    []
  )

  const warehousesQuery = useWarehousesQuery(filters)
  const branchesQuery = useBranchesQuery(branchFilters)
  const createWarehouse = useCreateWarehouseMutation()
  const updateWarehouse = useUpdateWarehouseMutation()
  const deleteWarehouse = useDeleteWarehouseMutation()

  const warehouses = warehousesQuery.data?.data ?? []
  const branches = branchesQuery.data?.data ?? []
  const meta = warehousesQuery.data?.meta
  const canCreate = can('warehouses.create')
  const canEdit = can('warehouses.edit')
  const canDelete = can('warehouses.delete')

  const columns: EntityTableColumn<Warehouse>[] = useMemo(
    () => [
      {
        key: 'warehouse',
        label: t('columns.warehouse'),
        render: (warehouse) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{warehouse.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {warehouse.code}
            </Typography>
          </Stack>
        ),
      },
      { key: 'type', label: t('columns.type'), render: (warehouse) => t(`type.${warehouse.type}`) },
      { key: 'branch', label: t('columns.branch'),
        render: (warehouse) => warehouse.branch?.name ?? t('placeholders.noBranch') },
      {
        key: 'stockPolicy',
        label: t('columns.stockPolicy'),
        render: (warehouse) => (
          warehouse.allow_negative_stock ? (
            <Chip size="small" color="warning" label={t('badges.negativeStock')} />
          ) : '-'
        ),
      },
      {
        key: 'default',
        label: t('columns.default'),
        render: (warehouse) => (
          warehouse.is_default ? (
            <Chip size="small" color="primary" label={t('badges.default')} />
          ) : '-'
        ),
      },
      {
        key: 'status',
        label: t('columns.status'),
        render: (warehouse) => (
          <Chip
            size="small"
            label={warehouse.is_active ? t('common:status.active') : t('common:status.inactive')}
            color={warehouse.is_active ? 'success' : 'default'}
          />
        ),
      },
    ],
    [t]
  )

  const openCreateForm = () => {
    setEditingWarehouse(null)
    setFormOpen(true)
  }

  const openEditForm = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: WarehousePayload) => {
    if (editingWarehouse) {
      await updateWarehouse.mutateAsync({ id: editingWarehouse.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createWarehouse.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingWarehouse) return

    try {
      await deleteWarehouse.mutateAsync(deletingWarehouse.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingWarehouse(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  const handleSearchChange = (nextSearch: string) => {
    setSearch(nextSearch)
    setPage(0)
  }

  const handleTypeFilterChange = (nextValue: string) => {
    setTypeFilter(nextValue as WarehouseFilters['type'])
    setPage(0)
  }

  const handleBranchFilterChange = (nextValue: string) => {
    setBranchFilter(nextValue)
    setPage(0)
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        icon={<WarehouseOutlined color="primary" />}
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
        onSearchChange={(value) => { setSearch(value); setPage(0) }}
        filters={
          <>
            <TextField
              select
              value={typeFilter}
              onChange={(event) => handleTypeFilterChange(event.target.value)}
              label={t('filters.type')}
              sx={{ minWidth: { xs: '100%', sm: 180 } }}
            >
              <MenuItem value="">{t('filters.allTypes')}</MenuItem>
              {warehouseTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {t(`type.${type}`)}
                </MenuItem>
              ))}
            </TextField>
            <SearchableFilterSelect
              value={branchFilter ?? ''}
              options={branches}
              loading={branchesQuery.isLoading}
              label={t('filters.branch')}
              placeholder={t('filters.allBranches')}
              getOptionValue={(branch) => branch.id}
              getOptionLabel={(branch) => branch.name}
              getOptionDescription={(branch) => branch.code}
              onChange={handleBranchFilterChange}
              sx={{ minWidth: { xs: '100%', sm: 220 } }}
            />
          </>
        }
      />

      {warehousesQuery.isError && (
        <Alert severity="error">{toAppApiError(warehousesQuery.error).message}</Alert>
      )}

      {branchesQuery.isError && (
        <Alert severity="warning">{toAppApiError(branchesQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={warehouses}
        columns={columns}
        getRowKey={(warehouse) => warehouse.id}
        loading={warehousesQuery.isLoading}
        emptyIcon={<WarehouseOutlined />}
        emptyTitle={t('empty')}
        emptyDescription="Try changing your filters or create a new warehouse."
        pagination={{
          page,
          rowsPerPage: perPage,
          count: meta?.total ?? 0,
          onPageChange: setPage,
          onRowsPerPageChange: (nextPerPage) => { setPerPage(nextPerPage); setPage(0) },
        }}
        rowActions={(warehouse) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteWarehouse.isPending}
            onEdit={() => openEditForm(warehouse)}
            onDelete={() => setDeletingWarehouse(warehouse)}
          />
        )}
      />

      <WarehouseFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingWarehouse?.id ?? 'new'}`}
        open={formOpen}
        warehouse={editingWarehouse}
        branches={branches}
        isSaving={createWarehouse.isPending || updateWarehouse.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingWarehouse}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingWarehouse?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteWarehouse.isPending}
        onClose={() => setDeletingWarehouse(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
