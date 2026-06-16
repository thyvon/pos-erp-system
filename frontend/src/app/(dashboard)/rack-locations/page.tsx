'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Stack,
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
import { RackLocationFormDialog } from '@/features/rack-locations/RackLocationFormDialog'
import {
  useCreateRackLocationMutation,
  useDeleteRackLocationMutation,
  useRackLocationsQuery,
  useUpdateRackLocationMutation,
} from '@/features/rack-locations/hooks'
import { useWarehousesQuery } from '@/features/warehouses/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { RackLocation, RackLocationFilters, RackLocationPayload } from '@/types/rackLocation'
import type { WarehouseFilters } from '@/types/warehouse'

export default function RackLocationsPage() {
  const { t } = useTranslation(['rackLocations', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRackLocation, setEditingRackLocation] = useState<RackLocation | null>(null)
  const [deletingRackLocation, setDeletingRackLocation] = useState<RackLocation | null>(null)

  const filters: RackLocationFilters = useMemo(
    () => ({
      search: search || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search]
  )

  const warehouseFilters: WarehouseFilters = useMemo(
    () => ({
      per_page: 100,
    }),
    []
  )

  const rackLocationsQuery = useRackLocationsQuery(filters)
  const warehousesQuery = useWarehousesQuery(warehouseFilters)
  const createRackLocation = useCreateRackLocationMutation()
  const updateRackLocation = useUpdateRackLocationMutation()
  const deleteRackLocation = useDeleteRackLocationMutation()

  const rackLocations = rackLocationsQuery.data?.data ?? []
  const warehouses = warehousesQuery.data?.data ?? []
  const meta = rackLocationsQuery.data?.meta
  const canCreate = can('rack_locations.create')
  const canEdit = can('rack_locations.edit')
  const canDelete = can('rack_locations.delete')

  const openCreateForm = () => {
    setEditingRackLocation(null)
    setFormOpen(true)
  }

  const openEditForm = (rackLocation: RackLocation) => {
    setEditingRackLocation(rackLocation)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: RackLocationPayload) => {
    if (editingRackLocation) {
      await updateRackLocation.mutateAsync({ id: editingRackLocation.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createRackLocation.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingRackLocation) return

    try {
      await deleteRackLocation.mutateAsync(deletingRackLocation.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingRackLocation(null)
    } catch (error) {
      const apiError = toAppApiError(error)
      enqueueSnackbar(apiError.message, { variant: 'error' })
    }
  }

  const columns: EntityTableColumn<RackLocation>[] = useMemo(
    () => [
      {
        key: 'location',
        label: t('columns.location'),
        render: (rackLocation) => (
          <Stack spacing={0.5}>
            <Typography variant="subtitle2">{rackLocation.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {rackLocation.code}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'warehouse',
        label: t('columns.warehouse'),
        render: (rackLocation) =>
          rackLocation.warehouse ? (
            <Stack spacing={0.5}>
              <Typography variant="body2">{rackLocation.warehouse.name}</Typography>
              {rackLocation.warehouse.code && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {rackLocation.warehouse.code}
                </Typography>
              )}
            </Stack>
          ) : (
            '-'
          ),
      },
      {
        key: 'branch',
        label: t('columns.branch'),
        render: (rackLocation) => rackLocation.warehouse?.branch?.name ?? '-',
      },
      {
        key: 'description',
        label: t('columns.description'),
        render: (rackLocation) => (
          <Typography
            variant="body2"
            sx={{
              maxWidth: 420,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {rackLocation.description || '-'}
          </Typography>
        ),
      },
    ],
    [t]
  )

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
        onSearchChange={(value) => {
          setSearch(value)
          setPage(0)
        }}
      />

      {rackLocationsQuery.isError && (
        <Alert severity="error">{toAppApiError(rackLocationsQuery.error).message}</Alert>
      )}

      {warehousesQuery.isError && (
        <Alert severity="error">{toAppApiError(warehousesQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={rackLocations}
        columns={columns}
        getRowKey={(rackLocation) => rackLocation.id}
        loading={rackLocationsQuery.isLoading}
        emptyIcon={<WarehouseOutlined />}
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
        rowActions={(rackLocation) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteRackLocation.isPending}
            onEdit={() => openEditForm(rackLocation)}
            onDelete={() => setDeletingRackLocation(rackLocation)}
          />
        )}
      />

      <RackLocationFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingRackLocation?.id ?? 'new'}`}
        open={formOpen}
        rackLocation={editingRackLocation}
        warehouses={warehouses}
        isLoadingWarehouses={warehousesQuery.isLoading}
        isSaving={createRackLocation.isPending || updateRackLocation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingRackLocation}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingRackLocation?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteRackLocation.isPending}
        onClose={() => setDeletingRackLocation(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
