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
import { Add, Search, StraightenOutlined } from '@mui/icons-material'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { TableStateRow } from '@/components/ui/TableStateRow'
import { UnitFormDialog } from '@/features/units/UnitFormDialog'
import {
  useCreateUnitMutation,
  useDeleteUnitMutation,
  useUnitsQuery,
  useUpdateUnitMutation,
} from '@/features/units/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { Unit, UnitFilters, UnitPayload } from '@/types/unit'

const rowsPerPageOptions = [10, 25, 50]

export default function UnitsPage() {
  const { t } = useTranslation(['units', 'common'])
  const { enqueueSnackbar } = useSnackbar()
  const can = useAuthStore((state) => state.can)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [perPage, setPerPage] = useState(10)
  const [formOpen, setFormOpen] = useState(false)
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null)

  const filters: UnitFilters = useMemo(
    () => ({
      search: search || undefined,
      page: page + 1,
      per_page: perPage,
    }),
    [page, perPage, search]
  )

  const unitsQuery = useUnitsQuery(filters)
  const createUnit = useCreateUnitMutation()
  const updateUnit = useUpdateUnitMutation()
  const deleteUnit = useDeleteUnitMutation()

  const units = unitsQuery.data?.data ?? []
  const meta = unitsQuery.data?.meta
  const canCreate = can('units.create')
  const canEdit = can('units.edit')
  const canDelete = can('units.delete')

  const openCreateForm = () => {
    setEditingUnit(null)
    setFormOpen(true)
  }

  const openEditForm = (unit: Unit) => {
    setEditingUnit(unit)
    setFormOpen(true)
  }

  const handleSubmit = async (payload: UnitPayload) => {
    if (editingUnit) {
      await updateUnit.mutateAsync({ id: editingUnit.id, payload })
      enqueueSnackbar(t('messages.updated'), { variant: 'success' })
      return
    }

    await createUnit.mutateAsync(payload)
    enqueueSnackbar(t('messages.created'), { variant: 'success' })
    setPage(0)
  }

  const handleDelete = async () => {
    if (!deletingUnit) return

    try {
      await deleteUnit.mutateAsync(deletingUnit.id)
      enqueueSnackbar(t('messages.deleted'), { variant: 'success' })
      setDeletingUnit(null)
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
            <StraightenOutlined color="primary" />
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
          <TextField
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(0)
            }}
            placeholder={t('filters.search')}
            sx={{ mb: 2.5, width: '100%' }}
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

          {unitsQuery.isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {toAppApiError(unitsQuery.error).message}
            </Alert>
          )}

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('columns.unit')}</TableCell>
                  <TableCell>{t('columns.decimal')}</TableCell>
                  <TableCell>{t('columns.subUnits')}</TableCell>
                  <TableCell align="right">{t('columns.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {unitsQuery.isLoading && <TableStateRow colSpan={4} loading />}

                {!unitsQuery.isLoading && units.length === 0 && (
                  <TableStateRow colSpan={4} message={t('empty')} />
                )}

                {units.map((unit) => (
                  <TableRow key={unit.id} hover>
                    <TableCell>
                      <Stack spacing={0.25}>
                        <Typography variant="subtitle2">{unit.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {unit.short_name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={unit.allow_decimal ? t('labels.decimalAllowed') : t('labels.wholeOnly')}
                        color={unit.allow_decimal ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {unit.sub_units.length > 0 ? (
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                          {unit.sub_units.map((subUnit) => (
                            <Chip
                              key={subUnit.id}
                              size="small"
                              label={t('labels.subUnitChip', {
                                name: subUnit.name,
                                factor: subUnit.conversion_factor,
                              })}
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          {t('labels.noSubUnits')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <RowActions
                        editLabel={t('common:buttons.edit')}
                        deleteLabel={t('common:buttons.delete')}
                        showEdit={canEdit}
                        showDelete={canDelete}
                        deleteDisabled={deleteUnit.isPending}
                        onEdit={() => openEditForm(unit)}
                        onDelete={() => setDeletingUnit(unit)}
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

      <UnitFormDialog
        key={`${formOpen ? 'open' : 'closed'}-${editingUnit?.id ?? 'new'}`}
        open={formOpen}
        unit={editingUnit}
        isSaving={createUnit.isPending || updateUnit.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deletingUnit}
        title={t('deleteDialog.title')}
        message={t('deleteDialog.message', { name: deletingUnit?.name ?? '' })}
        confirmText={t('deleteDialog.confirm')}
        cancelText={t('common:buttons.cancel')}
        loading={deleteUnit.isPending}
        onClose={() => setDeletingUnit(null)}
        onConfirm={handleDelete}
      />
    </Stack>
  )
}
