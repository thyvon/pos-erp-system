'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  InputAdornment,
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
import { Add, Search, WarehouseOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
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

const rowsPerPageOptions = [10, 25, 50]

export default function RackLocationsPage() {
  const { t } = useTranslation(['rackLocations', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [warehouseFilter, setWarehouseFilter] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingRackLocation, setEditingRackLocation] = useState<RackLocation | null>(null)
  const [deletingRackLocation, setDeletingRackLocation] = useState<RackLocation | null>(null)

  const filters: RackLocationFilters = useMemo(
    () => ({
      search: search || undefined,
      warehouse_id: warehouseFilter || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search, warehouseFilter]
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

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ alignItems: { xs: 'stretch', sm: 'center' }, justifyContent: 'space-between' }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <WarehouseOutlined color="primary" />
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
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', md: 'center' }, mb: 2.5 }}
          >
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
          </Stack>

          {rackLocationsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(rackLocationsQuery.error).message}
            </Alert>
          )}

          {warehousesQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(warehousesQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.location')}</TableCell>
                  <TableCell>{t('columns.warehouse')}</TableCell>
                  <TableCell>{t('columns.branch')}</TableCell>
                  <TableCell>{t('columns.description')}</TableCell>
                  <TableCell align="center">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rackLocationsQuery.isLoading && <TableStateRow colSpan={5} loading />}

                {!rackLocationsQuery.isLoading && rackLocations.length === 0 && (
                  <TableStateRow colSpan={5} message={t('empty')} />
                )}

                {rackLocations.map((rackLocation) => (
                  <TableRow key={rackLocation.id} hover>
                    <TableCell>
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle2">{rackLocation.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {rackLocation.code}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {rackLocation.warehouse ? (
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
                      )}
                    </TableCell>
                    <TableCell>{rackLocation.warehouse?.branch?.name ?? '-'}</TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell align="center">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteRackLocation.isPending}
                        onEdit={() => openEditForm(rackLocation)}
                        onDelete={() => setDeletingRackLocation(rackLocation)}
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
