'use client'

import { useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Chip,
  Stack,
  Typography,
} from '@mui/material'
import { Add, StraightenOutlined } from '@/components/ui/icons'
import PageHeader from '@/components/common/PageHeader'
import PageToolbar from '@/components/common/PageToolbar'
import EntityTable, { type EntityTableColumn } from '@/components/common/EntityTable'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'
import { toAppApiError } from '@/api/errors'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { RowActions } from '@/components/ui/RowActions'
import { UnitFormDialog } from '@/features/units/UnitFormDialog'
import {
  useCreateUnitMutation,
  useDeleteUnitMutation,
  useUnitsQuery,
  useUpdateUnitMutation,
} from '@/features/units/hooks'
import { useAuthStore } from '@/stores/authStore'
import type { Unit, UnitFilters, UnitPayload } from '@/types/unit'

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

  const columns: EntityTableColumn<Unit>[] = useMemo(
    () => [
      {
        key: 'unit',
        label: t('columns.unit'),
        render: (unit) => (
          <Stack spacing={0.25}>
            <Typography variant="subtitle2">{unit.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {unit.short_name}
            </Typography>
          </Stack>
        ),
      },
      {
        key: 'decimal',
        label: t('columns.decimal'),
        render: (unit) => (
          <Chip
            size="small"
            label={unit.allow_decimal ? t('labels.decimalAllowed') : t('labels.wholeOnly')}
            color={unit.allow_decimal ? 'primary' : 'default'}
            variant="outlined"
          />
        ),
      },
      {
        key: 'subUnits',
        label: t('columns.subUnits'),
        render: (unit) => (
          unit.sub_units.length > 0 ? (
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
          )
        ),
      },
    ],
    [t]
  )

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
    <Stack spacing={2.5}>
      <PageHeader
        icon={<StraightenOutlined color="primary" />}
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
      />

      {unitsQuery.isError && (
        <Alert severity="error">{toAppApiError(unitsQuery.error).message}</Alert>
      )}

      <EntityTable
        rows={units}
        columns={columns}
        getRowKey={(unit) => unit.id}
        loading={unitsQuery.isLoading}
        emptyIcon={<StraightenOutlined />}
        emptyTitle={t('empty')}
        emptyDescription="Try changing your filters or create a new unit."
        pagination={{
          page,
          rowsPerPage: perPage,
          count: meta?.total ?? 0,
          onPageChange: setPage,
          onRowsPerPageChange: (nextPerPage) => { setPerPage(nextPerPage); setPage(0) },
        }}
        rowActions={(unit) => (
          <RowActions
            editLabel={t('common:buttons.edit')}
            deleteLabel={t('common:buttons.delete')}
            showEdit={canEdit}
            showDelete={canDelete}
            deleteDisabled={deleteUnit.isPending}
            onEdit={() => openEditForm(unit)}
            onDelete={() => setDeletingUnit(unit)}
          />
        )}
      />

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
