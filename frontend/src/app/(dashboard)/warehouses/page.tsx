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
import { Add, Search, WarehouseOutlined } from '@/components/ui/icons'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { SearchableFilterSelect } from '@/components/ui/SearchableFilterSelect'
import { TableStateRow } from '@/components/ui/TableStateRow'
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

const rowsPerPageOptions = [10, 25, 50]
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
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'stretch', md: 'center' }, mb: 2.5 }}
          >
            <TextField
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
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
            <TextField
              select
              value={typeFilter}
              onChange={(event) => handleTypeFilterChange(event.target.value)}
              label={t('filters.type')}
              sx={{ minWidth: { xs: '100%', md: 180 } }}
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
              sx={{ minWidth: { xs: '100%', md: 220 } }}
            />
          </Stack>

          {warehousesQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(warehousesQuery.error).message}
            </Alert>
          )}

          {branchesQuery.isError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {toAppApiError(branchesQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.warehouse')}</TableCell>
                  <TableCell>{t('columns.type')}</TableCell>
                  <TableCell>{t('columns.branch')}</TableCell>
                  <TableCell>{t('columns.stockPolicy')}</TableCell>
                  <TableCell>{t('columns.default')}</TableCell>
                  <TableCell>{t('columns.status')}</TableCell>
                  <TableCell align="right">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {warehousesQuery.isLoading && <TableStateRow colSpan={7} loading />}

                {!warehousesQuery.isLoading && warehouses.length === 0 && (
                  <TableStateRow colSpan={7} message={t('empty')} />
                )}

                {warehouses.map((warehouse) => (
                  <TableRow key={warehouse.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{warehouse.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {warehouse.code}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>{t(`type.${warehouse.type}`)}</TableCell>
                    <TableCell>{warehouse.branch?.name ?? t('placeholders.noBranch')}</TableCell>
                    <TableCell>
                      {warehouse.allow_negative_stock ? (
                        <Chip size="small" color="warning" label={t('badges.negativeStock')} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {warehouse.is_default ? (
                        <Chip size="small" color="primary" label={t('badges.default')} />
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={warehouse.is_active ? t('common:status.active') : t('common:status.inactive')}
                        color={warehouse.is_active ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteWarehouse.isPending}
                        onEdit={() => openEditForm(warehouse)}
                        onDelete={() => setDeletingWarehouse(warehouse)}
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
